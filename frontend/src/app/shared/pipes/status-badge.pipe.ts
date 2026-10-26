import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusBadge',
  pure: true,
  standalone: true
})
export class StatusBadgePipe implements PipeTransform {
  transform(status?: string): { label: string; cssClass: string } {
    if (!status) return { label: 'Unknown', cssClass: 'status-default' };

    switch (status.toUpperCase()) {
      case 'TODO':
        return { label: 'To Do', cssClass: 'status-todo' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', cssClass: 'status-in-progress' };
      case 'REVIEW':
        return { label: 'In Review', cssClass: 'status-review' };
      case 'DONE':
        return { label: 'Completed', cssClass: 'status-done' };
      case 'ACTIVE':
        return { label: 'Active', cssClass: 'status-active' };
      case 'PLANNING':
        return { label: 'Planning', cssClass: 'status-planning' };
      case 'ON_HOLD':
        return { label: 'On Hold', cssClass: 'status-on-hold' };
      case 'COMPLETED':
        return { label: 'Completed', cssClass: 'status-completed' };
      default:
        return { label: status, cssClass: 'status-default' };
    }
  }
}
