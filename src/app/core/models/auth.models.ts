export interface LoginRequest {
  userName: string;  // API'nizde userName kullanılıyor
  password: string;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    expiresAt: string;
    refreshToken: string;
  };
  errors: any;
  pagination: any;
  correlationId: string;
  timeStamp: string;
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
  errors?: any;
  pagination?: any;
  correlationId: string;
  timeStamp: string;
}

export interface TokenInfo {
  token: string;
  refreshToken: string;
  expiresAt: Date;
}