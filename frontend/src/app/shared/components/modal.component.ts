import { IconComponent } from './icon.component';
import { Component, input, output, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-dialog" [style.max-width]="maxWidth()" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3 class="modal-title">{{ title() }}</h3>
            <button class="modal-close" (click)="close.emit()" aria-label="Close modal"><app-icon name="close" [size]="15" /></button>
          </div>
          <div class="modal-body">
            <ng-content select="[body]"></ng-content>
            <ng-content></ng-content>
          </div>
          <div class="modal-footer">
            <ng-content select="[footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1.25rem;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-dialog {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      width: 100%;
      max-height: calc(100vh - 2.5rem);
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }

    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      padding: 1.25rem 1.75rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .modal-close {
      background: var(--bg-hover);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.15s;
    }

    .modal-close:hover {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
    }

    .modal-body {
      padding: 1.75rem;
      flex: 1;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 1.25rem 1.75rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background: var(--bg-surface);
      border-bottom-left-radius: 20px;
      border-bottom-right-radius: 20px;
    }
  `]
})
export class ModalComponent {
  isOpen = input.required<boolean>();
  title = input<string>('Modal');
  maxWidth = input<string>('600px');

  close = output<void>();

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
