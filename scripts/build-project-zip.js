import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const rootDir = process.cwd();
const zip = new JSZip();

function addFilesRecursively(dirPath, zipFolder, excludeDirs = ['node_modules', 'dist', '.git', '.aistudio']) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) continue;
      const subFolder = zipFolder.folder(entry.name);
      addFilesRecursively(fullPath, subFolder, excludeDirs);
    } else {
      // Don't include huge zip files or temp files
      if (entry.name.endsWith('.zip') || entry.name.startsWith('.DS_Store')) continue;
      const content = fs.readFileSync(fullPath);
      zipFolder.file(entry.name, content);
    }
  }
}

async function buildZip() {
  console.log('Packaging project source files into zip...');
  addFilesRecursively(rootDir, zip);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const outPath = path.join(rootDir, 'public', 'comic-to-epub-react-source.zip');
  fs.writeFileSync(outPath, buffer);
  console.log(`Successfully created: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

buildZip().catch(err => {
  console.error(err);
  process.exit(1);
});
