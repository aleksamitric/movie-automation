export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface LoginErrorResponse {
  message: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
}
