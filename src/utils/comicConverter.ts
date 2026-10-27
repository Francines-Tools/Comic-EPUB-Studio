/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { ComicMetadata, ConversionOptions } from '../types';
import { guessMetadataFromFilename } from './filenameGuesser';

export interface ExtractedArchive {
  images: { filename: string; blob: Blob }[];
  comicInfoText?: string | null;
  coverImage?: { filename: string; blob: Blob };
}

/**
 * Checks if a filename is an image
 */
export function isImageFile(filename: string): boolean {
  return /\.(jpe?g|png|webp|avif|gif)$/i.test(filename) && !filename.includes('__MACOSX') && !filename.startsWith('.');
}

/**
 * Natural filename sorting (e.g., page 2 before page 10)
 */
export function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Fast inspection to extract cover image and metadata for early UI preview.
 * If ComicInfo.xml is missing, it pre-populates fields with smart guesses from the filename.
 */
export async function peekComicCoverAndMeta(file: File): Promise<{
  meta: ComicMetadata;
  coverBlob?: Blob;
  coverUrl?: string;
  coverDimensions?: { width: number; height: number };
}> {
  const baseFilename = file.name.replace(/\.[^/.]+$/, '');
  let comicInfoText: string | null = null;
  let coverBlob: Blob | undefined;
  let pageCount = 0;

  const isZip = file.name.toLowerCase().endsWith('.cbz') || file.name.toLowerCase().endsWith('.zip');

  if (isZip) {
    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const allFiles = Object.keys(zip.files).sort(naturalSort);

      const imageFiles: string[] = [];
      let coverCandidate: string | null = null;

      for (const name of allFiles) {
        const entry = zip.files[name];
        if (entry.dir || name.includes('__MACOSX')) continue;

        if (name.toLowerCase().endsWith('comicinfo.xml') && !comicInfoText) {
          comicInfoText = await entry.async('text');
        } else if (isImageFile(name)) {
          imageFiles.push(name);
          if (!coverCandidate && /cover|folder|front/i.test(name)) {
            coverCandidate = name;
          }
        }
      }

      pageCount = imageFiles.length;
      const targetCoverFile = coverCandidate || imageFiles[0];

      if (targetCoverFile) {
        coverBlob = await zip.files[targetCoverFile].async('blob');
      }
    } catch (e) {
      console.warn('Zip peek failed, will attempt fallback during conversion', e);
    }
  } else {
    // Attempt Unarchiver if loaded on window
    const win = window as unknown as { Unarchiver?: { open: (f: File) => Promise<{ entries: { name: string; is_file: boolean; read: () => Promise<Blob> }[] }> } };
    if (win.Unarchiver) {
      try {
        const archive = await win.Unarchiver.open(file);
        const validEntries = archive.entries
          .filter(e => e.is_file && !e.name.includes('__MACOSX'))
          .sort((a, b) => naturalSort(a.name, b.name));

        const imageEntries: { name: string; read: () => Promise<Blob> }[] = [];
        let coverEntryCandidate: { name: string; read: () => Promise<Blob> } | null = null;

        for (const entry of validEntries) {
          if (entry.name.toLowerCase().endsWith('comicinfo.xml') && !comicInfoText) {
            const xmlBlob = await entry.read();
            comicInfoText = await xmlBlob.text();
          } else if (isImageFile(entry.name)) {
            imageEntries.push(entry);
            if (!coverEntryCandidate && /cover|folder|front/i.test(entry.name)) {
              coverEntryCandidate = entry;
            }
          }
        }

        pageCount = imageEntries.length;
        const targetCover = coverEntryCandidate || imageEntries[0];
        if (targetCover) {
          coverBlob = await targetCover.read();
        }
      } catch (err) {
        console.warn('Unarchiver peek failed:', err);
      }
    }
  }

  const hasDetectedMetadata = Boolean(comicInfoText);
  const parsedInfo = comicInfoText ? parseComicInfo(comicInfoText) : null;
  const guessed = guessMetadataFromFilename(file.name);

  const finalTitle = parsedInfo?.title || guessed.title || baseFilename;
  const meta: ComicMetadata = {
    title: finalTitle,
    series: parsedInfo?.series || guessed.series,
    number: parsedInfo?.number || guessed.number,
    volume: parsedInfo?.volume || guessed.volume,
    year: parsedInfo?.year || guessed.year,
    genre: parsedInfo?.genre || guessed.genre,
    writer: parsedInfo?.writer || guessed.writer,
    penciller: parsedInfo?.penciller || guessed.penciller,
    publisher: parsedInfo?.publisher || guessed.publisher,
    summary: parsedInfo?.summary || guessed.summary,
    language: parsedInfo?.language || guessed.language || 'en',
    manga: parsedInfo?.manga || guessed.manga,
    pageCount: pageCount || 0,
    outputFilename: `${finalTitle.replace(/[\/\\?%*:|"<>]/g, '_')}.epub`,
    hasDetectedMetadata,
  };

  let coverUrl: string | undefined;
  let coverDimensions: { width: number; height: number } | undefined;

  if (coverBlob) {
    coverUrl = URL.createObjectURL(coverBlob);
    try {
      coverDimensions = await getImageDimensions(coverBlob);
    } catch {
      coverDimensions = { width: 1200, height: 1600 };
    }
  }

  return { meta, coverBlob, coverUrl, coverDimensions };
}

/**
 * Universal archive extraction for CBZ/ZIP and CBR/RAR
 */
export async function extractArchive(
  file: File,
  onProgress?: (percent: number, msg: string) => void
): Promise<ExtractedArchive> {
  const images: { filename: string; blob: Blob }[] = [];
  let comicInfoText: string | null = null;

  const isZip = file.name.toLowerCase().endsWith('.cbz') || file.name.toLowerCase().endsWith('.zip');

  if (isZip) {
    onProgress?.(15, 'Reading CBZ/ZIP archive contents...');
    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const sortedFilenames = Object.keys(zip.files).sort(naturalSort);

      let idx = 0;
      const total = sortedFilenames.length;

      for (const filename of sortedFilenames) {
        idx++;
        const zipEntry = zip.files[filename];
        if (zipEntry.dir || filename.includes('__MACOSX')) continue;

        if (filename.toLowerCase().endsWith('comicinfo.xml') && !comicInfoText) {
          comicInfoText = await zipEntry.async('text');
        } else if (isImageFile(filename)) {
          const blob = await zipEntry.async('blob');
          images.push({ filename, blob });
        }

        if (idx % 10 === 0 || idx === total) {
          onProgress?.(15 + Math.round((idx / total) * 25), `Extracting pages (${images.length} found)...`);
        }
      }

      if (images.length > 0) {
        return findCoverAndReturn(images, comicInfoText);
      }
    } catch (zipErr) {
      console.warn('ZIP extraction failed, attempting Unarchiver fallback:', zipErr);
    }
  }

  // Use Unarchiver for CBR/RAR or fallback
  onProgress?.(20, 'Opening CBR archive via Unarchiver...');
  const win = window as unknown as { Unarchiver?: { open: (f: File) => Promise<{ entries: { name: string; is_file: boolean; read: () => Promise<Blob> }[] }> } };
  
  if (!win.Unarchiver) {
    throw new Error('Archive decoder not ready. Please ensure Unarchiver script has finished loading or try a .CBZ file.');
  }

  const archive = await win.Unarchiver.open(file);
  const sortedEntries = archive.entries
    .filter(e => e.is_file && !e.name.includes('__MACOSX'))
    .sort((a, b) => naturalSort(a.name, b.name));

  let count = 0;
  const totalEntries = sortedEntries.length;

  for (const entry of sortedEntries) {
    count++;
    if (entry.name.toLowerCase().endsWith('comicinfo.xml') && !comicInfoText) {
      const blob = await entry.read();
      comicInfoText = await blob.text();
    } else if (isImageFile(entry.name)) {
      const blob = await entry.read();
      images.push({ filename: entry.name, blob });
    }

    if (count % 5 === 0 || count === totalEntries) {
      onProgress?.(20 + Math.round((count / totalEntries) * 20), `Decompressing pages (${images.length} found)...`);
    }
  }

  if (images.length === 0) {
    throw new Error('No readable comic pages or images found inside this archive.');
  }

  return findCoverAndReturn(images, comicInfoText);
}

function findCoverAndReturn(
  images: { filename: string; blob: Blob }[],
  comicInfoText: string | null
): ExtractedArchive {
  images.sort((a, b) => naturalSort(a.filename, b.filename));

  let coverIdx = images.findIndex(img => /cover|front|folder/i.test(img.filename));
  if (coverIdx === -1) coverIdx = 0;

  if (coverIdx > 0) {
    const [cover] = images.splice(coverIdx, 1);
    images.unshift(cover);
  }

  return {
    images,
    comicInfoText,
    coverImage: images[0],
  };
}

/**
 * Parse ComicInfo.xml metadata
 */
export function parseComicInfo(xmlText: string): Partial<ComicMetadata> | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    const getVal = (tag: string) => xmlDoc.querySelector(tag)?.textContent?.trim() || '';

    const series = getVal('Series');
    const number = getVal('Number');
    const volume = getVal('Volume');
    let title = getVal('Title');

    if (series && number) {
      title = `${series} #${number}${title ? ` - ${title}` : ''}`;
    } else if (series) {
      title = series;
    }

    return {
      title: title || undefined,
      series: series || undefined,
      number: number || undefined,
      volume: volume || undefined,
      genre: getVal('Genre') || undefined,
      year: getVal('Year') || undefined,
      writer: getVal('Writer') || getVal('Penciller') || undefined,
      penciller: getVal('Penciller') || undefined,
      publisher: getVal('Publisher') || undefined,
      summary: getVal('Summary') || undefined,
      manga: getVal('Manga') || undefined,
      language: getVal('LanguageISO') || 'en',
    };
  } catch (err) {
    console.warn('Failed to parse ComicInfo.xml', err);
    return null;
  }
}

/**
 * Fast dimension reader
 */
export async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(blob);
      const dims = { width: bmp.width, height: bmp.height };
      bmp.close();
      return dims;
    } catch {
      // fallback to Image
    }
  }

  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || 1200, height: img.naturalHeight || 1600 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 1200, height: 1600 });
    };
    img.src = url;
  });
}

/**
 * Optional image resize & color enhancement
 */
export async function processImage(
  blob: Blob,
  maxRes: number,
  colorMode: 'original' | 'grayscale',
  quality = 0.85
): Promise<Blob> {
  if (maxRes === 0 && colorMode === 'original') {
    return blob;
  }

  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      try {
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (maxRes > 0 && (w > maxRes || h > maxRes)) {
          if (w > h) {
            h = Math.round((h * maxRes) / w);
            w = maxRes;
          } else {
            w = Math.round((w * maxRes) / h);
            h = maxRes;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(blob);
          return;
        }

        if (colorMode === 'grayscale') {
          ctx.filter = 'grayscale(100%) contrast(108%)';
        }

        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          resultBlob => {
            resolve(resultBlob || blob);
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        console.warn('Image processing error:', err);
        resolve(blob);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
}

/**
 * Builds compliant EPUB 3 with the cover image as official cover & thumbnail,
 * including genre, series, and author metadata.
 */
export async function generateEpub(
  extracted: ExtractedArchive,
  metadata: ComicMetadata,
  options: ConversionOptions,
  onProgress?: (percent: number, msg: string) => void
): Promise<Blob> {
  const epubZip = new JSZip();

  // 1. mimetype (first file, uncompressed STORE)
  epubZip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  epubZip.folder('META-INF')!.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const oebps = epubZip.folder('OEBPS')!;
  const imagesFolder = oebps.folder('images')!;
  const textFolder = oebps.folder('text')!;

  // 3. Stylesheet for comic pages
  oebps.file(
    'style.css',
    `@page { margin: 0; padding: 0; }
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #000000;
  overflow: hidden;
}
.comic-viewport {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.comic-page {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
svg {
  display: block;
  width: 100%;
  height: 100%;
}`
  );

  // 4. Process images and build XHTML spine
  const total = extracted.images.length;
  onProgress?.(50, `Optimizing ${total} pages and configuring EPUB cover...`);

  const processedPages: {
    pageNumber: number;
    isCover: boolean;
    imageFilename: string;
    xhtmlFilename: string;
    blob: Blob;
    width: number;
    height: number;
  }[] = [];

  for (let i = 0; i < total; i++) {
    const raw = extracted.images[i];
    const isCover = i === 0;

    const processedBlob = await processImage(raw.blob, options.maxRes, options.colorMode, options.quality);
    const dims = await getImageDimensions(processedBlob);

    const imageFilename = isCover ? 'cover.jpg' : `page_${String(i + 1).padStart(4, '0')}.jpg`;
    const xhtmlFilename = isCover ? 'cover.xhtml' : `page_${String(i + 1).padStart(4, '0')}.xhtml`;

    processedPages.push({
      pageNumber: i + 1,
      isCover,
      imageFilename,
      xhtmlFilename,
      blob: processedBlob,
      width: dims.width,
      height: dims.height,
    });

    if (i % 5 === 0 || i === total - 1) {
      onProgress?.(50 + Math.round(((i + 1) / total) * 30), `Processed ${i + 1} of ${total} pages...`);
    }
  }

  // 5. Build OPF manifest, spine, nav landmarks & NCX
  const manifestItems: string[] = [
    `<item id="style" href="style.css" media-type="text/css"/>`,
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
  ];
  const spineItems: string[] = [];
  const navListItems: string[] = [];
  const ncxNavPoints: string[] = [];

  for (const p of processedPages) {
    imagesFolder.file(p.imageFilename, p.blob);

    const imageId = p.isCover ? 'cover-image' : `img_${p.pageNumber}`;
    const xhtmlId = p.isCover ? 'cover' : `page_${p.pageNumber}`;
    const pageTitle = p.isCover ? 'Cover' : `Page ${p.pageNumber}`;

    if (p.isCover) {
      manifestItems.push(`<item id="${imageId}" href="images/${p.imageFilename}" media-type="image/jpeg" properties="cover-image"/>`);
    } else {
      manifestItems.push(`<item id="${imageId}" href="images/${p.imageFilename}" media-type="image/jpeg"/>`);
    }

    const xhtmlContent = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(pageTitle)}</title>
  <meta name="viewport" content="width=${p.width}, height=${p.height}"/>
  <link rel="stylesheet" type="text/css" href="../style.css"/>
</head>
<body>
  <div class="comic-viewport">
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
         width="100%" height="100%" viewBox="0 0 ${p.width} ${p.height}">
      <image width="${p.width}" height="${p.height}" xlink:href="../images/${p.imageFilename}"/>
    </svg>
  </div>
</body>
</html>`;

    textFolder.file(p.xhtmlFilename, xhtmlContent);
    manifestItems.push(`<item id="${xhtmlId}" href="text/${p.xhtmlFilename}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${xhtmlId}"/>`);

    navListItems.push(`<li><a href="text/${p.xhtmlFilename}">${escapeXml(pageTitle)}</a></li>`);
    ncxNavPoints.push(`
      <navPoint id="np_${p.pageNumber}" playOrder="${p.pageNumber}">
        <navLabel><text>${escapeXml(pageTitle)}</text></navLabel>
        <content src="text/${p.xhtmlFilename}"/>
      </navPoint>
    `);
  }

  // 6. Navigation Document: OEBPS/nav.xhtml
  oebps.file(
    'nav.xhtml',
    `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="utf-8"/>
  <title>Navigation</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${navListItems.join('\n      ')}
    </ol>
  </nav>
  <nav epub:type="landmarks" hidden="">
    <h2>Landmarks</h2>
    <ol>
      <li><a epub:type="cover" href="text/cover.xhtml">Cover</a></li>
      <li><a epub:type="bodymatter" href="text/cover.xhtml">Start of Comic</a></li>
    </ol>
  </nav>
</body>
</html>`
  );

  // 7. NCX Document: OEBPS/toc.ncx (EPUB 2 / Kindle compatibility)
  const bookUid = `comic-epub-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  oebps.file(
    'toc.ncx',
    `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${bookUid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="${total}"/>
    <meta name="dtb:maxPageNumber" content="${total}"/>
  </head>
  <docTitle><text>${escapeXml(metadata.title)}</text></docTitle>
  ${metadata.writer ? `<docAuthor><text>${escapeXml(metadata.writer)}</text></docAuthor>` : ''}
  <navMap>
    ${ncxNavPoints.join('\n')}
  </navMap>
</ncx>`
  );

  // Determine reading direction
  let direction = options.direction;
  if (direction === 'auto') {
    if (metadata.manga === 'Yes' || metadata.manga === 'YesAndRightToLeft') {
      direction = 'rtl';
    } else {
      direction = 'ltr';
    }
  }

  // 8. Package Document: OEBPS/content.opf
  const opfContent = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${bookUid}</dc:identifier>
    <dc:title>${escapeXml(metadata.title)}</dc:title>
    ${metadata.writer ? `<dc:creator>${escapeXml(metadata.writer)}</dc:creator>` : '<dc:creator>Comic to EPUB Studio</dc:creator>'}
    ${metadata.penciller ? `<dc:contributor>${escapeXml(metadata.penciller)}</dc:contributor>` : ''}
    <dc:language>${escapeXml(metadata.language || 'en')}</dc:language>
    ${metadata.publisher ? `<dc:publisher>${escapeXml(metadata.publisher)}</dc:publisher>` : ''}
    ${metadata.genre ? `<dc:subject>${escapeXml(metadata.genre)}</dc:subject>` : ''}
    ${metadata.year ? `<dc:date>${escapeXml(metadata.year)}</dc:date>` : ''}
    ${metadata.summary ? `<dc:description>${escapeXml(metadata.summary)}</dc:description>` : ''}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z')}</meta>
    
    <!-- EPUB 2 / Kindle Cover Image Metadata -->
    <meta name="cover" content="cover-image"/>

    <!-- Series Collection Metadata -->
    ${metadata.series ? `<meta property="belongs-to-collection" id="series_id">${escapeXml(metadata.series)}</meta>
    <meta refines="#series_id" property="collection-type">series</meta>
    ${metadata.number ? `<meta refines="#series_id" property="group-position">${escapeXml(metadata.number)}</meta>` : ''}` : ''}

    <!-- EPUB 3 Rendition Fixed Layout & Orientation -->
    <meta property="rendition:layout">${options.layout}</meta>
    <meta property="rendition:orientation">auto</meta>
    <meta property="rendition:spread">auto</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx" page-progression-direction="${direction}">
    ${spineItems.join('\n    ')}
  </spine>
  <guide>
    <reference type="cover" title="Cover" href="text/cover.xhtml"/>
  </guide>
</package>`;

  oebps.file('content.opf', opfContent);

  // 9. Generate final EPUB package
  onProgress?.(90, 'Packaging EPUB zip container...');
  const finalEpub = await epubZip.generateAsync(
    {
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    metadata => {
      onProgress?.(90 + Math.round(metadata.percent * 0.1), `Compressing archive (${metadata.percent.toFixed(0)}%)...`);
    }
  );

  return finalEpub;
}

export function escapeXml(str?: string): string {
  if (!str) return '';
  return str.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
