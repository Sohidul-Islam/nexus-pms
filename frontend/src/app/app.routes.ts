import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  // Public Auth Routes
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },

  // Protected Enterprise Workspace Routes
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () => import('./features/projects/project-list.component').then(m => m.ProjectListComponent)
  },
  {
    path: 'projects/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/projects/project-detail.component').then(m => m.ProjectDetailComponent)
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tasks/kanban-board.component').then(m => m.KanbanBoardComponent)
  },
  {
    path: 'organizations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/organizations/organization.component').then(m => m.OrganizationComponent)
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },

  // Default & Catch-all redirects
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
