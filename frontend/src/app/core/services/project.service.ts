import { getApiBaseUrl } from '../config/api.config';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Project, ProjectDetailResponse } from '../models/project.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly API_URL = `${getApiBaseUrl()}/projects`;

  // State Signals
  public readonly projects = signal<Project[]>([]);
  public readonly loading = signal<boolean>(false);
  public readonly activeProject = signal<Project | null>(null);

  public loadProjects(filters?: { search?: string; status?: string; orgId?: string }): Observable<{ success: boolean; projects: Project[] }> {
    this.loading.set(true);
    let params = new HttpParams();

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.orgId) params = params.set('orgId', filters.orgId);

    return this.http.get<{ success: boolean; projects: Project[] }>(this.API_URL, { params }).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.projects.set(res.projects);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  public getProject(id: string): Observable<ProjectDetailResponse> {
    this.loading.set(true);
    return this.http.get<ProjectDetailResponse>(`${this.API_URL}/${id}`).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.activeProject.set(res.project);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  public createProject(payload: Partial<Project>): Observable<{ success: boolean; project: Project }> {
    return this.http.post<{ success: boolean; project: Project }>(this.API_URL, payload).pipe(
      tap(res => {
        if (res.success && res.project) {
          this.projects.update(list => [res.project, ...list]);
          this.toast.success(`Project "${res.project.name}" created successfully.`);
        }
      })
    );
  }

  public updateProject(id: string, payload: Partial<Project>): Observable<{ success: boolean; project: Project }> {
    return this.http.put<{ success: boolean; project: Project }>(`${this.API_URL}/${id}`, payload).pipe(
      tap(res => {
        if (res.success && res.project) {
          this.projects.update(list => list.map(p => (p.id === id ? { ...p, ...res.project } : p)));
          if (this.activeProject()?.id === id) {
            this.activeProject.set(res.project);
          }
          this.toast.success('Project updated.');
        }
      })
    );
  }

  public deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this.projects.update(list => list.filter(p => p.id !== id));
        this.toast.info('Project deleted.');
      })
    );
  }
}
