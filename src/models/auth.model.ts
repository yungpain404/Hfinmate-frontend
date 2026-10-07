export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  preferredCurrency: string;
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface GoogleLoginPayload {
  email?: string;
  name?: string;
  avatarUrl?: string;
  idToken?: string;
}
