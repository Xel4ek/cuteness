import { fixedFromDecimal, FractalView } from './fractal-viewport';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export interface FractalPosition {
  coordinates: FractalView;
  maxIteration?: number;
}

// Keep positions copied before the compressed format was introduced usable.
function parseLegacyPosition(text: string): FractalPosition | undefined {
  const match = /^Re:\s*([^\r\n]+)\r?\nIm:\s*([^\r\n]+)\r?\nZoom:\s*([^\r\n]+)\r?\nPrecision:\s*(\d+)$/i.exec(text);
  if (!match) {
    return;
  }
  const precision = Number(match[4]);
  if (!Number.isInteger(precision) || precision < 128 || precision > 65536) {
    return;
  }
  const values = match.slice(1, 4).map((value) => value.trim());
  if (!values.every((value) => /^[+-]?\d+(?:\.\d*)?$/.test(value))) {
    return;
  }
  const zoomPrecision = precision + 32;
  const zoom = fixedFromDecimal(values[2], zoomPrecision);
  if (zoom < 1n << BigInt(zoomPrecision - 1)) {
    return;
  }
  const span = ((3n << BigInt(precision + zoomPrecision)) + zoom / 2n) / zoom;
  if (span === 0n) {
    return;
  }

  return {
    coordinates: {
      centerRe: fixedFromDecimal(values[0], precision),
      centerIm: fixedFromDecimal(values[1], precision),
      span,
      precision,
    },
  };
}

export function copyPosition(view: FractalView, maxIteration: number): string {
  const data = [
    view.precision,
    maxIteration,
    view.centerRe.toString(16),
    view.centerIm.toString(16),
    view.span.toString(16),
  ].join('|');

  return `fractal:1:${compressToEncodedURIComponent(data)}`;
}

export function positionLink(view: FractalView, maxIteration: number, href: string): string {
  const url = new URL(href);
  url.searchParams.set('position', copyPosition(view, maxIteration));

  return url.href;
}

export function parsePosition(text: string): FractalPosition | undefined {
  if (text.length > 1000000) {
    return;
  }
  text = text.trim();
  if (/^https?:\/\//i.test(text)) {
    if (!URL.canParse(text)) {
      return;
    }
    text = new URL(text).searchParams.get('position') ?? '';
  }
  if (!text.startsWith('fractal:1:')) {
    return parseLegacyPosition(text);
  }
  const encoded = text.slice('fractal:1:'.length);
  if (!/^[\w+$-]+$/.test(encoded)) {
    return;
  }
  const data = decompressFromEncodedURIComponent(encoded);
  const match = data && /^(\d+)\|(\d+)\|(-?[\da-f]+)\|(-?[\da-f]+)\|([\da-f]+)$/.exec(data);
  if (!match) {
    return;
  }
  const precision = Number(match[1]);
  const maxIteration = Number(match[2]);
  if (precision < 128 || precision > 65536 || maxIteration < 100 || maxIteration > 50000) {
    return;
  }
  const fromHex = (value: string) => (value.startsWith('-') ? -BigInt(`0x${value.slice(1)}`) : BigInt(`0x${value}`));
  const span = fromHex(match[5]);
  if (span === 0n || span > 6n << BigInt(precision)) {
    return;
  }

  return {
    coordinates: { centerRe: fromHex(match[3]), centerIm: fromHex(match[4]), span, precision },
    maxIteration,
  };
}

/** With precision decimal places, a binary fixed-point value is represented exactly. */
export function fixedToDecimal(value: bigint, precision: number, places = precision): string {
  const magnitude = value < 0n ? -value : value;
  const scale = 10n ** BigInt(places);
  const rounded = (magnitude * scale + (1n << BigInt(precision - 1))) >> BigInt(precision);
  if (rounded === 0n) {
    return '0';
  }
  const digits = rounded.toString().padStart(places + 1, '0');
  const integer = digits.slice(0, digits.length - places);
  const fraction = digits.slice(digits.length - places).replace(/0+$/, '');

  return `${value < 0n ? '-' : ''}${integer}${fraction ? `.${fraction}` : ''}`;
}

export function centerLabels(view: FractalView, width: number): { re: string; im: string } {
  const pixelBits = view.precision - view.span.toString(2).length + Math.ceil(Math.log2(Math.max(1, width)));
  const places = Math.max(6, Math.ceil(pixelBits * Math.log10(2)) + 3);
  const compact = (value: bigint) => {
    const text = fixedToDecimal(value, view.precision, places);

    return text.length <= 24 ? text : `${text.slice(0, 10)}…${text.slice(-10)}`;
  };

  return { re: compact(view.centerRe), im: compact(view.centerIm) };
}
