#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_05.print.html');
const outputPdf = path.join(root, 'vi/parts/part_05.pdf');
const contentPdf = path.join(directory, 'part_05.content.pdf');
const sourcePdf = path.join(root, 'en_parts/part_05.pdf');
const assetDirectory = path.join(root, 'vi/assets');

const protectedSourceClones = {
  'p05-u002': { sourcePage: 1, rect: [60, 70, 305, 60], asset: 'part_05_p05-u002.png' },
  'p05-u006': { sourcePage: 1, rect: [60, 282, 320, 132], asset: 'part_05_p05-u006.png' },
  'p05-u009': { sourcePage: 1, rect: [60, 520, 320, 70], asset: 'part_05_p05-u009.png' },
  'p05-u010': { sourcePage: 2, rect: [47, 72, 338, 119], asset: 'part_05_p05-u010.png' },
  'p05-u014': { sourcePage: 2, rect: [47, 350, 320, 42], asset: 'part_05_p05-u014.png' },
  'p05-u040': { sourcePage: 5, rect: [60, 170, 270, 50], asset: 'part_05_p05-u040.png' },
  'p05-u042': { sourcePage: 5, rect: [60, 250, 270, 50], asset: 'part_05_p05-u042.png' },
  'p05-u045': { sourcePage: 5, rect: [60, 375, 270, 50], asset: 'part_05_p05-u045.png' },
  'p05-u047': { sourcePage: 5, rect: [60, 466, 270, 50], asset: 'part_05_p05-u047.png' },
  'p05-u049': { sourcePage: 5, rect: [60, 555, 330, 35], asset: 'part_05_p05-u049.png' },
  'p05-u062': { sourcePage: 8, rect: [47, 250, 310, 55], asset: 'part_05_p05-u062.png' },
  'p05-u065': { sourcePage: 8, rect: [117, 385, 195, 115], asset: 'part_05_p05-u065.png' },
  'p05-u070': { sourcePage: 9, rect: [50, 230, 330, 130], asset: 'part_05_p05-u070.png' },
  'p05-u075': { sourcePage: 10, rect: [45, 100, 330, 100], asset: 'part_05_p05-u075.png' },
  'p05-u076': { sourcePage: 10, rect: [45, 195, 330, 75], asset: 'part_05_p05-u076.png' },
  'p05-u082': { sourcePage: 11, rect: [47, 70, 330, 132], asset: 'part_05_p05-u082.png' },
  'p05-u083': { sourcePage: 11, rect: [47, 202, 330, 100], asset: 'part_05_p05-u083.png' },
  'p05-u089': { sourcePage: 12, rect: [47, 165, 330, 28], asset: 'part_05_p05-u089.png' },
  'p05-u092': { sourcePage: 12, rect: [47, 300, 330, 32], asset: 'part_05_p05-u092.png' },
  'p05-u099': { sourcePage: 13, rect: [60, 345, 330, 200], asset: 'part_05_p05-u099.png' },
  'p05-u104': { sourcePage: 14, rect: [55, 230, 330, 130], asset: 'part_05_p05-u104.png' },
  'p05-u117': { sourcePage: 16, rect: [55, 155, 330, 125], asset: 'part_05_p05-u117.png' },
  'p05-u146': { sourcePage: 21, rect: [70, 118, 325, 200], asset: 'part_05_p05-u146.png' },
  'p05-u148': { sourcePage: 21, rect: [70, 340, 325, 185], asset: 'part_05_p05-u148.png' }
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
  if (['note', 'important', 'sidebar', 'tip', 'warning', 'caution', 'think_about_it'].includes(unit.unit_type)) {
    return `<aside class="${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text)}</aside>`;
  }
  return `<section class="prose ${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text)}</section>`;
};

const documentHtml = (units) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Giải thích SQL Performance - Phần 05</title>
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
aside.important, aside.caution, aside.warning { border-left-color: #a94a3d; }
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
