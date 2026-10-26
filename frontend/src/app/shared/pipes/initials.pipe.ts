import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initials',
  pure: true,
  standalone: true
})
export class InitialsPipe implements PipeTransform {
  transform(name?: string | null): string {
    if (!name) return 'NX';

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
