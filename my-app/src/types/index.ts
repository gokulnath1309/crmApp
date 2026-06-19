export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuthResponse {
  userId: string;
  token: string;
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}
