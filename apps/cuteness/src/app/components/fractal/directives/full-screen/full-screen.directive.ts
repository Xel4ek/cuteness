import {AfterViewInit, Directive, ElementRef} from '@angular/core';

@Directive({
  selector: '[cutenessFullScreen]',
  standalone: true
})
export class FullScreenDirective implements AfterViewInit {

  constructor(
    private readonly elementRef: ElementRef,
  ) { }

  public ngAfterViewInit(): void {
    this.elementRef.nativeElement.width = this.elementRef.nativeElement.parentElement.offsetWidth;
    this.elementRef.nativeElement.height = this.elementRef.nativeElement.parentElement.offsetHeight;
  }
}
