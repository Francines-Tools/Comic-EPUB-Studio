/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComicMetadata } from '../types';

/**
 * Known comic book publishers for recognition
 */
const KNOWN_PUBLISHERS = [
  'Marvel',
  'DC Comics',
  'DC',
  'Image',
  'Dark Horse',
  'IDW',
  'Boom! Studios',
  'Dynamite',
  'Vertigo',
  'Valiant',
  '2000 AD',
  'Archie',
  'Shueisha',
  'Kodansha',
  'Square Enix',
  'Kadokawa',
  'VIZ Media',
  'Seven Seas',
  'Yen Press',
  'Delcourt',
  'Dargaud',
  'Glénat',
  'Panini',
];

/**
 * Common comic & manga genres
 */
export const COMMON_GENRES = [
  'Superhero',
  'Manga / Shonen',
  'Manga / Seinen',
  'Sci-Fi',
  'Fantasy',
  'Action & Adventure',
  'Horror',
  'Mystery & Crime',
  'Romance',
  'Comedy',
  'Historical',
  'Drama',
];

/**
 * Common languages supported for EPUB
 */
export const COMMON_LANGUAGES = [
  { code: 'en', label: 'English (en)' },
  { code: 'fr', label: 'French (fr)' },
  { code: 'ja', label: 'Japanese (ja)' },
  { code: 'es', label: 'Spanish (es)' },
  { code: 'de', label: 'German (de)' },
  { code: 'it', label: 'Italian (it)' },
  { code: 'pt', label: 'Portuguese (pt)' },
  { code: 'zh', label: 'Chinese (zh)' },
  { code: 'ko', label: 'Korean (ko)' },
];

/**
 * Analyzes a raw file name and produces best-guess metadata
 */
export function guessMetadataFromFilename(filename: string): Partial<ComicMetadata> {
  // 1. Remove extension
  let clean = filename.replace(/\.(cbz|cbr|zip|rar)$/i, '');

  // 2. Identify and extract language tags
  let language = 'en';
  if (/\[(?:FR|French)\]/i.test(clean)) language = 'fr';
  else if (/\[(?:ES|Spanish)\]/i.test(clean)) language = 'es';
  else if (/\[(?:JA|JP|Japanese|RAW)\]/i.test(clean)) language = 'ja';
  else if (/\[(?:DE|German)\]/i.test(clean)) language = 'de';
  else if (/\[(?:IT|Italian)\]/i.test(clean)) language = 'it';

  // 3. Detect known publisher
  let publisher: string | undefined;
  for (const pub of KNOWN_PUBLISHERS) {
    const pubRegex = new RegExp(`[\\(\\[\\-_\\s]${pub}[\\)\\]\\-_\\s]`, 'i');
    if (pubRegex.test(` ${clean} `)) {
      publisher = pub === 'DC' ? 'DC Comics' : pub;
      break;
    }
  }

  // 4. Detect Year (e.g. (1987) or (2021))
  let year: string | undefined;
  const yearMatch = clean.match(/[\(\[]\s*(19\d{2}|20\d{2})\s*[\)\]]/);
  if (yearMatch) {
    year = yearMatch[1];
  }

  // 5. Detect Manga markers
  let manga: string | undefined;
  if (
    /\[(?:Manga|Scanlation|RAW)\]/i.test(clean) ||
    language === 'ja' ||
    /(?:c\d+|ch\.\s*\d+|chapter\s*\d+)/i.test(clean)
  ) {
    manga = 'Yes';
  }

  // 6. Strip scan tags, scanner groups, resolution etc.
  clean = clean
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\((?:Digital|webrip|c2c|Empire|Minutemen|Zone-Empire|Son of Ultron|HD|4K)[^\)]*\)/gi, ' ')
    .trim();

  // 7. Detect Volume (e.g. v01, Vol. 03, Volume 2)
  let volume: string | undefined;
  const volMatch = clean.match(/(?:^|[\s\-_])(?:vol\.?|volume|v)\s*(\d{1,3})/i);
  if (volMatch) {
    volume = String(parseInt(volMatch[1], 10));
    clean = clean.replace(volMatch[0], ' ');
  }

  // 8. Detect Issue Number (e.g. #001, #12, c054, ch. 12, or standalone 2-4 digit number)
  let number: string | undefined;
  const issueMatch = clean.match(/#\s*(\d{1,4})/);
  if (issueMatch) {
    number = issueMatch[1];
    clean = clean.replace(issueMatch[0], ' ');
  } else {
    const chapterMatch = clean.match(/(?:^|[\s\-_])(?:c|ch\.?|chapter|issue)\s*(\d{1,4})/i);
    if (chapterMatch) {
      number = chapterMatch[1];
      clean = clean.replace(chapterMatch[0], ' ');
    } else {
      // Look for standalone numbers like "Batman 450 (1990)"
      const standaloneMatch = clean.match(/(?:^|[\s\-_])(\d{1,4})(?:[\s\-_]|$)/);
      if (standaloneMatch && standaloneMatch[1] !== year) {
        number = standaloneMatch[1];
        clean = clean.replace(standaloneMatch[0], ' ');
      }
    }
  }

  // 9. Clean up year in parenthesis if still present
  if (year) {
    clean = clean.replace(new RegExp(`\\(?\\s*${year}\\s*\\)?`), ' ');
  }

  // 10. Clean series title
  let series = clean
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, '')
    .trim();

  // Capitalize title appropriately if all lowercase or clean
  if (!series) {
    series = filename.replace(/\.[^/.]+$/, '').trim();
  }

  // 11. Compose Book Title
  let title = series;
  if (volume && number) {
    title = `${series} Vol. ${volume} #${number}`;
  } else if (number) {
    title = `${series} #${number}`;
  } else if (volume) {
    title = `${series} Vol. ${volume}`;
  }

  // 12. Default Genre guessing
  let genre: string | undefined;
  if (manga === 'Yes') {
    genre = 'Manga / Shonen';
  } else if (publisher === 'Marvel' || publisher === 'DC Comics' || publisher === 'Valiant') {
    genre = 'Superhero';
  }

  return {
    title,
    series,
    number,
    volume,
    year,
    publisher,
    language,
    manga,
    genre,
    outputFilename: `${title.replace(/[\/\\?%*:|"<>]/g, '_')}.epub`,
  };
}
