import { AfterViewInit, Directive, ElementRef, HostListener, inject, output } from '@angular/core';

import { CanvasCoordinates, CanvasTransform } from '../../canvas-coordinates';

@Directive({
  selector: '[cutenessSelectArea]',
  host: {
    '[class.panning]': 'mouseGesture && !mouseGesture.select',
    '[class.selecting]': 'mouseGesture?.select',
  },
})
export class SelectAreaDirective implements AfterViewInit {
  private readonly elementElementRef = inject<ElementRef<HTMLCanvasElement>>(ElementRef);

  protected mouseGesture?: { start: CanvasCoordinates; last: CanvasCoordinates; select: boolean };
  private touchState?: { center: CanvasCoordinates; distance: number; count: number };
  private tapStart?: { x: number; y: number; time: number };
  private lastTap?: { x: number; y: number; time: number };
  private controlContext: CanvasRenderingContext2D | null = null;
  private controlCanvasElement!: HTMLCanvasElement;

  public setDefault = output<void>();
  public transformCoordinates = output<CanvasTransform>();
  public selectCoordinates = output<{
    startEvent: CanvasCoordinates;
    stopEvent: CanvasCoordinates;
  }>();

  public ngAfterViewInit(): void {
    this.controlCanvasElement = this.elementElementRef.nativeElement;
    this.controlContext = this.controlCanvasElement.getContext('2d');
  }

  @HostListener('mousedown', ['$event'])
  protected start(event: MouseEvent) {
    if (event.button === 0 || event.button === 1) {
      event.preventDefault();
      const position = this.mouseCoordinates(event);
      this.mouseGesture = { start: position, last: position, select: event.button === 0 && event.shiftKey };
    }
  }

  @HostListener('document:mousemove', ['$event'])
  protected move(event: MouseEvent) {
    const gesture = this.mouseGesture;

    if (!gesture) {
      return;
    }

    const current = this.mouseCoordinates(event);

    if (gesture.select) {
      this.controlContext?.clearRect(0, 0, this.controlCanvasElement.width, this.controlCanvasElement.height);
      const { offsetX, offsetY } = gesture.start;
      const width = current.offsetX - offsetX;
      const height = ((Math.sign(width * (current.offsetY - offsetY)) * width) / this.controlCanvasElement.width) * this.controlCanvasElement.height;
      this.controlContext?.strokeRect(offsetX, offsetY, width, height);
    } else {
      this.transformCoordinates.emit({ from: gesture.last, to: current, scale: 1 });
    }

    gesture.last = current;
  }

  @HostListener('document:mouseup', ['$event'])
  protected stop(event: MouseEvent) {
    const gesture = this.mouseGesture;

    if (!gesture) {
      return;
    }

    const current = this.mouseCoordinates(event);

    if (gesture.select && current.offsetX !== gesture.start.offsetX) {
      this.selectCoordinates.emit({
        startEvent: gesture.start,
        stopEvent: current,
      });
    }

    this.controlContext?.clearRect(0, 0, this.controlCanvasElement.width, this.controlCanvasElement.height);
    this.mouseGesture = undefined;
  }

  @HostListener('wheel', ['$event'])
  protected zoom(event: WheelEvent) {
    if (!event.deltaY) {
      return;
    }

    event.preventDefault();
    const { height } = this.controlCanvasElement.getBoundingClientRect();
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? height : 1;
    const delta = Math.max(-500, Math.min(500, event.deltaY * unit));
    const point = this.mouseCoordinates(event);
    this.transformCoordinates.emit({ from: point, to: point, scale: Math.exp(delta * 0.002) });
  }

  private mouseCoordinates(event: MouseEvent): CanvasCoordinates {
    const { left, top } = this.controlCanvasElement.getBoundingClientRect();

    return { offsetX: event.clientX - left, offsetY: event.clientY - top };
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('touchend', ['$event'])
  protected touchChange(event: TouchEvent) {
    event.preventDefault();
    this.mouseGesture = undefined;
    this.touchState = this.readTouches(event);

    if (event.type === 'touchstart') {
      this.tapStart = this.touchState?.count === 1 ? { x: this.touchState.center.offsetX, y: this.touchState.center.offsetY, time: performance.now() } : undefined;

      if (!this.tapStart) {
        this.lastTap = undefined;
      }
    } else {
      if (!event.touches.length && this.tapStart) {
        const now = performance.now();
        const tap = this.tapStart;

        if (now - tap.time <= 300) {
          if (this.lastTap && now - this.lastTap.time <= 300 && Math.hypot(tap.x - this.lastTap.x, tap.y - this.lastTap.y) <= 24) {
            this.reset(event);
          } else {
            this.lastTap = { ...tap, time: now };
          }
        } else {
          this.lastTap = undefined;
        }
      }

      this.tapStart = undefined;
    }

    this.controlContext?.clearRect(0, 0, this.controlCanvasElement.width, this.controlCanvasElement.height);
  }

  @HostListener('touchmove', ['$event'])
  protected touchMove(event: TouchEvent) {
    event.preventDefault();
    const previous = this.touchState;
    const current = this.readTouches(event);
    this.touchState = current;

    if (this.tapStart && (!current || Math.hypot(current.center.offsetX - this.tapStart.x, current.center.offsetY - this.tapStart.y) > 10)) {
      this.tapStart = undefined;
      this.lastTap = undefined;
    }

    if (!previous || !current || previous.count !== current.count) {
      return;
    }

    if (current.count === 2 && (previous.distance === 0 || current.distance === 0)) {
      return;
    }

    this.transformCoordinates.emit({
      from: previous.center,
      to: current.center,
      scale: current.count === 2 ? previous.distance / current.distance : 1,
    });
  }

  @HostListener('touchcancel')
  @HostListener('window:blur')
  protected touchCancel() {
    this.touchState = undefined;
    this.mouseGesture = undefined;
    this.tapStart = undefined;
    this.lastTap = undefined;
    this.controlContext?.clearRect(0, 0, this.controlCanvasElement.width, this.controlCanvasElement.height);
  }

  private readTouches(event: TouchEvent) {
    if (event.touches.length < 1 || event.touches.length > 2) {
      return undefined;
    }

    const first = event.touches[0];
    const second = event.touches[1] ?? first;
    const { left, top } = this.controlCanvasElement.getBoundingClientRect();

    return {
      center: {
        offsetX: (first.clientX + second.clientX) / 2 - left,
        offsetY: (first.clientY + second.clientY) / 2 - top,
      },
      distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY),
      count: event.touches.length,
    };
  }

  @HostListener('dblclick', ['$event'])
  protected reset(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.touchCancel();
    this.controlContext?.clearRect(0, 0, this.controlCanvasElement.width, this.controlCanvasElement.height);
    this.setDefault.emit();
  }
}
