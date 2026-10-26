import { Directive, Input, ElementRef, HostListener, Renderer2, inject, OnDestroy } from '@angular/core';

/**
 * Attribute Directive demonstrating HostListener, DOM manipulation via Renderer2,
 * and element lifecycle cleanup.
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @Input('appTooltip') tooltipText = '';
  private tooltipEl: HTMLElement | null = null;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.tooltipText) return;
    this.createTooltip();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.removeTooltip();
  }

  private createTooltip(): void {
    this.removeTooltip();

    this.tooltipEl = this.renderer.createElement('div');
    const text = this.renderer.createText(this.tooltipText);
    this.renderer.appendChild(this.tooltipEl, text);

    this.renderer.addClass(this.tooltipEl, 'nexus-custom-tooltip');
    this.renderer.appendChild(document.body, this.tooltipEl);

    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltipEl!.getBoundingClientRect();

    const top = hostPos.top - tooltipPos.height - 8;
    const left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;

    this.renderer.setStyle(this.tooltipEl, 'top', `${Math.max(6, top)}px`);
    this.renderer.setStyle(this.tooltipEl, 'left', `${Math.max(6, left)}px`);
    this.renderer.setStyle(this.tooltipEl, 'position', 'fixed');
    this.renderer.setStyle(this.tooltipEl, 'z-index', '9999');
    this.renderer.setStyle(this.tooltipEl, 'opacity', '1');
  }

  private removeTooltip(): void {
    if (this.tooltipEl) {
      this.renderer.removeChild(document.body, this.tooltipEl);
      this.tooltipEl = null;
    }
  }

  ngOnDestroy(): void {
    this.removeTooltip();
  }
}
