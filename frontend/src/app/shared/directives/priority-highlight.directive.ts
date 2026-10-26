import { Directive, Input, ElementRef, Renderer2, OnChanges, inject } from '@angular/core';
import { PriorityLevel } from '../../core/models/project.model';

/**
 * Attribute Directive demonstrating OnChanges lifecycle hook and class manipulation.
 * Applies visual indicator styling based on task/project priority levels.
 */
@Directive({
  selector: '[appPriorityHighlight]',
  standalone: true
})
export class PriorityHighlightDirective implements OnChanges {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @Input('appPriorityHighlight') priority?: PriorityLevel | string;

  ngOnChanges(): void {
    const native = this.el.nativeElement;
    // Remove previous priority classes
    this.renderer.removeClass(native, 'priority-border-urgent');
    this.renderer.removeClass(native, 'priority-border-high');
    this.renderer.removeClass(native, 'priority-border-medium');
    this.renderer.removeClass(native, 'priority-border-low');

    if (!this.priority) return;

    switch (this.priority.toUpperCase()) {
      case 'URGENT':
        this.renderer.addClass(native, 'priority-border-urgent');
        break;
      case 'HIGH':
        this.renderer.addClass(native, 'priority-border-high');
        break;
      case 'MEDIUM':
        this.renderer.addClass(native, 'priority-border-medium');
        break;
      case 'LOW':
        this.renderer.addClass(native, 'priority-border-low');
        break;
    }
  }
}
