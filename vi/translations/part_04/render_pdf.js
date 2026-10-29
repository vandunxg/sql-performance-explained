#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_04.print.html');
const outputPdf = path.join(root, 'vi/parts/part_04.pdf');
const sourcePdf = path.join(root, 'en_parts/part_04.pdf');
const contentPdf = path.join(directory, 'part_04.content.pdf');
const assetDirectory = path.join(root, 'vi/assets');

const protectedSourceClones = {
  'p04-u004': { sourcePage: 1, rect: [60, 253, 290, 165], asset: 'part_04_p04-u004.png' },
  'p04-u006': { sourcePage: 1, rect: [60, 460, 115, 87], asset: 'part_04_p04-u006.png' },
  'p04-u012': { sourcePage: 2, rect: [47, 282, 165, 68], asset: 'part_04_p04-u012.png' },
  'p04-u014': { sourcePage: 2, rect: [47, 395, 255, 47], asset: 'part_04_p04-u014.png' },
  'p04-u016': { sourcePage: 2, rect: [47, 500, 155, 39], asset: 'part_04_p04-u016.png' },
  'p04-u017': { sourcePage: 3, rect: [62, 72, 265, 106], asset: 'part_04_p04-u017.png' },
  'p04-u019': { sourcePage: 3, rect: [60, 220, 275, 30], asset: 'part_04_p04-u019.png' },
  'p04-u021': { sourcePage: 3, rect: [60, 303, 155, 47], asset: 'part_04_p04-u021.png' },
  'p04-u022': { sourcePage: 3, rect: [62, 352, 310, 123], asset: 'part_04_p04-u022.png' },
  'p04-u027': { sourcePage: 4, rect: [47, 144, 280, 29], asset: 'part_04_p04-u027.png' },
  'p04-u034': { sourcePage: 4, rect: [47, 458, 255, 75], asset: 'part_04_p04-u034.png' },
  'p04-u035': { sourcePage: 5, rect: [62, 72, 315, 115], asset: 'part_04_p04-u035.png' },
  'p04-u037': { sourcePage: 5, rect: [62, 226, 225, 58], asset: 'part_04_p04-u037.png' },
  'p04-u038': { sourcePage: 5, rect: [62, 285, 265, 65], asset: 'part_04_p04-u038.png' },
  'p04-u042': { sourcePage: 5, rect: [62, 486, 315, 95], asset: 'part_04_p04-u042.png' },
  'p04-u043': { sourcePage: 6, rect: [47, 72, 155, 38], asset: 'part_04_p04-u043.png' },
  'p04-u044': { sourcePage: 6, rect: [47, 111, 270, 65], asset: 'part_04_p04-u044.png' },
  'p04-u047': { sourcePage: 6, rect: [47, 296, 215, 48], asset: 'part_04_p04-u047.png' },
  'p04-u048': { sourcePage: 6, rect: [47, 345, 310, 75], asset: 'part_04_p04-u048.png' },
  'p04-u051': { sourcePage: 6, rect: [47, 515, 300, 68], asset: 'part_04_p04-u051.png' },
  'p04-u052': { sourcePage: 7, rect: [62, 72, 155, 38], asset: 'part_04_p04-u052.png' },
  'p04-u053': { sourcePage: 7, rect: [62, 111, 305, 76], asset: 'part_04_p04-u053.png' },
  'p04-u055': { sourcePage: 7, rect: [62, 233, 260, 87], asset: 'part_04_p04-u055.png' },
  'p04-u056': { sourcePage: 7, rect: [62, 320, 295, 77], asset: 'part_04_p04-u056.png' },
  'p04-u058': { sourcePage: 7, rect: [62, 442, 225, 55], asset: 'part_04_p04-u058.png' },
  'p04-u059': { sourcePage: 7, rect: [62, 500, 265, 68], asset: 'part_04_p04-u059.png' },
  'p04-u063': { sourcePage: 8, rect: [47, 209, 165, 39], asset: 'part_04_p04-u063.png' },
  'p04-u065': { sourcePage: 8, rect: [47, 292, 328, 126], asset: 'part_04_p04-u065.png' },
  'p04-u068': { sourcePage: 8, rect: [47, 487, 292, 30], asset: 'part_04_p04-u068.png' },
  'p04-u070': { sourcePage: 9, rect: [62, 93, 225, 39], asset: 'part_04_p04-u070.png' },
  'p04-u071': { sourcePage: 9, rect: [62, 132, 290, 75], asset: 'part_04_p04-u071.png' },
  'p04-u079': { sourcePage: 10, rect: [47, 357, 300, 38], asset: 'part_04_p04-u079.png' },
  'p04-u082': { sourcePage: 10, rect: [47, 480, 215, 29], asset: 'part_04_p04-u082.png' },
  'p04-u085': { sourcePage: 11, rect: [62, 120, 200, 45], asset: 'part_04_p04-u085.png' },
  'p04-u088': { sourcePage: 11, rect: [62, 273, 215, 45], asset: 'part_04_p04-u088.png' },
  'p04-u093': { sourcePage: 12, rect: [65, 95, 290, 185], asset: 'part_04_p04-u093.png' },
  'p04-u095': { sourcePage: 12, rect: [65, 323, 250, 195], asset: 'part_04_p04-u095.png' },
  'p04-u097': { sourcePage: 13, rect: [79, 95, 295, 155], asset: 'part_04_p04-u097.png' },
  'p04-u099': { sourcePage: 13, rect: [79, 294, 250, 175], asset: 'part_04_p04-u099.png' },
  'p04-u102': { sourcePage: 14, rect: [65, 128, 255, 28], asset: 'part_04_p04-u102.png' },
  'p04-u104': { sourcePage: 14, rect: [47, 203, 265, 38], asset: 'part_04_p04-u104.png' },
  'p04-u107': { sourcePage: 14, rect: [47, 353, 260, 38], asset: 'part_04_p04-u107.png' },
  'p04-u110': { sourcePage: 14, rect: [47, 503, 280, 58], asset: 'part_04_p04-u110.png' },
  'p04-u114': { sourcePage: 15, rect: [75, 122, 120, 20], asset: 'part_04_p04-u114.png' },
  'p04-u117': { sourcePage: 15, rect: [75, 239, 185, 29], asset: 'part_04_p04-u117.png' },
  'p04-u121': { sourcePage: 16, rect: [47, 160, 145, 39], asset: 'part_04_p04-u121.png' },
  'p04-u123': { sourcePage: 16, rect: [47, 249, 135, 38], asset: 'part_04_p04-u123.png' },
  'p04-u125': { sourcePage: 16, rect: [47, 325, 185, 38], asset: 'part_04_p04-u125.png' },
  'p04-u127': { sourcePage: 16, rect: [47, 413, 180, 38], asset: 'part_04_p04-u127.png' },
  'p04-u129': { sourcePage: 16, rect: [47, 525, 40, 58], asset: 'part_04_p04-u129.png' },
  'p04-u136': { sourcePage: 17, rect: [62, 355, 145, 38], asset: 'part_04_p04-u136.png' },
  'p04-u138': { sourcePage: 17, rect: [62, 462, 185, 38], asset: 'part_04_p04-u138.png' },
  'p04-u142': { sourcePage: 18, rect: [47, 214, 210, 48], asset: 'part_04_p04-u142.png' },
  'p04-u145': { sourcePage: 18, rect: [47, 358, 205, 48], asset: 'part_04_p04-u145.png' },
  'p04-u149': { sourcePage: 18, rect: [52, 535, 225, 48], asset: 'part_04_p04-u149.png' },
  'p04-u153': { sourcePage: 19, rect: [62, 287, 265, 65], asset: 'part_04_p04-u153.png' },
  'p04-u156': { sourcePage: 19, rect: [62, 471, 215, 48], asset: 'part_04_p04-u156.png' },
  'p04-u159': { sourcePage: 20, rect: [47, 156, 215, 48], asset: 'part_04_p04-u159.png' }
};

const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const prose = (text) => escapeHtml(text)
  .split('\n')
  .map((paragraph) => `<p>${paragraph || '&nbsp;'}</p>`)
  .join('');

const createProtectedSourceClones = () => {
  fs.mkdirSync(assetDirectory, { recursive: true });
  const sourcePageImages = new Map();
  for (const clone of Object.values(protectedSourceClones)) {
    const [x, y, width, height] = clone.rect;
    let sourcePageImage = sourcePageImages.get(clone.sourcePage);
    if (!sourcePageImage) {
      sourcePageImage = path.join(directory, `.source-page-${clone.sourcePage}.png`);
      execFileSync('pdftoppm', [
        '-f', String(clone.sourcePage), '-l', String(clone.sourcePage), '-r', '400', '-png', '-singlefile',
        sourcePdf, sourcePageImage.slice(0, -4)
      ]);
      sourcePageImages.set(clone.sourcePage, sourcePageImage);
    }
    execFileSync('magick', [
      sourcePageImage,
      '-crop', `${Math.round(width * 400 / 72)}x${Math.round(height * 400 / 72)}+${Math.round(x * 400 / 72)}+${Math.round(y * 400 / 72)}`,
      '+repage', path.join(assetDirectory, clone.asset)
    ]);
  }
  for (const sourcePageImage of sourcePageImages.values()) fs.rmSync(sourcePageImage);
};

const renderUnit = (unit) => {
  const clone = protectedSourceClones[unit.unit_id];
  if (clone) {
    return `<figure class="source-clone-figure"><img class="source-clone" data-unit-id="${unit.unit_id}" data-source-page="${clone.sourcePage}" data-source-rect="${clone.rect.join(',')}" src="../../assets/${clone.asset}" alt="Nguồn gốc được sao chép nguyên trạng"></figure>`;
  }
  const text = escapeHtml(unit.translated_text);
  if (unit.unit_type === 'heading') return `<h2 data-unit-id="${unit.unit_id}">${text.replace(/\n/g, '<br>')}</h2>`;
  if (unit.unit_type === 'subheading') return `<h3 data-unit-id="${unit.unit_id}">${text.replace(/\n/g, '<br>')}</h3>`;
  if (unit.unit_type === 'caption') return `<p class="caption" data-unit-id="${unit.unit_id}">${text}</p>`;
  if (['note', 'important', 'sidebar', 'tip', 'caution', 'think_about_it'].includes(unit.unit_type)) {
    return `<aside class="${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text)}</aside>`;
  }
  return `<section class="prose ${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text)}</section>`;
};

const documentHtml = (units) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Giải thích SQL Performance - Phần 04</title>
<style>
@page { size: 148mm 228mm; margin: 17mm 15mm 18mm; }
* { box-sizing: border-box; }
body { color: #202124; font-family: "Noto Serif", serif; font-size: 10.2pt; line-height: 1.47; margin: 0; }
p { margin: 0 0 0.75em; orphans: 3; widows: 3; }
h2 { break-after: avoid; color: #254b66; font-family: "Noto Sans", sans-serif; font-size: 16pt; line-height: 1.2; margin: 1.65em 0 0.7em; }
h3 { break-after: avoid; color: #254b66; font-family: "Noto Sans", sans-serif; font-size: 11.5pt; line-height: 1.25; margin: 1em 0 0.45em; }
figure.source-clone-figure { break-inside: avoid; margin: 1em 0 1.25em; }
img.source-clone { display: block; height: auto; max-width: 100%; }
.caption { break-after: avoid; color: #59656c; font-family: "Noto Sans", sans-serif; font-size: 8.7pt; font-style: italic; margin-top: 1.1em; text-align: center; }
aside { break-inside: avoid; border-left: 3pt solid #8b9d38; margin: 1.3em 0; padding: 0.35em 0 0.35em 1em; }
aside.important, aside.caution { border-left-color: #a94a3d; }
aside.sidebar { background: #f5f7ef; border: 0.5pt solid #cbd5a8; padding: 0.8em 1em; }
aside.think_about_it { background: #eef4f7; border-left-color: #39728d; }
aside p:last-child { margin-bottom: 0; }
</style>
</head>
<body>
${units.map(renderUnit).join('\n')}
</body>
</html>`;

const renderPdf = (units, pdf) => {
  const html = `${pdf}.html`;
  fs.writeFileSync(html, documentHtml(units));
  execFileSync('chromium', [
    '--headless', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer',
    `--print-to-pdf=${pdf}`, `file://${html}`
  ], { stdio: 'inherit' });
  fs.rmSync(html);
};

createProtectedSourceClones();
fs.writeFileSync(outputHtml, documentHtml(translation.translation));
renderPdf(translation.translation, contentPdf);
execFileSync('qpdf', ['--empty', '--pages', contentPdf, '1-z', '--', outputPdf], { stdio: 'inherit' });
fs.rmSync(contentPdf);
