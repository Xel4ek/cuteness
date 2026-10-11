import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: '[cutenessFullScreen]',
  standalone: true,
})
export class FullScreenDirective implements AfterViewInit {
  private readonly elementRef = inject(ElementRef);
  private readonly document = inject<Document>(DOCUMENT);

  public ngAfterViewInit(): void {
    const height = Math.trunc(this.document.body.clientHeight);
    this.elementRef.nativeElement.width = this.document.body.clientWidth;
    this.elementRef.nativeElement.height = height - ((height % 2) + 1) - 64;
  }
}
