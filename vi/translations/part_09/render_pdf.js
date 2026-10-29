#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_09.print.html');
const outputPdf = path.join(root, 'vi/parts/part_09.pdf');
const contentPdf = path.join(directory, 'part_09.content.pdf');
const sourcePdf = path.join(root, 'en_parts/part_09.pdf');
const assetDirectory = path.join(root, 'vi/assets');

const protectedSourceClones = {
  'p09-u006': { sourcePage: 1, rect: [50, 245, 310, 90], asset: 'part_09_p09-u006.png' },
  'p09-u009': { sourcePage: 1, rect: [50, 425, 325, 155], asset: 'part_09_p09-u009.png' },
  'p09-u026': { sourcePage: 5, rect: [100, 445, 210, 130], asset: 'part_09_p09-u026.png' },
  'p09-u038': { sourcePage: 7, rect: [110, 270, 210, 105], asset: 'part_09_p09-u038.png' },
  'p09-u049': { sourcePage: 9, rect: [110, 145, 210, 120], asset: 'part_09_p09-u049.png' },
  'p09-u059': { sourcePage: 10, rect: [45, 315, 340, 230], asset: 'part_09_p09-u059.png' },
  'p09-u068': { sourcePage: 11, rect: [50, 350, 220, 25], asset: 'part_09_p09-u068.png' },
  'p09-u070': { sourcePage: 11, rect: [50, 465, 250, 30], asset: 'part_09_p09-u070.png' },
  'p09-u075': { sourcePage: 12, rect: [60, 165, 220, 25], asset: 'part_09_p09-u075.png' },
  'p09-u078': { sourcePage: 12, rect: [60, 245, 320, 70], asset: 'part_09_p09-u078.png' },
  'p09-u113': { sourcePage: 16, rect: [60, 120, 280, 115], asset: 'part_09_p09-u113.png' },
  'p09-u123': { sourcePage: 17, rect: [50, 245, 180, 25], asset: 'part_09_p09-u123.png' },
  'p09-u126': { sourcePage: 17, rect: [50, 345, 180, 25], asset: 'part_09_p09-u126.png' },
  'p09-u129': { sourcePage: 17, rect: [55, 490, 170, 28], asset: 'part_09_p09-u129.png' },
  'p09-u132': { sourcePage: 18, rect: [50, 90, 325, 45], asset: 'part_09_p09-u132.png' },
  'p09-u138': { sourcePage: 18, rect: [50, 425, 325, 115], asset: 'part_09_p09-u138.png' },
  'p09-u143': { sourcePage: 19, rect: [50, 200, 150, 25], asset: 'part_09_p09-u143.png' }
};

const specialSourceClones = {
  'p09-u013': { sourcePage: 3, asset: 'part_09_special_p09-u013.png' }
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
  if (unit.unit_type === 'subheading') {
    const [label, ...body] = (unit.translated_text || '').split('\n');
    return `<section class="operation" data-unit-id="${unit.unit_id}"><h3>${escapeHtml(label)}</h3>${prose(body.join('\n'))}</section>`;
  }
  if (unit.unit_type === 'caption') return `<p class="caption" data-unit-id="${unit.unit_id}">${text}</p>`;
  if (['note', 'important', 'sidebar', 'tip', 'warning', 'caution', 'think_about_it'].includes(unit.unit_type)) {
    return `<aside class="${unit.unit_type}" data-unit-id="${unit.unit_id}"><img class="callout-icon" src="../../assets/part_08_image-000.png" alt="">${prose(unit.translated_text || '')}</aside>`;
  }
  if (unit.unit_type === 'footnote') return `<footer class="footnote" data-unit-id="${unit.unit_id}">${prose(unit.translated_text || '')}</footer>`;
  return `<section class="prose ${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text || '')}</section>`;
};

const documentHtml = (units) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Giải thích SQL Performance - Phần 09</title>
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
footer.footnote { border-top: 0.5pt solid #aab4b9; color: #59656c; font-family: "Noto Sans", sans-serif; font-size: 8pt; margin-top: 1em; padding-top: 0.5em; }
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
