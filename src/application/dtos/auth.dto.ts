/**
 * DTOs (Data Transfer Objects) for Authentication
 */

export interface LoginRequestDTO {
  email: string;
  password: string;
  /**
   * Nếu true: lưu refresh token cookie dạng persistent (đóng/mở trình duyệt vẫn còn).
   * Nếu false/undefined: refresh cookie dạng session (đóng trình duyệt sẽ mất).
   */
  rememberMe?: boolean;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface AuthResponseDTO {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phoneNumber?: string;
    avatarUrl?: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export interface ResetPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordConfirmDTO {
  token: string;
  newPassword: string;
}
