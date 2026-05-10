import type { Content, TableCell } from "pdfmake";
import { LUCIDE_PATHS, pdfColors } from "../../consts/BuildPdfConsts";
import logo from '../../assets/daedalus_logo.png';
import { fmt } from "../../consts/PcComponentAttributeFormatters";

export function applyFormat(attrFn: ((v: unknown) => string) | undefined, value: unknown): string {
  if (!attrFn) return fmt.str(value);
  try { return attrFn(value) || '—'; }
  catch { return '—'; }
}

export async function lucideIconToPng(endpoint: string, size = 56): Promise<string | null> {
  const paths = LUCIDE_PATHS[endpoint];
  if (!paths) return null;

  const SCALE = 4;
  const canvasSize = size * SCALE;

  const pathEls = paths
    .map(d => `<path d="${d}" stroke="${pdfColors.accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${canvasSize}" height="${canvasSize}">${pathEls}</svg>`;
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export function sectionHeading(text: string): Content {
  return {
    table: {
      widths: ['*'],
      body: [[{
        text: text.toUpperCase(),
        style: 'sectionHeading',
        border: [true, true, true, true],
        fillColor: pdfColors.accent,
        color: pdfColors.white,
        margin: [10, 6, 10, 6],
      }]],
    },
    layout: 'noBorders',
    marginBottom: 0,
  };
}

export function pdfDivider(): Content {
  return {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: pdfColors.border }],
    margin: [0, 0, 0, 0],
  };
}

export function pdfAttrRow(label: string, value: string, shaded: boolean): TableCell[] {
  return [
    {
      text: label,
      style: 'attrLabel',
      fillColor: shaded ? pdfColors.surface2 : pdfColors.surface,
      border: [false, false, false, true],
      borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.border],
    },
    {
      text: value,
      style: 'attrValue',
      fillColor: shaded ? pdfColors.surface2 : pdfColors.surface,
      border: [false, false, false, true],
      borderColor: [pdfColors.border, pdfColors.border, pdfColors.border, pdfColors.border],
    },
  ];
}

export async function getLogoBase64(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = logo;
  });
}

export async function fetchImageBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth  || img.width;
        const h = img.naturalHeight || img.height;
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }

        const r = Math.min(w, h) * 0.05;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}