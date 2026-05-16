/* eslint-disable @typescript-eslint/no-explicit-any */

import pdfMake from 'pdfmake/build/pdfmake';
import type { TDocumentDefinitions, Content, TableCell, Style, Column } from 'pdfmake/interfaces';
import { COMPONENT_ATTRS, BASE_ATTRS } from '../../consts/PcComponentAttributeDetails';
import { CREATE_BUILD_SLOTS } from '../../consts/CreateBuildConsts';
import { SLOT_TO_API } from '../../consts/BuildDetailsConsts';
import type { BuildDetail, BuildComponent, BuildMultiEntry } from '../../types/BuildDetails.type';
import RajdhaniRegularB64 from '../../assets/fonts/Rajdhani-Regular.b64?raw';
import RajdhaniBoldB64    from '../../assets/fonts/Rajdhani-Bold.b64?raw';
import { applyFormat, base64ToUint8Array, fetchImageBase64, getLogoBase64, lucideIconToPng, pdfAttrRow, pdfDivider, sectionHeading } from './buildPdfExportUtils';
import { fmt } from '../../consts/PcComponentAttributeFormatters';
import { pdfColors } from '../../consts/BuildPdfConsts';

const MARGIN_H = 36;
const MARGIN_V = 40;

const styles: Record<string, Style> = {
  brandName:              { font: 'Rajdhani', fontSize: 20, bold: true,  color: pdfColors.accent, characterSpacing: 1, marginLeft: 6 },
  brandSub:               { font: 'Rajdhani', fontSize: 9,               color: pdfColors.muted,  characterSpacing: 1, marginLeft: 6 },
  brandNameSmall:         { font: 'Rajdhani', fontSize: 13, bold: true,  color: pdfColors.accent, characterSpacing: 2 },
  brandSubSmall:          { font: 'Rajdhani', fontSize: 9,               color: pdfColors.muted },
  dateLabel:              { font: 'Rajdhani', fontSize: 9,               color: pdfColors.muted },
  buildTitle:             { font: 'Rajdhani', fontSize: 22, bold: true,  color: pdfColors.white },
  authorText:             { font: 'Rajdhani', fontSize: 10,              color: pdfColors.muted },
  fieldLabel:             { font: 'Rajdhani', fontSize: 8,  bold: true,  color: pdfColors.muted,  characterSpacing: 1 },
  descriptionText:        { font: 'Rajdhani', fontSize: 10,              color: pdfColors.text,   lineHeight: 1.5 },
  statValue:              { font: 'Rajdhani', fontSize: 14, bold: true,  color: pdfColors.text },
  sectionHeading:         { font: 'Rajdhani', fontSize: 10, bold: true,  color: pdfColors.white,  characterSpacing: 1.5 },
  tableHeader:            { font: 'Rajdhani', fontSize: 9,  bold: true,  color: pdfColors.accent, characterSpacing: 0.5 },
  tableCell:              { font: 'Rajdhani', fontSize: 9,               color: pdfColors.text },
  attrLabel:              { font: 'Rajdhani', fontSize: 9,  bold: true,  color: pdfColors.muted },
  attrValue:              { font: 'Rajdhani', fontSize: 9,               color: pdfColors.text },
  componentTypeLabelNoBox:{ font: 'Rajdhani', fontSize: 9,  bold: true,  color: pdfColors.accent, characterSpacing: 1 },
  componentDetailTitle:   { font: 'Rajdhani', fontSize: 18, bold: true,  color: pdfColors.white },
  componentManufacturer:  { font: 'Rajdhani', fontSize: 11,              color: pdfColors.muted },
  quantityLabel:          { font: 'Rajdhani', fontSize: 9,  bold: true,  color: pdfColors.accent },
};

type AttrDef = (typeof BASE_ATTRS)[number];

interface ComponentRowFull {
  label:     string;
  component: BuildComponent;
  quantity?: number;
  endpoint:  string;
  attrs:     AttrDef[];
}

async function buildSummaryPage(build: BuildDetail, rows: ComponentRowFull[], logoPng: string | null): Promise<Content[]> {
  const content: Content[] = [];

  const headerColumns: Column[] = [];

  if (logoPng) {
    headerColumns.push({
      image: logoPng,
      width: 40,
      margin: [0, 0, 8, 0],
    });
  }

  headerColumns.push({
    stack: [
      { text: 'Daedalus', style: 'brandName' },
      { text: 'Build Report', style: 'brandSub' },
    ],
  });

  content.push({
    columns: headerColumns,
    columnGap: 0,
    marginBottom: 4,
  });

  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: pdfColors.accent }],
    marginBottom: 20,
  });

  const IMAGE_W = 160;
  const IMAGE_H = 130;

  let imageCol: Content | null = null;  
  if (build.photoUrl) {
    const b64 = await fetchImageBase64(build.photoUrl);
    if (b64) {
      imageCol = { image: b64, width: IMAGE_W, height: IMAGE_H } as Content;
    }
  }

  const infoStack: Content[] = [
    { text: build.name, style: 'buildTitle' },
    { text: build.username ? `by ${build.username}` : '', style: 'authorText', marginTop: 4 },
  ];
  if (build.description) {
    infoStack.push({ text: '', marginTop: 10 } as Content);
    infoStack.push({ text: 'Description', style: 'fieldLabel', marginBottom: 4 } as Content);
    infoStack.push({ text: build.description, style: 'descriptionText' } as Content);
  }
  infoStack.push({ text: '', marginTop: 10 } as Content);
  infoStack.push({
    stack: [
      { text: 'Components', style: 'fieldLabel', marginBottom: 4 },
      { text: `${rows.length} item${rows.length !== 1 ? 's' : ''}`, style: 'statValue' },
    ],
  } as Content);

  content.push({
    columns: [
      ...(imageCol ? [{ ...imageCol as Record<string, any>, width: IMAGE_W }] : []),
      { stack: infoStack, width: '*', margin: [imageCol ? 20 : 0, 0, 0, 0] },
    ],
    columnGap: 0,
    marginBottom: 20,
  } as Content);

  content.push(pdfDivider());
  content.push({ text: '', marginBottom: 16 });

  content.push(sectionHeading('Components Overview'));

  const tableBody: TableCell[][] = [
    [
      { text: 'Type',         style: 'tableHeader', fillColor: pdfColors.surface2, border: [false, false, false, true], borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.accent] },
      { text: 'Component',    style: 'tableHeader', fillColor: pdfColors.surface2, border: [false, false, false, true], borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.accent] },
      { text: 'Manufacturer', style: 'tableHeader', fillColor: pdfColors.surface2, border: [false, false, false, true], borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.accent] },
      { text: 'Quantity',     style: 'tableHeader', alignment: 'center', fillColor: pdfColors.surface2, border: [false, false, false, true], borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.accent] },
    ],
    ...rows.map((row, i): TableCell[] => [
      {
        text: row.label,
        style: 'tableCell',
        color: pdfColors.accent,
        fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2,
        border: [false, false, false, true],
        borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.border],
      },
      {
        text: row.component.name ?? '—',
        style: 'tableCell',
        fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2,
        border: [false, false, false, true],
        borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.border],
      },
      {
        text: fmt.str(row.component.manufacturer),
        style: 'tableCell',
        color: pdfColors.muted,
        fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2,
        border: [false, false, false, true],
        borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.border],
      },
      {
        text: row.quantity != null ? String(row.quantity) : '1',
        style: 'tableCell',
        alignment: 'center',
        fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2,
        border: [false, false, false, true],
        borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.border],
      },
    ]),
  ];

  content.push({
    table: {
      headerRows: 1,
      widths: [80, '*', 100, 45],
      body: tableBody,
    },
    layout: {
      hLineWidth: () => 0.5,
      hLineColor: () => pdfColors.border,
      vLineWidth: () => 0,
      paddingTop: () => 8,
      paddingBottom: () => 8,
      paddingLeft: () => 8,
      paddingRight: () => 8,
    },
  });

  return content;
}

function componentDetailPage(row: ComponentRowFull, iconPng: string | null, logoPng: string | null): Content[] {
  const content: Content[] = [];

  content.push({ text: '', pageBreak: 'before' } as Content);

  content.push({
  columns: [
    {
      columns: [
        ...(logoPng ? [{ 
          image: logoPng, 
          width: 20, 
          margin: [0, -4, 0, 0] as number[] 
        }] : []),
        { text: 'Daedalus', style: 'brandNameSmall' },
      ] as any[],
      columnGap: 4,
    },
    { text: 'Component Details', style: 'brandSubSmall', alignment: 'right' },
  ],
  marginBottom: 4,
});

  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: pdfColors.accent }],
    marginBottom: 16,
  });

  const ICON_SIZE = 48;
  const leftColStack: Content[] = [];

  if (iconPng) {
    leftColStack.push({
      image: iconPng,
      width: ICON_SIZE,
      height: ICON_SIZE,
      alignment: 'center',
    } as Content);
  }

  leftColStack.push({
    text: row.label.toUpperCase(),
    style: 'componentTypeLabelNoBox',
    alignment: 'center',
    marginTop: iconPng ? 6 : 0,
  } as Content);

  content.push({
    columns: [
      {
        stack: leftColStack,
        width: 90,
        margin: [0, 4, 0, 0],
      },
      {
        stack: [
          { text: row.component.name ?? '—', style: 'componentDetailTitle' },
          { text: fmt.str(row.component.manufacturer), style: 'componentManufacturer', marginTop: 4 },
          ...(row.quantity != null ? [{
            text: `Quantity: ${row.quantity}`,
            style: 'quantityLabel',
            marginTop: 6,
          }] : []),
        ] as Content[],
        margin: [16, 0, 0, 0],
      },
    ],
    columnGap: 0,
    marginBottom: 16,
  });

  content.push(pdfDivider());
  content.push({ text: '', marginBottom: 12 });

  content.push(sectionHeading('Technical Specifications'));

  const attrRows: TableCell[][] = row.attrs.map((attr, i) => {
    const raw = (row.component as Record<string, unknown>)[attr.key];
    const display = applyFormat(attr.format, raw);
    return pdfAttrRow(attr.label, display, i % 2 !== 0);
  });

  content.push({
    table: {
      widths: [160, '*'],
      body: attrRows,
    },
    layout: {
      hLineWidth: () => 0.5,
      hLineColor: () => pdfColors.border,
      vLineWidth: () => 0,
      paddingTop: () => 8,
      paddingBottom: () => 8,
      paddingLeft: () => 8,
      paddingRight: () => 8,
    },
  });

  const comp = row.component as Record<string, unknown>;

  const m2Slots = Array.isArray(comp['m2Slots']) ? (comp['m2Slots'] as Record<string, unknown>[]) : [];
  if (m2Slots.length > 0) {
    content.push({ text: '', marginTop: 16 });
    content.push(sectionHeading('M.2 Slots'));
    content.push({
      table: {
        headerRows: 1,
        widths: [30, '*', '*', '*'],
        body: [
          [
            { text: '#',         style: 'tableHeader', fillColor: pdfColors.surface2 },
            { text: 'Size',      style: 'tableHeader', fillColor: pdfColors.surface2 },
            { text: 'Key',       style: 'tableHeader', fillColor: pdfColors.surface2 },
            { text: 'Interface', style: 'tableHeader', fillColor: pdfColors.surface2 },
          ],
          ...m2Slots.map((slot, i) => [
            { text: String(i + 1),           style: 'tableCell', fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2 },
            { text: fmt.str(slot['size']),    style: 'tableCell', fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2 },
            { text: fmt.str(slot['key']),     style: 'tableCell', fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2 },
            { text: fmt.str(slot['m2Interface']), style: 'tableCell', fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2 },
          ] as TableCell[]),
        ],
      },
      layout: { hLineWidth: () => 0.5, hLineColor: () => pdfColors.border, vLineWidth: () => 0 },
    });
  }

  const pcieSlots = Array.isArray(comp['pcieSlots']) ? (comp['pcieSlots'] as Record<string, unknown>[]) : [];
  if (pcieSlots.length > 0) {
    content.push({ text: '', marginTop: 16 });
    content.push(sectionHeading('PCIe Slots'));
    content.push({
      table: {
        headerRows: 1,
        widths: [30, '*', '*', '*'],
        body: [
          [
            { text: '#',        style: 'tableHeader', fillColor: pdfColors.surface2 },
            { text: 'Gen',      style: 'tableHeader', fillColor: pdfColors.surface2 },
            { text: 'Lanes',    style: 'tableHeader', fillColor: pdfColors.surface2 },
            { text: 'Quantity', style: 'tableHeader', fillColor: pdfColors.surface2 },
          ],
          ...pcieSlots.map((slot, i) => [
            { text: String(i + 1),                                         style: 'tableCell', fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2 },
            { text: fmt.str(slot['gen']),                                   style: 'tableCell', fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2 },
            { text: slot['lanes'] != null ? `x${slot['lanes']}` : '—',    style: 'tableCell', fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2 },
            { text: fmt.str(slot['quantity']),                              style: 'tableCell', fillColor: i % 2 === 0 ? pdfColors.surface : pdfColors.surface2 },
          ] as TableCell[]),
        ],
      },
      layout: { hLineWidth: () => 0.5, hLineColor: () => pdfColors.border, vLineWidth: () => 0 },
    });
  }

  return content;
}

export async function generateBuildPdf(build: BuildDetail): Promise<void> {

  const vfs = (pdfMake as any).virtualfs.storage;
  vfs['Rajdhani-Regular.ttf'] = base64ToUint8Array(RajdhaniRegularB64);
  vfs['Rajdhani-Bold.ttf']    = base64ToUint8Array(RajdhaniBoldB64);

  (pdfMake as any).fonts = {
    Rajdhani: {
      normal:      'Rajdhani-Regular.ttf',
      bold:        'Rajdhani-Bold.ttf',
      italics:     'Rajdhani-Regular.ttf',
      bolditalics: 'Rajdhani-Bold.ttf',
    },
  };

  const logoPng = await getLogoBase64();
  const rows: ComponentRowFull[] = [];

  for (const slot of CREATE_BUILD_SLOTS) {
    const mapping = SLOT_TO_API[slot.key];
    if (!mapping) continue;

    if (mapping.single) {
      const comp = (build as unknown as Record<string, BuildComponent | undefined>)[mapping.single];
      if (comp) {
        rows.push({
          label:     slot.label,
          component: comp,
          endpoint:  mapping.endpoint,
          attrs:     COMPONENT_ATTRS[mapping.endpoint] ?? BASE_ATTRS,
        });
      }
    } else if (mapping.multi) {
      const entries = (build as unknown as Record<string, BuildMultiEntry[] | undefined>)[mapping.multi] ?? [];
      for (const entry of entries) {
        rows.push({
          label:     slot.label,
          component: entry.component,
          quantity:  entry.quantity,
          endpoint:  mapping.endpoint,
          attrs:     COMPONENT_ATTRS[mapping.endpoint] ?? BASE_ATTRS,
        });
      }
    }
  }

  const iconPngs = await Promise.all(
    rows.map(row => lucideIconToPng(row.endpoint, 56))
  );

  const summaryContent = await buildSummaryPage(build, rows, logoPng);
  const componentPages: Content[] = rows.flatMap((row, i) =>
    componentDetailPage(row, iconPngs[i], logoPng)
  );

  const docDef: TDocumentDefinitions = {
    pageSize:    'A4',
    pageMargins: [MARGIN_H, MARGIN_V, MARGIN_H, MARGIN_V],
    background: () => ({
      canvas: [{
        type:  'rect',
        x: 0, y: 0,
        w: 595.28,
        h: 841.89,
        color: pdfColors.bg,
      }],
    }),
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Daedalus · ${build.name}`, style: 'dateLabel', margin: [MARGIN_H, 0, 0, 0] },
        { text: `${currentPage} / ${pageCount}`, style: 'dateLabel', alignment: 'right', margin: [0, 0, MARGIN_H, 0] },
      ],
    }),
    content: [
      ...summaryContent,
      ...componentPages,
    ],
    styles,
    defaultStyle: {
      font:     'Rajdhani',
      color:    pdfColors.text,
      fontSize: 10,
    },
  };

  const safeName = build.name.replace(/[^a-z0-9\-_ ]/gi, '_').trim() || 'build';

  try {
    (pdfMake as any).createPdf(docDef).download(`daedalus_${safeName}.pdf`);
  } catch (err) {
    console.error('error creating pdf:', err);
  }
}