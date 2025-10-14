export interface LoginRequest {
  userNameOrEmail: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  data: TokenData;
  errors: string[];
  pagination: any;
  correlationId: string;
  timeStamp: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface User {
  id: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: any;
  correlationId: string;
  timeStamp: string;
}

export interface TokenInfo {
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

// Role ve Permission enum'ları
export enum UserRole {
  Admin = 'Admin',
  User = 'User',
  Manager = 'Manager'
}

export enum Permission {
  Read = 'Read',
  Write = 'Write',
  Delete = 'Delete',
  Manage = 'Manage'
}