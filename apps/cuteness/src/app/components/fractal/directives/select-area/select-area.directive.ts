import { AfterViewInit, Directive, ElementRef, HostListener, output, inject } from '@angular/core';
import { getCanvasCoordinates } from '../../canvas-coordinates';

@Directive({
  selector: '[cutenessSelectArea]',
})
export class SelectAreaDirective implements AfterViewInit {
  private readonly elementElementRef = inject<ElementRef<HTMLCanvasElement>>(ElementRef);

  private startEvent: MouseEvent | TouchEvent | null = null;
  private controlContext: CanvasRenderingContext2D | null = null;
  private controlCanvasElement!: HTMLCanvasElement;

  public setDefault = output<void>();
  public selectCoordinates = output<{
    startEvent: MouseEvent | TouchEvent;
    stopEvent: MouseEvent | TouchEvent;
  }>();

  public ngAfterViewInit(): void {
    this.controlCanvasElement = this.elementElementRef.nativeElement;
    this.controlContext = this.controlCanvasElement.getContext('2d');
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('mousedown', ['$event'])
  protected start(event: MouseEvent | TouchEvent) {
    if ('button' in event ? event.button === 0 : event.touches.length === 1) {
      this.startEvent = event;
    }
  }

  @HostListener('touchmove', ['$event'])
  @HostListener('mousemove', ['$event'])
  protected move(event: MouseEvent | TouchEvent) {
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

  @HostListener('touchend', ['$event'])
  @HostListener('mouseup', ['$event'])
  protected stop(event: MouseEvent | TouchEvent) {
    if (this.startEvent) {
      this.selectCoordinates.emit({
        startEvent: this.startEvent,
        stopEvent: event,
      });
    }

    this.controlContext?.clearRect(0, 0, this.controlCanvasElement.width, this.controlCanvasElement.height);
    this.startEvent = null;
  }

  @HostListener('contextmenu', ['$event'])
  protected reset(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.setDefault.emit();
    // if (!this.lock) {
    //   this.setBound();
    //   this.render();
    // }
  }
}
