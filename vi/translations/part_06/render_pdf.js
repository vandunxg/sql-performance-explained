#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_06.print.html');
const outputPdf = path.join(root, 'vi/parts/part_06.pdf');
const contentPdf = path.join(directory, 'part_06.content.pdf');
const sourcePdf = path.join(root, 'en_parts/part_06.pdf');
const assetDirectory = path.join(root, 'vi/assets');

const protectedSourceClones = {
  'p06-u004': { sourcePage: 1, rect: [70, 105, 330, 105], asset: 'part_06_p06-u004.png' },
  'p06-u006': { sourcePage: 1, rect: [70, 230, 330, 125], asset: 'part_06_p06-u006.png' },
  'p06-u009': { sourcePage: 1, rect: [55, 445, 340, 145], asset: 'part_06_p06-u009.png' },
  'p06-u012': { sourcePage: 2, rect: [55, 90, 340, 145], asset: 'part_06_p06-u012.png' },
  'p06-u016': { sourcePage: 2, rect: [90, 300, 270, 25], asset: 'part_06_p06-u016.png' },
  'p06-u019': { sourcePage: 2, rect: [90, 378, 270, 30], asset: 'part_06_p06-u019.png' },
  'p06-u021': { sourcePage: 2, rect: [90, 425, 270, 35], asset: 'part_06_p06-u021.png' },
  'p06-u024': { sourcePage: 2, rect: [90, 500, 270, 45], asset: 'part_06_p06-u024.png' },
  'p06-u028': { sourcePage: 3, rect: [40, 150, 370, 35], asset: 'part_06_p06-u028.png' },
  'p06-u038': { sourcePage: 4, rect: [70, 310, 330, 150], asset: 'part_06_p06-u038.png' },
  'p06-u040': { sourcePage: 4, rect: [70, 500, 330, 120], asset: 'part_06_p06-u040.png' },
  'p06-u045': { sourcePage: 5, rect: [70, 120, 330, 115], asset: 'part_06_p06-u045.png' },
  'p06-u047': { sourcePage: 5, rect: [70, 280, 330, 115], asset: 'part_06_p06-u047.png' },
  'p06-u052': { sourcePage: 6, rect: [70, 110, 330, 75], asset: 'part_06_p06-u052.png' },
  'p06-u054': { sourcePage: 6, rect: [70, 220, 330, 115], asset: 'part_06_p06-u054.png' },
  'p06-u057': { sourcePage: 6, rect: [70, 390, 330, 130], asset: 'part_06_p06-u057.png' },
  'p06-u059': { sourcePage: 6, rect: [70, 545, 330, 75], asset: 'part_06_p06-u059.png' },
  'p06-u061': { sourcePage: 7, rect: [45, 90, 340, 180], asset: 'part_06_p06-u061.png' },
  'p06-u071': { sourcePage: 8, rect: [70, 300, 330, 75], asset: 'part_06_p06-u071.png' },
  'p06-u074': { sourcePage: 9, rect: [45, 70, 340, 175], asset: 'part_06_p06-u074.png' },
  'p06-u079': { sourcePage: 9, rect: [40, 510, 370, 35], asset: 'part_06_p06-u079.png' },
  'p06-u082': { sourcePage: 10, rect: [45, 80, 340, 155], asset: 'part_06_p06-u082.png' },
  'p06-u089': { sourcePage: 11, rect: [55, 125, 340, 75], asset: 'part_06_p06-u089.png' },
  'p06-u091': { sourcePage: 11, rect: [45, 255, 340, 120], asset: 'part_06_p06-u091.png' },
  'p06-u096': { sourcePage: 11, rect: [55, 535, 340, 55], asset: 'part_06_p06-u096.png' },
  'p06-u102': { sourcePage: 12, rect: [90, 310, 270, 55], asset: 'part_06_p06-u102.png' },
  'p06-u105': { sourcePage: 12, rect: [70, 450, 300, 65], asset: 'part_06_p06-u105.png' },
  'p06-u110': { sourcePage: 13, rect: [55, 150, 340, 180], asset: 'part_06_p06-u110.png' },
  'p06-u113': { sourcePage: 13, rect: [55, 405, 340, 95], asset: 'part_06_p06-u113.png' },
  'p06-u119': { sourcePage: 14, rect: [55, 100, 340, 140], asset: 'part_06_p06-u119.png' },
  'p06-u122': { sourcePage: 14, rect: [55, 325, 340, 100], asset: 'part_06_p06-u122.png' },
  'p06-u124': { sourcePage: 15, rect: [55, 70, 340, 155], asset: 'part_06_p06-u124.png' },
  'p06-u152': { sourcePage: 19, rect: [70, 470, 330, 70], asset: 'part_06_p06-u152.png' },
  'p06-u156': { sourcePage: 20, rect: [45, 78, 340, 130], asset: 'part_06_p06-u156.png' },
  'p06-u166': { sourcePage: 21, rect: [40, 265, 370, 55], asset: 'part_06_p06-u166.png' },
  'p06-u168': { sourcePage: 21, rect: [45, 365, 340, 140], asset: 'part_06_p06-u168.png' }
};

const specialSourceClones = {
  'p06-u136': { sourcePage: 17, asset: 'part_06_special_p17.png' }
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
    const pageImage = renderPage(clone.sourcePage);
    fs.copyFileSync(pageImage, path.join(assetDirectory, clone.asset));
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
    const paragraphs = prose(unit.translated_text || '');
    return `<aside class="${unit.unit_type}" data-unit-id="${unit.unit_id}"><img class="callout-icon" src="../../assets/part_06_image-000.png" alt="">${paragraphs}</aside>`;
  }
  return `<section class="prose ${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text || '')}</section>`;
};

const documentHtml = (units) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Giải thích SQL Performance - Phần 06</title>
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
