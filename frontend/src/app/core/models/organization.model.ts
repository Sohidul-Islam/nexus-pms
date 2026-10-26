import { UserRole } from './user.model';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  plan?: string;
  created_at?: string;
  my_role?: UserRole;
}

export interface OrganizationMember {
  membership_id: string;
  role: UserRole;
  joined_at: string;
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  department?: string;
}
