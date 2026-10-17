export interface CanvasCoordinates {
  offsetX: number;
  offsetY: number;
}

export interface CanvasTransform {
  from: CanvasCoordinates;
  to: CanvasCoordinates;
  scale: number;
}

type CanvasInputEvent =
  | CanvasCoordinates
  | {
      touches: ArrayLike<{ clientX: number; clientY: number }>;
      changedTouches: ArrayLike<{ clientX: number; clientY: number }>;
    };

export function getCanvasCoordinates(
  event: CanvasInputEvent,
  canvas: { getBoundingClientRect(): { left: number; top: number } },
): CanvasCoordinates | null {
  if ('offsetX' in event) {
    return { offsetX: event.offsetX, offsetY: event.offsetY };
  }

  const touch = event.touches[0] ?? event.changedTouches[0];
  if (!touch) {
    return null;
  }

  const { left, top } = canvas.getBoundingClientRect();

  return { offsetX: touch.clientX - left, offsetY: touch.clientY - top };
}
