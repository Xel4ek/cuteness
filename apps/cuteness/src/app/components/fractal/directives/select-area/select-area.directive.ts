import { AfterViewInit, Directive, ElementRef, HostListener, output } from '@angular/core';

@Directive({
  selector: '[cutenessSelectArea]',
})
export class SelectAreaDirective implements AfterViewInit {
  private startEvent: MouseEvent | null = null;
  private controlContext: CanvasRenderingContext2D | null = null;
  private controlCanvasElement!: HTMLCanvasElement;

  public setDefault = output<void>();
  public selectCoordinates = output<{
    startEvent: MouseEvent;
    stopEvent: MouseEvent;
  }>()

  constructor(
    private readonly elementElementRef: ElementRef<HTMLCanvasElement>
  ) {}

  public ngAfterViewInit(): void {
    this.controlCanvasElement = this.elementElementRef.nativeElement;
    this.controlContext = this.controlCanvasElement.getContext('2d');
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('mousedown', ['$event'])
  protected start(event: MouseEvent) {
    if (event.button === 0) {
      this.startEvent = event;
    }
  }

  @HostListener('touchmove', ['$event'])
  @HostListener('mousemove', ['$event'])
  protected move(event: MouseEvent) {
    if (this.startEvent) {
      this.controlContext?.clearRect(
        0,
        0,
        this.controlCanvasElement.width,
        this.controlCanvasElement.height,
      );

      const { offsetX, offsetY } = this.startEvent;

      const width = event.offsetX - offsetX;
      const height =
        ((Math.sign(width * (event.offsetY - offsetY)) * width) / this.controlCanvasElement.width) *
        this.controlCanvasElement.height;
      this.controlContext?.strokeRect(offsetX, offsetY, width, height);
    }
  }

  @HostListener('touchend', ['$event'])
  @HostListener('mouseup', ['$event'])
  protected stop(event: MouseEvent) {
    if (this.startEvent) {
      this.selectCoordinates.emit({
        startEvent: this.startEvent,
        stopEvent: event,
      })

    }

    this.controlContext?.clearRect(
      0,
      0,
      this.controlCanvasElement.width,
      this.controlCanvasElement.height,
    );
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
