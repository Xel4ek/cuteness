import { AfterViewInit, Directive, ElementRef, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: '[cutenessFullScreen]',
  standalone: true
})
export class FullScreenDirective implements AfterViewInit {

  constructor(
    private readonly elementRef: ElementRef,
    @Inject(DOCUMENT)
    private readonly document: Document
  ) { }

  public ngAfterViewInit(): void {
    this.elementRef.nativeElement.width = this.document.body.clientWidth;
    this.elementRef.nativeElement.height = this.document.body.clientHeight - 64;
  }
}
