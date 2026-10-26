export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  department?: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  organization?: any;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  department?: string;
}
