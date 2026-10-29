#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_10.print.html');
const outputPdf = path.join(root, 'vi/parts/part_10.pdf');
const contentPdf = path.join(directory, 'part_10.content.pdf');
const sourcePdf = path.join(root, 'en_parts/part_10.pdf');
const assetDirectory = path.join(root, 'vi/assets');

const protectedSourceClones = {
  'p10-u014': { sourcePage: 1, rect: [55, 510, 300, 75], asset: 'part_10_p10-u014.png' },
  'p10-u016': { sourcePage: 2, rect: [42, 100, 327, 150], asset: 'part_10_p10-u016.png' },
  'p10-u020': { sourcePage: 2, rect: [42, 445, 330, 35], asset: 'part_10_p10-u020.png' },
  'p10-u022': { sourcePage: 2, rect: [42, 500, 330, 85], asset: 'part_10_p10-u022.png' },
  'p10-u034': { sourcePage: 4, rect: [60, 470, 290, 30], asset: 'part_10_p10-u034.png' },
  'p10-u037': { sourcePage: 5, rect: [80, 45, 300, 120], asset: 'part_10_p10-u037.png' },
  'p10-u042': { sourcePage: 5, rect: [55, 330, 320, 30], asset: 'part_10_p10-u042.png' },
  'p10-u045': { sourcePage: 5, rect: [60, 450, 340, 145], asset: 'part_10_p10-u045.png' },
  'p10-u047': { sourcePage: 6, rect: [45, 125, 330, 55], asset: 'part_10_p10-u047.png' },
  'p10-u049': { sourcePage: 6, rect: [45, 205, 170, 25], asset: 'part_10_p10-u049.png' },
  'p10-u079': { sourcePage: 9, rect: [55, 378, 300, 85], asset: 'part_10_p10-u079.png' },
  'p10-u081': { sourcePage: 9, rect: [55, 488, 180, 55], asset: 'part_10_p10-u081.png' },
  'p10-u084': { sourcePage: 10, rect: [40, 145, 345, 260], asset: 'part_10_p10-u084.png' },
  'p10-u088': { sourcePage: 11, rect: [60, 165, 140, 120], asset: 'part_10_p10-u088.png' },
  'p10-u090': { sourcePage: 11, rect: [60, 335, 300, 75], asset: 'part_10_p10-u090.png' },
  'p10-u096': { sourcePage: 12, rect: [48, 207, 100, 25], asset: 'part_10_p10-u096.png' },
  'p10-u098': { sourcePage: 12, rect: [48, 260, 315, 65], asset: 'part_10_p10-u098.png' },
  'p10-u124': { sourcePage: 15, rect: [55, 92, 235, 245], asset: 'part_10_p10-u124.png' },
  'p10-u128': { sourcePage: 16, rect: [45, 102, 305, 120], asset: 'part_10_p10-u128.png' },
  'p10-u131': { sourcePage: 16, rect: [45, 292, 255, 65], asset: 'part_10_p10-u131.png' },
  'p10-u132': { sourcePage: 17, rect: [0, 0, 425.196, 651.968], asset: 'part_10_p10-u132.png' },
  'p10-u133': { sourcePage: 18, rect: [0, 0, 425.196, 651.968], asset: 'part_10_p10-u133.png' },
  'p10-u134': { sourcePage: 19, rect: [0, 0, 425.196, 651.968], asset: 'part_10_p10-u134.png' },
  'p10-u161': { sourcePage: 21, rect: [230, 520, 165, 85], asset: 'part_10_p10-u161.png' }
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
  for (const sourcePageImage of sourcePageImages.values()) fs.rmSync(sourcePageImage);
};

const renderUnit = (unit) => {
  const clone = protectedSourceClones[unit.unit_id];
  if (clone) {
    return `<figure class="source-clone-figure"><img class="source-clone" data-unit-id="${unit.unit_id}" data-source-page="${clone.sourcePage}" data-source-rect="${clone.rect.join(',')}" src="../../assets/${clone.asset}" alt="Nguồn gốc được sao chép nguyên trạng"></figure>`;
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
<title>Giải thích SQL Performance - Phần 10</title>
<style>
@page { size: 148mm 228mm; margin: 17mm 15mm 18mm; }
* { box-sizing: border-box; }
body { color: #202124; font-family: "Noto Serif", serif; font-size: 10.2pt; line-height: 1.47; margin: 0; }
p { margin: 0 0 0.75em; orphans: 3; widows: 3; }
h2 { break-after: avoid; color: #254b66; font-family: "Noto Sans", sans-serif; font-size: 16pt; line-height: 1.2; margin: 1.65em 0 0.7em; }
h3 { break-after: avoid; color: #254b66; font-family: "Noto Sans", sans-serif; font-size: 11.5pt; line-height: 1.25; margin: 1em 0 0.45em; }
figure.source-clone-figure { break-inside: avoid; margin: 1em 0 1.25em; }
img.source-clone { display: block; height: auto; max-width: 100%; }
.callout-icon { float: left; height: 16pt; margin: 0.05em 0.55em 0.2em 0; width: 11pt; object-fit: contain; }
aside { break-inside: avoid; border-left: 3pt solid #8b9d38; margin: 1.3em 0; padding: 0.35em 0 0.35em 1em; }
aside.important, aside.caution, aside.warning { border-left-color: #a94a3d; }
aside p:last-child { margin-bottom: 0; }
.operation { break-inside: avoid; }
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
