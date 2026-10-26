import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

/**
 * Structural Directive demonstrating Angular ViewContainerRef & Signals reactivity.
 * Conditionally renders template content only if the authenticated user possesses one of the allowed roles.
 *
 * Example:
 * <button *appHasRole="['ADMIN', 'PROJECT_MANAGER']" (click)="deleteProject()">Delete</button>
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private allowedRoles: string[] = [];
  private isVisible = false;

  constructor() {
    // Automatically re-evaluate whenever user role signal updates
    effect(() => {
      this.updateView();
    });
  }

  @Input()
  set appHasRole(roles: string[] | string) {
    this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  private updateView(): void {
    const userRole = this.authService.userRole();
    const hasPermission = !!userRole && (this.allowedRoles.length === 0 || this.allowedRoles.includes(userRole));

    if (hasPermission && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasPermission && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}
