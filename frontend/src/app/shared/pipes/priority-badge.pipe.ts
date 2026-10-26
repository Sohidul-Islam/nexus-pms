import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'priorityBadge',
  pure: true,
  standalone: true
})
export class PriorityBadgePipe implements PipeTransform {
  transform(priority?: string): { label: string; cssClass: string; icon: string } {
    if (!priority) return { label: 'Medium', cssClass: 'badge-medium', icon: '?' };

    switch (priority.toUpperCase()) {
      case 'URGENT':
        return { label: 'Urgent', cssClass: 'badge-urgent', icon: '?' };
      case 'HIGH':
        return { label: 'High', cssClass: 'badge-high', icon: '?' };
      case 'MEDIUM':
        return { label: 'Medium', cssClass: 'badge-medium', icon: '?' };
      case 'LOW':
        return { label: 'Low', cssClass: 'badge-low', icon: '?' };
      default:
        return { label: priority, cssClass: 'badge-default', icon: '?' };
    }
  }
}
