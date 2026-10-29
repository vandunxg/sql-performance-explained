#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const directory = __dirname;
const root = path.resolve(directory, '../../..');
const translation = JSON.parse(fs.readFileSync(path.join(directory, 'translation.json'), 'utf8'));
const outputHtml = path.join(directory, 'part_01.print.html');
const outputPdf = path.join(root, 'vi/parts/part_01.pdf');
const sourcePdf = path.join(root, 'en_parts/part_01.pdf');
const frontMatterPdf = path.join(directory, 'part_01.front-matter.pdf');
const contentPdf = path.join(directory, 'part_01.content.pdf');
const diagrams = {
  'p01-u023': { file: 'part_01_diagram_1_1.png', alt: 'Sơ đồ gốc Hình 1.1: index leaf node và dữ liệu table tương ứng' },
  'p01-u028': { file: 'part_01_diagram_1_2.png', alt: 'Sơ đồ gốc Hình 1.2: cấu trúc B-tree' },
  'p01-u032': { file: 'part_01_diagram_1_3.png', alt: 'Sơ đồ gốc Hình 1.3: duyệt B-tree' }
};
const protectedSourceClones = {
  'p01-u010': { sourcePage: 8, rect: [42, 300, 147, 36], asset: 'part_01_p01-u010.png' },
  'p01-u020': { sourcePage: 13, rect: [56, 71, 327, 59], asset: 'part_01_p01-u020.png' },
  'p01-u038-table': { sourcePage: 17, rect: [244, 266, 125, 141], asset: 'part_01_p01-u038-table.png' },
  'p01-u046': { sourcePage: 20, rect: [42, 170, 270, 85], asset: 'part_01_p01-u046.png' },
  'p01-u048': { sourcePage: 20, rect: [42, 337, 155, 38], asset: 'part_01_p01-u048.png' },
  'p01-u050': { sourcePage: 20, rect: [42, 450, 320, 115], asset: 'part_01_p01-u050.png' }
};
const assetDirectory = path.join(root, 'vi/assets');

const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const prose = (text) => escapeHtml(text).split('\n').map((paragraph) => `<p>${paragraph || '&nbsp;'}</p>`).join('');

const sourceClone = (unitId) => {
  const clone = protectedSourceClones[unitId];
  if (!clone) throw new Error(`No source crop mapped for ${unitId}`);
  return `<img class="source-clone" data-unit-id="${unitId}" data-source-page="${clone.sourcePage}" data-source-rect="${clone.rect.join(',')}" src="../../assets/${clone.asset}" alt="Nguồn gốc được sao chép nguyên trạng">`;
};

const createProtectedSourceClones = () => {
  for (const clone of Object.values(protectedSourceClones)) {
    const [x, y, width, height] = clone.rect;
    const temporary = path.join(directory, `.source-page-${clone.sourcePage}.png`);
    execFileSync('pdftoppm', ['-f', String(clone.sourcePage), '-l', String(clone.sourcePage), '-r', '400', '-png', '-singlefile', sourcePdf, temporary.slice(0, -4)]);
    execFileSync('magick', [temporary, '-crop', `${width * 400 / 72}x${height * 400 / 72}+${x * 400 / 72}+${y * 400 / 72}`, '+repage', path.join(assetDirectory, clone.asset)]);
    fs.rmSync(temporary);
  }
};

const logarithmicScalabilityRows = [
  ['3', '64'],
  ['4', '256'],
  ['5', '1,024'],
  ['6', '4,096'],
  ['7', '16,384'],
  ['8', '65,536'],
  ['9', '262,144'],
  ['10', '1,048,576']
];

const renderLogarithmicScalability = (unit) => {
  const lines = unit.translated_text.split('\n');
  const tableStart = lines.indexOf('Tree Depth');
  const afterTable = lines.indexOf('Database khai thác khái niệm này tối đa và đưa nhiều entry nhất có thể vào mỗi node — thường là hàng trăm. Điều đó có nghĩa mỗi index level mới hỗ trợ số entry nhiều gấp một trăm lần.');
  const flattenedTable = ['Tree Depth', 'Index Entries', ...logarithmicScalabilityRows.flat()];

  if (tableStart === -1 || afterTable === -1 || lines.slice(tableStart, afterTable).join('\n') !== flattenedTable.join('\n')) {
    throw new Error('Unexpected p01-u038 table content');
  }

  return `<aside class="sidebar" data-unit-id="${unit.unit_id}">${prose(lines.slice(0, tableStart).join('\n'))}<figure class="source-clone-figure">${sourceClone('p01-u038-table')}</figure>${prose(lines.slice(afterTable).join('\n'))}</aside>`;
};

const renderUnit = (unit) => {
  const text = escapeHtml(unit.translated_text);
  if (unit.unit_type === 'title') return `<section class="title" data-unit-id="${unit.unit_id}">${text.replace(/\n/g, '<br>')}</section>`;
  if (unit.unit_type === 'heading') return `<h2 data-unit-id="${unit.unit_id}">${text.replace(/\n/g, '<br>')}</h2>`;
  if (unit.unit_type === 'caption') return `<p class="caption" data-unit-id="${unit.unit_id}">${text}</p>`;
  if (unit.unit_type === 'diagram') {
    const diagram = diagrams[unit.unit_id];
    if (!diagram) throw new Error(`No source graphic mapped for ${unit.unit_id}`);
    return `<figure class="diagram" data-unit-id="${unit.unit_id}"><img src="../../assets/${diagram.file}" alt="${diagram.alt}"></figure>`;
  }
  if (protectedSourceClones[unit.unit_id]) return `<figure class="source-clone-figure">${sourceClone(unit.unit_id)}</figure>`;
  if (unit.unit_id === 'p01-u038') return renderLogarithmicScalability(unit);
  if (['note', 'important', 'sidebar'].includes(unit.unit_type)) {
    return `<aside class="${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text)}</aside>`;
  }
  return `<section class="prose ${unit.unit_type}" data-unit-id="${unit.unit_id}">${prose(unit.translated_text)}</section>`;
};

const documentHtml = (units) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Giải thích SQL Performance - Phần 01</title>
<style>
@page { size: 148mm 228mm; margin: 17mm 15mm 18mm; }
* { box-sizing: border-box; }
body { color: #202124; font-family: "Noto Serif", serif; font-size: 10.2pt; line-height: 1.47; margin: 0; }
p { margin: 0 0 0.75em; orphans: 3; widows: 3; }
h2 { break-after: avoid; color: #254b66; font-family: "Noto Sans", sans-serif; font-size: 16pt; line-height: 1.2; margin: 1.65em 0 0.7em; }
.title { break-after: page; color: #173a54; font-family: "Noto Sans", sans-serif; font-size: 25pt; font-weight: 700; line-height: 1.25; margin: 2.3em 0 1.25em; text-align: center; }
.front_matter { color: #3d3d3d; font-size: 9.4pt; }
figure.source-clone-figure { break-inside: avoid; margin: 1em 0 1.25em; }
img.source-clone { display: block; height: auto; max-width: 100%; }
figure.diagram { break-inside: avoid; margin: 1.1em auto 1.3em; text-align: center; }
figure.diagram img { display: block; height: auto; margin: 0 auto; max-height: 150mm; max-width: 100%; }
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

const specialSourceUnits = new Set(['p01-u001', 'p01-u006', 'p01-u007']);
const translatedUnits = translation.translation.filter((unit) => !specialSourceUnits.has(unit.unit_id));
createProtectedSourceClones();
fs.writeFileSync(outputHtml, documentHtml(translatedUnits));

renderPdf(translation.translation.filter((unit) => ['p01-u002', 'p01-u003', 'p01-u004', 'p01-u005'].includes(unit.unit_id)), frontMatterPdf);
renderPdf(translation.translation.filter((unit) => !specialSourceUnits.has(unit.unit_id) && !['p01-u002', 'p01-u003', 'p01-u004', 'p01-u005'].includes(unit.unit_id)), contentPdf);

// Preserve the original cover, title, and two-page table of contents as PDF pages.
execFileSync('qpdf', [
  '--empty', '--pages', sourcePdf, '1', frontMatterPdf, '1-z', sourcePdf, '5-7', contentPdf, '1-z', '--', outputPdf
], { stdio: 'inherit' });

fs.rmSync(frontMatterPdf);
fs.rmSync(contentPdf);
