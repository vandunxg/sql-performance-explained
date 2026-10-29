#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_08.print.html');
const outputPdf = path.join(root, 'vi/parts/part_08.pdf');
const contentPdf = path.join(directory, 'part_08.content.pdf');
const sourcePdf = path.join(root, 'en_parts/part_08.pdf');
const assetDirectory = path.join(root, 'vi/assets');

const protectedSourceClones = {
  'p08-u003': { sourcePage: 1, rect: [95, 95, 235, 155], asset: 'part_08_p08-u003.png' },
  'p08-u005': { sourcePage: 1, rect: [65, 288, 330, 55], asset: 'part_08_p08-u005.png' },
  'p08-u008': { sourcePage: 1, rect: [95, 430, 235, 155], asset: 'part_08_p08-u008.png' },
  'p08-u011': { sourcePage: 2, rect: [50, 165, 330, 55], asset: 'part_08_p08-u011.png' },
  'p08-u014': { sourcePage: 2, rect: [50, 325, 330, 75], asset: 'part_08_p08-u014.png' },
  'p08-u019': { sourcePage: 3, rect: [95, 95, 235, 160], asset: 'part_08_p08-u019.png' },
  'p08-u026': { sourcePage: 4, rect: [55, 180, 320, 165], asset: 'part_08_p08-u026.png' },
  'p08-u032': { sourcePage: 5, rect: [65, 355, 320, 55], asset: 'part_08_p08-u032.png' },
  'p08-u034': { sourcePage: 5, rect: [65, 485, 320, 75], asset: 'part_08_p08-u034.png' },
  'p08-u040': { sourcePage: 6, rect: [50, 385, 330, 55], asset: 'part_08_p08-u040.png' },
  'p08-u041': { sourcePage: 6, rect: [50, 438, 330, 85], asset: 'part_08_p08-u041.png' },
  'p08-u060': { sourcePage: 10, rect: [60, 345, 300, 55], asset: 'part_08_p08-u060.png' },
  'p08-u063': { sourcePage: 10, rect: [60, 475, 300, 80], asset: 'part_08_p08-u063.png' },
  'p08-u067': { sourcePage: 11, rect: [75, 135, 290, 55], asset: 'part_08_p08-u067.png' },
  'p08-u070': { sourcePage: 11, rect: [75, 245, 290, 55], asset: 'part_08_p08-u070.png' },
  'p08-u075': { sourcePage: 11, rect: [55, 440, 330, 100], asset: 'part_08_p08-u075.png' },
  'p08-u082': { sourcePage: 12, rect: [55, 345, 330, 105], asset: 'part_08_p08-u082.png' },
  'p08-u089': { sourcePage: 13, rect: [60, 205, 330, 120], asset: 'part_08_p08-u089.png' },
  'p08-u097': { sourcePage: 14, rect: [65, 185, 320, 55], asset: 'part_08_p08-u097.png' },
  'p08-u100': { sourcePage: 14, rect: [65, 320, 320, 100], asset: 'part_08_p08-u100.png' },
  'p08-u104': { sourcePage: 14, rect: [65, 525, 320, 65], asset: 'part_08_p08-u104.png' },
  'p08-u108': { sourcePage: 15, rect: [75, 140, 290, 65], asset: 'part_08_p08-u108.png' },
  'p08-u111': { sourcePage: 15, rect: [60, 290, 330, 185], asset: 'part_08_p08-u111.png' },
  'p08-u116': { sourcePage: 16, rect: [55, 245, 330, 80], asset: 'part_08_p08-u116.png' },
  'p08-u124': { sourcePage: 17, rect: [65, 260, 320, 85], asset: 'part_08_p08-u124.png' },
  'p08-u129': { sourcePage: 18, rect: [55, 140, 330, 90], asset: 'part_08_p08-u129.png' },
  'p08-u132': { sourcePage: 18, rect: [55, 370, 330, 170], asset: 'part_08_p08-u132.png' },
  'p08-u137': { sourcePage: 19, rect: [55, 135, 330, 180], asset: 'part_08_p08-u137.png' },
  'p08-u142': { sourcePage: 20, rect: [55, 150, 330, 125], asset: 'part_08_p08-u142.png' },
  'p08-u146': { sourcePage: 21, rect: [75, 145, 290, 70], asset: 'part_08_p08-u146.png' },
  'p08-u148': { sourcePage: 21, rect: [75, 360, 290, 65], asset: 'part_08_p08-u148.png' }
};

const specialSourceClones = {
  'p08-u046': { sourcePage: 8, asset: 'part_08_special_p08-u046.png' }
};

const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const prose = (text) => escapeHtml(text)
  .split('\n')
  .map((paragraph) => `<p>${paragraph || '&nbsp;'}</p>`)
  .join('');

const createSourceClones = () => {
  fs.mkdirSync(assetDirectory, { recursive: true });
  const sourcePageImages = new Map();
  const renderPage = (sourcePage) => {
    let sourcePageImage = sourcePageImages.get(sourcePage);
    if (!sourcePageImage) {
      sourcePageImage = path.join(directory, `.source-page-${sourcePage}.png`);
      execFileSync('pdftoppm', [
        '-f', String(sourcePage), '-l', String(sourcePage), '-r', '400', '-png', '-singlefile',
        sourcePdf, sourcePageImage.slice(0, -4)
      ]);
      sourcePageImages.set(sourcePage, sourcePageImage);
    }
    return sourcePageImage;
  };

  for (const clone of Object.values(protectedSourceClones)) {
    const [x, y, width, height] = clone.rect;
    execFileSync('magick', [
      renderPage(clone.sourcePage),
      '-crop', `${Math.round(width * 400 / 72)}x${Math.round(height * 400 / 72)}+${Math.round(x * 400 / 72)}+${Math.round(y * 400 / 72)}`,
      '+repage', path.join(assetDirectory, clone.asset)
    ]);
  }
  for (const clone of Object.values(specialSourceClones)) {
    fs.copyFileSync(renderPage(clone.sourcePage), path.join(assetDirectory, clone.asset));
  }
  for (const sourcePageImage of sourcePageImages.values()) fs.rmSync(sourcePageImage);
};

const renderUnit = (unit) => {
  const clone = protectedSourceClones[unit.unit_id];
  if (clone) {
    return `<figure class="source-clone-figure"><img class="source-clone" data-unit-id="${unit.unit_id}" data-source-page="${clone.sourcePage}" data-source-rect="${clone.rect.join(',')}" src="../../assets/${clone.asset}" alt="Nguồn gốc được sao chép nguyên trạng"></figure>`;
  }
  const special = specialSourceClones[unit.unit_id];
  if (special) {
    return `<div class="source-special-page" data-unit-id="${unit.unit_id}"><img src="../../assets/${special.asset}" alt="Trang nguồn được sao chép nguyên trạng"></div>`;
  }
  const text = escapeHtml(unit.translated_text || '');
  if (unit.unit_type === 'heading') return `<h2 data-unit-id="${unit.unit_id}">${text.replace(/\n/g, '<br>')}</h2>`;
  if (unit.unit_type === 'subheading') return `<h3 data-unit-id="${unit.unit_id}">${text.replace(/\n/g, '<br>')}</h3>`;
  if (unit.unit_type === 'caption') return `<p class="caption" data-unit-id="${unit.unit_id}">${text}</p>`;
  if (['note', 'important', 'sidebar', 'tip', 'warning', 'caution', 'think_about_it'].includes(unit.unit_type)) {
    return `<aside class="${unit.unit_type}" data-unit-id="${unit.unit_id}"><img class="callout-icon" src="../../assets/part_08_image-000.png" alt="">${prose(unit.translated_text || '')}</aside>`;
  }
  return `<section class="prose ${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text || '')}</section>`;
};

const documentHtml = (units) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Giải thích SQL Performance - Phần 08</title>
<style>
@page { size: 148mm 228mm; margin: 17mm 15mm 18mm; }
* { box-sizing: border-box; }
body { color: #202124; font-family: "Noto Serif", serif; font-size: 10.2pt; line-height: 1.47; margin: 0; }
p { margin: 0 0 0.75em; orphans: 3; widows: 3; }
h2 { break-after: avoid; color: #254b66; font-family: "Noto Sans", sans-serif; font-size: 16pt; line-height: 1.2; margin: 1.65em 0 0.7em; }
h3 { break-after: avoid; color: #254b66; font-family: "Noto Sans", sans-serif; font-size: 11.5pt; line-height: 1.25; margin: 1em 0 0.45em; }
figure.source-clone-figure { break-inside: avoid; margin: 1em 0 1.25em; }
img.source-clone { display: block; height: auto; max-width: 100%; }
.source-special-page { break-before: page; break-after: page; height: 193mm; margin: 0; overflow: hidden; width: 118mm; }
.source-special-page img { display: block; height: 193mm; width: 118mm; }
.callout-icon { float: left; height: 16pt; margin: 0.05em 0.55em 0.2em 0; width: 11pt; object-fit: contain; }
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

createSourceClones();
fs.writeFileSync(outputHtml, documentHtml(translation.translation));
renderPdf(translation.translation, contentPdf);
execFileSync('qpdf', ['--empty', '--pages', contentPdf, '1-z', '--', outputPdf], { stdio: 'inherit' });
fs.rmSync(contentPdf);
