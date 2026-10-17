import { CanvasCoordinates, CanvasTransform } from './canvas-coordinates';

export interface FractalView {
  centerRe: bigint;
  centerIm: bigint;
  span: bigint;
  precision: number;
}

export interface FractalPoint {
  re: bigint;
  im: bigint;
  precision: number;
}

export function fixedFromDecimal(value: string, precision: number): bigint {
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(value);
  if (!match) {
    throw new Error('Invalid decimal coordinate');
  }

  const fraction = match[3] ?? '';
  const magnitude = BigInt(match[2] + fraction);
  const exponent = Number(match[4] ?? 0) - fraction.length;
  const scaled =
    exponent >= 0
      ? (magnitude * 10n ** BigInt(exponent)) << BigInt(precision)
      : (magnitude << BigInt(precision)) / 10n ** BigInt(-exponent);

  return match[1] === '-' ? -scaled : scaled;
}

export function fixedToNumber(value: bigint, precision: number): number {
  const magnitude = value < 0n ? -value : value;
  const shift = Math.max(0, magnitude.toString(2).length - 53);
  let mantissa = magnitude >> BigInt(shift);
  if (shift) {
    const remainder = magnitude - (mantissa << BigInt(shift));
    const half = 1n << BigInt(shift - 1);
    if (remainder > half || (remainder === half && mantissa & 1n)) {
      mantissa++;
    }
  }
  const exponent = shift - precision;
  const result =
    exponent < -1022 ? Number(mantissa) * 2 ** -1022 * 2 ** (exponent + 1022) : Number(mantissa) * 2 ** exponent;

  return value < 0n ? -result : result;
}

/** A bounded mantissa and a separate exponent; neither tiny deltas nor huge BigInts pass through Number. */
export function scaledParts(re: bigint, im: bigint, precision: number): [number, number, number] {
  const largest = [re < 0n ? -re : re, im < 0n ? -im : im].reduce((a, b) => (a > b ? a : b));
  if (!largest) {
    return [0, 0, 0];
  }

  const exponent = largest.toString(2).length - 1 - precision;

  return [
    Math.fround(fixedToNumber(re, precision + exponent)),
    Math.fround(fixedToNumber(im, precision + exponent)),
    exponent,
  ];
}

function fractionOf(value: bigint, numerator: number, denominator: number): bigint {
  return (value * fixedFromDecimal(numerator.toString(), 64)) / fixedFromDecimal(denominator.toString(), 64);
}

export function pointAt(view: FractalView, width: number, height: number, x: number, y: number): FractalPoint {
  const span = view.span << 32n;

  return {
    re: (view.centerRe << 32n) + fractionOf(span, x - width / 2, width),
    im: (view.centerIm << 32n) + fractionOf(span, y - height / 2, width),
    precision: view.precision + 32,
  };
}

/** Map a completed frame onto the current view before converting offsets to Number. */
export function frameProjection(
  frame: FractalView,
  target: FractalView,
  width: number,
  height: number,
): { scale: number; x: number; y: number } {
  const precision = Math.max(frame.precision, target.precision);
  const fromShift = BigInt(precision - frame.precision);
  const toShift = BigInt(precision - target.precision);
  const span = target.span << toShift;
  const ratio = (value: bigint) => fixedToNumber((value << 32n) / span, 32);
  const scale = ratio(frame.span << fromShift);

  return {
    scale,
    x: (width / 2) * (1 - scale) + width * ratio((frame.centerRe << fromShift) - (target.centerRe << toShift)),
    y: (height / 2) * (1 - scale) + width * ratio((frame.centerIm << fromShift) - (target.centerIm << toShift)),
  };
}

const initialView: FractalView = {
  centerRe: -253341688815977032017617203236684111343n,
  centerIm: 39650133304819221107406406983820665750n,
  span: 403087408679549044036132547351661823n,
  precision: 128,
};

export class FractalViewport {
  private view: FractalView;

  constructor(view: FractalView = initialView) {
    this.view = { ...view };
  }

  public reset(): void {
    this.view = { ...initialView };
  }

  public snapshot(): FractalView {
    return { ...this.view };
  }

  public restore(view: FractalView): void {
    this.view = { ...view };
  }

  public transform({ from, to, scale }: CanvasTransform, width: number, height: number): void {
    if (!(width > 0 && height > 0 && scale > 0 && Number.isFinite(scale))) {
      return;
    }

    const { span, precision, centerRe, centerIm } = this.view;
    const requested = (span * fixedFromDecimal(scale.toString(), 64)) >> 64n;
    const maximum = 6n << BigInt(precision); // Width 3 is 1x; minimum zoom is 0.5x.
    const nextSpan = requested > maximum ? maximum : requested;
    if (!nextSpan) {
      return;
    }

    this.view = {
      centerRe:
        centerRe +
        fractionOf(span, from.offsetX - width / 2, width) -
        fractionOf(nextSpan, to.offsetX - width / 2, width),
      centerIm:
        centerIm +
        fractionOf(span, from.offsetY - height / 2, width) -
        fractionOf(nextSpan, to.offsetY - height / 2, width),
      span: nextSpan,
      precision,
    };
    // Keep at least 64 fractional guard bits beyond one screen pixel before the next gesture.
    const required = precision - nextSpan.toString(2).length + Math.ceil(Math.log2(width)) + 64;
    const extra = Math.max(0, Math.ceil(required / 64) * 64 - precision);
    if (extra) {
      this.view = {
        centerRe: this.view.centerRe << BigInt(extra),
        centerIm: this.view.centerIm << BigInt(extra),
        span: nextSpan << BigInt(extra),
        precision: precision + extra,
      };
    }
  }

  public select(start: CanvasCoordinates, stop: CanvasCoordinates, width: number, height: number): void {
    const dx = stop.offsetX - start.offsetX;
    const selectedHeight = ((Math.sign(dx * (stop.offsetY - start.offsetY)) * dx) / width) * height;
    this.transform(
      {
        from: {
          offsetX: Math.min(start.offsetX, stop.offsetX),
          offsetY: Math.min(start.offsetY, start.offsetY + selectedHeight),
        },
        to: { offsetX: 0, offsetY: 0 },
        scale: Math.abs(dx) / width,
      },
      width,
      height,
    );
  }

  public zoomLabel(): string {
    const hundredths = ((3n << BigInt(this.view.precision)) * 100n + this.view.span / 2n) / this.view.span;
    if (hundredths < 1000000n) {
      return (Number(hundredths) / 100).toString();
    }

    const digits = hundredths.toString();

    return `${digits[0]}.${digits.slice(1, 3)}e${digits.length - 3}`;
  }
}
