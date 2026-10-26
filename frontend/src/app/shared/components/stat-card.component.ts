import { IconComponent } from './icon.component';
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card" [ngClass]="themeClass()">
      <div class="stat-header">
        <span class="stat-title">{{ title() }}</span>
        <div class="stat-icon-wrapper">
          <app-icon [name]="icon()" [size]="20" />
        </div>
      </div>
      <div class="stat-body">
        <div class="stat-value">{{ value() }}</div>
        @if (subtitle()) {
          <div class="stat-subtitle">
            @if (trend()) {
              <span class="stat-trend" [ngClass]="trendClass()">{{ trend() }}</span>
            }
            <span>{{ subtitle() }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.35rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
      opacity: 0;
      transition: opacity 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
      border-color: var(--border-hover);
    }

    .stat-card:hover::after {
      opacity: 1;
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-title {
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-icon-wrapper {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--bg-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
    }

    .stat-value {
      font-size: 2.1rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      line-height: 1.1;
    }

    .stat-subtitle {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin-top: 0.35rem;
    }

    .stat-trend {
      font-weight: 600;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .trend-up { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .trend-down { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
  `]
})
export class StatCardComponent {
  title = input.required<string>();
  value = input.required<string | number>();
  icon = input<string>('analytics');
  subtitle = input<string>('');
  trend = input<string>('');
  trendDirection = input<'up' | 'down' | 'neutral'>('neutral');
  themeClass = input<string>('');

  // Angular 19 computed signal
  public readonly trendClass = computed(() => {
    const dir = this.trendDirection();
    return dir === 'up' ? 'trend-up' : dir === 'down' ? 'trend-down' : '';
  });
}
