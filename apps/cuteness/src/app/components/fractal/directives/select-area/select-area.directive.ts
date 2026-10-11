import { AfterViewInit, Directive, ElementRef, HostListener, output, inject } from '@angular/core';
import { CanvasCoordinates, CanvasTransform, getCanvasCoordinates } from '../../canvas-coordinates';

@Directive({
  selector: '[cutenessSelectArea]',
})
export class SelectAreaDirective implements AfterViewInit {
  private readonly elementElementRef = inject<ElementRef<HTMLCanvasElement>>(ElementRef);

  private startEvent: MouseEvent | null = null;
  private touchState?: { center: CanvasCoordinates; distance: number; count: number };
  private tapStart?: { x: number; y: number; time: number };
  private lastTap?: { x: number; y: number; time: number };
  private controlContext: CanvasRenderingContext2D | null = null;
  private controlCanvasElement!: HTMLCanvasElement;

  public setDefault = output<void>();
  public transformCoordinates = output<CanvasTransform>();
  public selectCoordinates = output<{
    startEvent: MouseEvent | TouchEvent;
    stopEvent: MouseEvent | TouchEvent;
  }>();

  public ngAfterViewInit(): void {
    this.controlCanvasElement = this.elementElementRef.nativeElement;
    this.controlContext = this.controlCanvasElement.getContext('2d');
  }

  @HostListener('mousedown', ['$event'])
  protected start(event: MouseEvent) {
    if (event.button === 0) {
      this.startEvent = event;
    }
  }

  @HostListener('mousemove', ['$event'])
  protected move(event: MouseEvent) {
    if (this.startEvent) {
      this.controlContext?.clearRect(0, 0, this.controlCanvasElement.width, this.controlCanvasElement.height);

      const start = getCanvasCoordinates(this.startEvent, this.controlCanvasElement);
      const current = getCanvasCoordinates(event, this.controlCanvasElement);
      if (!start || !current) {
        return;
      }

      const { offsetX, offsetY } = start;
      const width = current.offsetX - offsetX;
      const height =
        ((Math.sign(width * (current.offsetY - offsetY)) * width) / this.controlCanvasElement.width) *
        this.controlCanvasElement.height;
      this.controlContext?.strokeRect(offsetX, offsetY, width, height);
    }
  }

  @HostListener('mouseup', ['$event'])
  protected stop(event: MouseEvent) {
    if (this.startEvent && event.clientX !== this.startEvent.clientX) {
      this.selectCoordinates.emit({
        startEvent: this.startEvent,
        stopEvent: event,
      });
    }

    this.controlContext?.clearRect(0, 0, this.controlCanvasElement.width, this.controlCanvasElement.height);
    this.startEvent = null;
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('touchend', ['$event'])
  protected touchChange(event: TouchEvent) {
    event.preventDefault();
    this.startEvent = null;
    this.touchState = this.readTouches(event);
    if (event.type === 'touchstart') {
      this.tapStart =
        this.touchState?.count === 1
          ? { x: this.touchState.center.offsetX, y: this.touchState.center.offsetY, time: performance.now() }
          : undefined;
      if (!this.tapStart) {
        this.lastTap = undefined;
      }
    } else {
      if (!event.touches.length && this.tapStart) {
        const now = performance.now();
        const tap = this.tapStart;
        if (now - tap.time <= 300) {
          if (
            this.lastTap &&
            now - this.lastTap.time <= 300 &&
            Math.hypot(tap.x - this.lastTap.x, tap.y - this.lastTap.y) <= 24
          ) {
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
    if (
      this.tapStart &&
      (!current || Math.hypot(current.center.offsetX - this.tapStart.x, current.center.offsetY - this.tapStart.y) > 10)
    ) {
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
  protected touchCancel() {
    this.touchState = undefined;
    this.startEvent = null;
    this.tapStart = undefined;
    this.lastTap = undefined;
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

  @HostListener('contextmenu', ['$event'])
  @HostListener('dblclick', ['$event'])
  protected reset(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.touchCancel();
    this.controlContext?.clearRect(0, 0, this.controlCanvasElement.width, this.controlCanvasElement.height);
    this.setDefault.emit();
    // if (!this.lock) {
    //   this.setBound();
    //   this.render();
    // }
  }
}
