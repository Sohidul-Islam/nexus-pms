import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'nexus_theme_preference';
  
  // Modern Angular Signal for reactive theme state
  public readonly theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Angular effect that automatically synchronizes DOM classes when theme signal changes
    effect(() => {
      const current = this.theme();
      localStorage.setItem(this.STORAGE_KEY, current);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', current);
        if (current === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  public toggleTheme(): void {
    this.theme.update(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  public setTheme(newTheme: Theme): void {
    this.theme.set(newTheme);
  }

  private getInitialTheme(): Theme {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // High-end dark theme default
  }
}
