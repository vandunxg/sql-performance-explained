#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_07.print.html');
const outputPdf = path.join(root, 'vi/parts/part_07.pdf');
const contentPdf = path.join(directory, 'part_07.content.pdf');
const sourcePdf = path.join(root, 'en_parts/part_07.pdf');
const assetDirectory = path.join(root, 'vi/assets');

const protectedSourceClones = {
  'p07-u009': { sourcePage: 2, rect: [45, 245, 340, 90], asset: 'part_07_p07-u009.png' },
  'p07-u012': { sourcePage: 2, rect: [45, 405, 340, 125], asset: 'part_07_p07-u012.png' },
  'p07-u021': { sourcePage: 4, rect: [45, 120, 340, 50], asset: 'part_07_p07-u021.png' },
  'p07-u023': { sourcePage: 4, rect: [45, 235, 340, 140], asset: 'part_07_p07-u023.png' },
  'p07-u046': { sourcePage: 6, rect: [45, 320, 340, 30], asset: 'part_07_p07-u046.png' },
  'p07-u057': { sourcePage: 8, rect: [55, 245, 315, 65], asset: 'part_07_p07-u057.png' },
  'p07-u066': { sourcePage: 9, rect: [45, 255, 345, 185], asset: 'part_07_p07-u066.png' },
  'p07-u071': { sourcePage: 10, rect: [45, 180, 345, 225], asset: 'part_07_p07-u071.png' },
  'p07-u077': { sourcePage: 11, rect: [55, 140, 330, 150], asset: 'part_07_p07-u077.png' },
  'p07-u080': { sourcePage: 11, rect: [55, 390, 330, 175], asset: 'part_07_p07-u080.png' },
  'p07-u091': { sourcePage: 13, rect: [55, 290, 320, 65], asset: 'part_07_p07-u091.png' },
  'p07-u099': { sourcePage: 13, rect: [55, 470, 320, 85], asset: 'part_07_p07-u099.png' },
  'p07-u113': { sourcePage: 16, rect: [45, 205, 340, 70], asset: 'part_07_p07-u113.png' },
  'p07-u115': { sourcePage: 16, rect: [45, 315, 340, 100], asset: 'part_07_p07-u115.png' },
  'p07-u117': { sourcePage: 16, rect: [45, 420, 340, 50], asset: 'part_07_p07-u117.png' },
  'p07-u118': { sourcePage: 16, rect: [45, 485, 340, 100], asset: 'part_07_p07-u118.png' },
  'p07-u124': { sourcePage: 17, rect: [45, 190, 340, 60], asset: 'part_07_p07-u124.png' },
  'p07-u127': { sourcePage: 17, rect: [95, 420, 250, 150], asset: 'part_07_p07-u127.png' },
  'p07-u130': { sourcePage: 18, rect: [45, 100, 340, 65], asset: 'part_07_p07-u130.png' },
  'p07-u132': { sourcePage: 18, rect: [45, 250, 340, 115], asset: 'part_07_p07-u132.png' },
  'p07-u144': { sourcePage: 20, rect: [45, 190, 340, 75], asset: 'part_07_p07-u144.png' },
  'p07-u146': { sourcePage: 20, rect: [45, 320, 340, 100], asset: 'part_07_p07-u146.png' }
};

const specialSourceClones = {
  'p07-u102': { sourcePage: 14, asset: 'part_07_special_p14.png' }
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
    return `<aside class="${unit.unit_type}" data-unit-id="${unit.unit_id}"><img class="callout-icon" src="../../assets/part_07_image-000.png" alt="">${prose(unit.translated_text || '')}</aside>`;
  }
  return `<section class="prose ${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text || '')}</section>`;
};

const documentHtml = (units) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Giải thích SQL Performance - Phần 07</title>
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
