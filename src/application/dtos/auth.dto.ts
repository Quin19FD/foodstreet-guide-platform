/**
 * DTOs (Data Transfer Objects) for Authentication
 */

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

export interface AuthResponseDTO {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}
