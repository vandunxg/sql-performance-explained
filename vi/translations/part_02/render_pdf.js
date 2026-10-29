#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_02.print.html');
const outputPdf = path.join(root, 'vi/parts/part_02.pdf');
const sourcePdf = path.join(root, 'en_parts/part_02.pdf');
const contentPdf = path.join(directory, 'part_02.content.pdf');
const assetDirectory = path.join(root, 'vi/assets');

const protectedSourceClones = {
  'p02-u011': { sourcePage: 2, rect: [42, 340, 235, 25], asset: 'part_02_p02-u011.png' },
  'p02-u013': { sourcePage: 2, rect: [42, 419, 150, 44], asset: 'part_02_p02-u013.png' },
  'p02-u014': { sourcePage: 2, rect: [42, 468, 318, 110], asset: 'part_02_p02-u014.png' },
  'p02-u016': { sourcePage: 3, rect: [56, 150, 149, 34], asset: 'part_02_p02-u016.png' },
  'p02-u017': { sourcePage: 3, rect: [56, 189, 264, 101], asset: 'part_02_p02-u017.png' },
  'p02-u024': { sourcePage: 4, rect: [80, 338, 253, 143], asset: 'part_02_p02-u024.png' },
  'p02-u027': { sourcePage: 5, rect: [74, 156, 153, 43], asset: 'part_02_p02-u027.png' },
  'p02-u030': { sourcePage: 5, rect: [66, 404, 225, 23], asset: 'part_02_p02-u030.png' },
  'p02-u033': { sourcePage: 6, rect: [42, 217, 313, 110], asset: 'part_02_p02-u033.png' },
  'p02-u040': { sourcePage: 9, rect: [56, 133, 289, 42], asset: 'part_02_p02-u040.png' },
  'p02-u042': { sourcePage: 9, rect: [66, 237, 308, 120], asset: 'part_02_p02-u042.png' },
  'p02-u044': { sourcePage: 9, rect: [56, 527, 289, 51], asset: 'part_02_p02-u044.png' },
  'p02-u046': { sourcePage: 10, rect: [52, 106, 283, 101], asset: 'part_02_p02-u046.png' },
  'p02-u053': { sourcePage: 12, rect: [52, 235, 307, 120], asset: 'part_02_p02-u053.png' },
  'p02-u055': { sourcePage: 12, rect: [52, 472, 229, 13], asset: 'part_02_p02-u055.png' },
  'p02-u057': { sourcePage: 13, rect: [66, 121, 302, 120], asset: 'part_02_p02-u057.png' },
  'p02-u063': { sourcePage: 14, rect: [52, 356, 205, 32], asset: 'part_02_p02-u063.png' },
  'p02-u065': { sourcePage: 15, rect: [66, 97, 253, 100], asset: 'part_02_p02-u065.png' },
  'p02-u067': { sourcePage: 15, rect: [66, 318, 205, 33], asset: 'part_02_p02-u067.png' },
  'p02-u072': { sourcePage: 16, rect: [52, 107, 176, 22], asset: 'part_02_p02-u072.png' },
  'p02-u074': { sourcePage: 16, rect: [52, 256, 302, 110], asset: 'part_02_p02-u074.png' },
  'p02-u078': { sourcePage: 17, rect: [66, 140, 302, 110], asset: 'part_02_p02-u078.png' },
  'p02-u081': { sourcePage: 17, rect: [66, 510, 287, 23], asset: 'part_02_p02-u081.png' },
  'p02-u088': { sourcePage: 19, rect: [66, 226, 258, 81], asset: 'part_02_p02-u088.png' },
  'p02-u090': { sourcePage: 19, rect: [66, 370, 253, 32], asset: 'part_02_p02-u090.png' }
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
    return `<figure class="source-clone-figure">${sourceClone(unit.unit_id)}</figure>`;
  }
  const text = escapeHtml(unit.translated_text);
  if (unit.unit_type === 'heading') return `<h2 data-unit-id="${unit.unit_id}">${text.replace(/\n/g, '<br>')}</h2>`;
  if (unit.unit_type === 'caption') return `<p class="caption" data-unit-id="${unit.unit_id}">${text}</p>`;
  if (['note', 'important', 'sidebar', 'tip'].includes(unit.unit_type)) {
    return `<aside class="${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text)}</aside>`;
  }
  return `<section class="prose ${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text)}</section>`;
};

const documentHtml = (units) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Giải thích SQL Performance - Phần 02</title>
<style>
@page { size: 148mm 228mm; margin: 17mm 15mm 18mm; }
* { box-sizing: border-box; }
body { color: #202124; font-family: "Noto Serif", serif; font-size: 10.2pt; line-height: 1.47; margin: 0; }
p { margin: 0 0 0.75em; orphans: 3; widows: 3; }
h2 { break-after: avoid; color: #254b66; font-family: "Noto Sans", sans-serif; font-size: 16pt; line-height: 1.2; margin: 1.65em 0 0.7em; }
figure.source-clone-figure { break-inside: avoid; margin: 1em 0 1.25em; }
img.source-clone { display: block; height: auto; max-width: 100%; }
.caption { break-after: avoid; color: #59656c; font-family: "Noto Sans", sans-serif; font-size: 8.7pt; font-style: italic; margin-top: 1.1em; text-align: center; }
aside { break-inside: avoid; border-left: 3pt solid #8b9d38; margin: 1.3em 0; padding: 0.35em 0 0.35em 1em; }
aside.important { border-left-color: #a94a3d; }
aside.sidebar { background: #f5f7ef; border: 0.5pt solid #cbd5a8; padding: 0.8em 1em; }
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
