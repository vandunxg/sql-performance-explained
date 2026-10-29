#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_03.print.html');
const outputPdf = path.join(root, 'vi/parts/part_03.pdf');
const sourcePdf = path.join(root, 'en_parts/part_03.pdf');
const contentPdf = path.join(directory, 'part_03.content.pdf');
const assetDirectory = path.join(root, 'vi/assets');

const protectedSourceClones = {
  'p03-u011': { sourcePage: 2, rect: [64, 108, 145, 55], asset: 'part_03_p03-u011.png' },
  'p03-u012': { sourcePage: 2, rect: [64, 167, 315, 125], asset: 'part_03_p03-u012.png' },
  'p03-u014': { sourcePage: 2, rect: [64, 338, 145, 55], asset: 'part_03_p03-u014.png' },
  'p03-u015': { sourcePage: 2, rect: [64, 395, 260, 120], asset: 'part_03_p03-u015.png' },
  'p03-u031': { sourcePage: 5, rect: [68, 108, 305, 65], asset: 'part_03_p03-u031.png' },
  'p03-u033': { sourcePage: 5, rect: [68, 209, 305, 84], asset: 'part_03_p03-u033.png' },
  'p03-u037': { sourcePage: 5, rect: [68, 364, 305, 65], asset: 'part_03_p03-u037.png' },
  'p03-u039': { sourcePage: 5, rect: [68, 464, 305, 75], asset: 'part_03_p03-u039.png' },
  'p03-u043': { sourcePage: 6, rect: [82, 108, 285, 75], asset: 'part_03_p03-u043.png' },
  'p03-u045': { sourcePage: 6, rect: [82, 218, 245, 75], asset: 'part_03_p03-u045.png' },
  'p03-u049': { sourcePage: 6, rect: [82, 364, 295, 40], asset: 'part_03_p03-u049.png' },
  'p03-u051': { sourcePage: 6, rect: [82, 435, 300, 95], asset: 'part_03_p03-u051.png' },
  'p03-u055': { sourcePage: 7, rect: [68, 108, 275, 38], asset: 'part_03_p03-u055.png' },
  'p03-u057': { sourcePage: 7, rect: [68, 179, 220, 48], asset: 'part_03_p03-u057.png' },
  'p03-u061': { sourcePage: 7, rect: [58, 455, 310, 45], asset: 'part_03_p03-u061.png' },
  'p03-u071': { sourcePage: 9, rect: [48, 120, 280, 45], asset: 'part_03_p03-u071.png' },
  'p03-u074': { sourcePage: 9, rect: [48, 260, 270, 60], asset: 'part_03_p03-u074.png' },
  'p03-u080': { sourcePage: 10, rect: [125, 88, 210, 265], asset: 'part_03_p03-u080.png' },
  'p03-u084': { sourcePage: 11, rect: [42, 88, 295, 265], asset: 'part_03_p03-u084.png' },
  'p03-u089': { sourcePage: 12, rect: [64, 225, 305, 90], asset: 'part_03_p03-u089.png' },
  'p03-u095': { sourcePage: 13, rect: [50, 230, 315, 90], asset: 'part_03_p03-u095.png' },
  'p03-u097': { sourcePage: 13, rect: [48, 428, 250, 35], asset: 'part_03_p03-u097.png' },
  'p03-u099': { sourcePage: 13, rect: [48, 503, 250, 35], asset: 'part_03_p03-u099.png' },
  'p03-u103': { sourcePage: 14, rect: [48, 205, 310, 40], asset: 'part_03_p03-u103.png' },
  'p03-u104': { sourcePage: 14, rect: [48, 244, 325, 80], asset: 'part_03_p03-u104.png' },
  'p03-u109': { sourcePage: 15, rect: [60, 90, 270, 195], asset: 'part_03_p03-u109.png' },
  'p03-u117': { sourcePage: 16, rect: [75, 410, 205, 25], asset: 'part_03_p03-u117.png' },
  'p03-u136': { sourcePage: 18, rect: [64, 225, 220, 50], asset: 'part_03_p03-u136.png' },
  'p03-u153': { sourcePage: 20, rect: [64, 340, 160, 45], asset: 'part_03_p03-u153.png' },
  'p03-u156': { sourcePage: 20, rect: [64, 493, 320, 40], asset: 'part_03_p03-u156.png' },
  'p03-u159': { sourcePage: 21, rect: [48, 115, 250, 45], asset: 'part_03_p03-u159.png' },
  'p03-u165': { sourcePage: 21, rect: [48, 443, 280, 40], asset: 'part_03_p03-u165.png' }
};

const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const prose = (text) => escapeHtml(text)
  .split('\n')
  .map((paragraph) => `<p>${paragraph || '&nbsp;'}</p>`)
  .join('');

const sourceClone = (unitId) => {
  const clone = protectedSourceClones[unitId];
  if (!clone) throw new Error(`No source crop mapped for ${unitId}`);
  return `<img class="source-clone" data-unit-id="${unitId}" data-source-page="${clone.sourcePage}" data-source-rect="${clone.rect.join(',')}" src="../../assets/${clone.asset}" alt="Nguồn gốc được sao chép nguyên trạng">`;
};

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
  if (protectedSourceClones[unit.unit_id]) {
    return `<figure class="source-clone-figure"><img class="source-clone" data-unit-id="${unit.unit_id}" data-source-page="${protectedSourceClones[unit.unit_id].sourcePage}" data-source-rect="${protectedSourceClones[unit.unit_id].rect.join(',')}" src="../../assets/${protectedSourceClones[unit.unit_id].asset}" alt="Nguồn gốc được sao chép nguyên trạng"></figure>`;
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
<title>Giải thích SQL Performance - Phần 03</title>
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
