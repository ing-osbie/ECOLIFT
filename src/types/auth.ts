export type UserRole = "customer" | "collector" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url?: string | null;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSessionUser {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  role?: UserRole;
}

export interface AuthContextType {
  user: Profile | null;
  loading: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: UserRole,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
