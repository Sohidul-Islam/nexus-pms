import { Pipe, PipeTransform } from '@angular/core';

/**
 * Custom Pure Pipe formatting UTC dates or ISO strings into human-friendly relative time.
 * Demonstrates Pure Pipes performance advantage (memoization by reference).
 */
@Pipe({
  name: 'timeAgo',
  pure: true,
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value?: string | Date | null): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (elapsedSeconds < 30) return 'Just now';
    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays === 1) return 'Yesterday';
    if (elapsedDays < 30) return `${elapsedDays}d ago`;

    const elapsedMonths = Math.floor(elapsedDays / 30);
    if (elapsedMonths < 12) return `${elapsedMonths}mo ago`;

    return date.toLocaleDateString();
  }
}
