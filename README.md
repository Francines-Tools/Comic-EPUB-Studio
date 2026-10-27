# Comic to EPUB Studio

A browser-based comic book to EPUB 3 converter designed for e-readers, tablets, and digital comic libraries. Convert CBZ and CBR archives into standardized, reading-ready EPUB 3 eBooks directly in your web browser.

---

## Key Features

- **CBZ & CBR Conversion**: Process `.cbz`, `.cbr`, `.zip`, and `.rar` comic archives directly inside your browser.
- **Embedded Cover & Bookshelf Thumbnails**: The comic's cover page is embedded with EPUB 3 `cover-image` properties and EPUB 2 landmark metadata, ensuring proper thumbnail display across Kindle, Kobo, Apple Books, and Calibre.
- **Smart Metadata Detection**: Automatically reads embedded `ComicInfo.xml` metadata. If absent, the app analyzes filenames to prefill title, series, issue number, volume, year, language, and publisher.
- **One-Click Bulk Metadata Editing**: Easily propagate common fields (such as Author, Publisher, Language, or Genre) across multiple queued comics at once.
- **Target Folder Batch Export**: Export all converted EPUBs directly into your chosen destination folder without individual download prompts. Includes automatic fallback bundling for mobile browsers.
- **Reading Direction & Layout Controls**: Supports Western Left-to-Right (LTR) and Manga Right-to-Left (RTL) reading flows, along with Fixed-Layout (`pre-paginated`) and Reflowable viewing modes.
- **Privacy First**: All decompression, image processing, and EPUB packaging occur locally on your device. Comic files never leave your computer.

---

## Supported Formats

| Input Formats | Output Format | Compatibility |
| :--- | :--- | :--- |
| `.cbz`, `.cbr`, `.zip`, `.rar` | `.epub` (EPUB 3 Standard) | Amazon Kindle, Kobo, Apple Books, Calibre, Thorium, Moon+ Reader |

---

## How to Use

1. **Add Comics**: Drag and drop your CBZ or CBR files into the drop zone, or click to browse.
2. **Review Metadata & Settings**: Check the queue to adjust reading direction, resolution, or edit book metadata (Title, Series, Author, Publisher).
3. **Convert**: Click **Convert All** to process the queue.
4. **Export**: Use **Download All (Target Folder)** to save all converted EPUBs directly into your comic directory or e-reader storage.
