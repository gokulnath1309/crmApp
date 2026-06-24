export interface User {
  _id: string;
  clerkId?: string;
  email: string;
  name: string;
  role: string;
  managerId?: string;
  department?: string;
  jobFunction?: string;
  permissions?: string[];
  isActive?: boolean;
  lastLogin?: number;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
  emailVerified?: boolean;
  coverImage?: string;
  workspaceName?: string;
  location?: string;
  timezone?: string;
  bio?: string;
  jobTitle?: string;
  phone?: string;
  workspaceId?: string;
  activeWorkspaceId?: string;
  membershipId?: string;
  isOwner?: boolean;
}

export interface WorkspaceMember {
  _id: string;
  userId: string;
  workspaceId: string;
  role: string;
  permissions?: string[];
  department?: string;
  jobTitle?: string;
  managerId?: string;
  status: string;
  joinedAt: number;
  createdAt: number;
}

export interface WorkspaceInfo {
  _id: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  isActive: boolean;
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
