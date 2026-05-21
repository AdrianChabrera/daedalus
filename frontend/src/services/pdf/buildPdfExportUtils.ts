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

export interface FetchedImage {
  data: string;
  width: number;
  height: number;
}

export async function fetchImageBase64(
  url: string,
  cropWidth?: number,
  cropHeight?: number,
): Promise<FetchedImage | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const srcW = img.naturalWidth  || img.width;
        const srcH = img.naturalHeight || img.height;

        const outW = cropWidth  ?? srcW;
        const outH = cropHeight ?? srcH;

        const scale = Math.max(outW / srcW, outH / srcH);
        const scaledW = srcW * scale;
        const scaledH = srcH * scale;

        const offsetX = (outW - scaledW) / 2;
        const offsetY = (outH - scaledH) / 2;

        const SCALE = 4;

        const canvas = document.createElement('canvas');
        canvas.width  = outW * SCALE;
        canvas.height = outH * SCALE;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }

        ctx.scale(SCALE, SCALE);

        const r = Math.min(outW, outH) * 0.05;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(outW - r, 0);
        ctx.quadraticCurveTo(outW, 0, outW, r);
        ctx.lineTo(outW, outH - r);
        ctx.quadraticCurveTo(outW, outH, outW - r, outH);
        ctx.lineTo(r, outH);
        ctx.quadraticCurveTo(0, outH, 0, outH - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

        resolve({ data: canvas.toDataURL('image/png'), width: outW, height: outH });
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