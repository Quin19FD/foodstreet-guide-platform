/**
 * Domain Entity: User
 *
 * Represents a user in the system.
 * Framework-agnostic, pure TypeScript.
 */

export type UserRole = "USER" | "ADMIN" | "VENDOR";

export interface UserProps {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  refreshTokenHash?: string;
  refreshTokenExpiry?: Date;
  resetPasswordTokenHash?: string;
  resetPasswordTokenExpiry?: Date;
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly role: UserRole;
  readonly phoneNumber?: string;
  readonly avatarUrl?: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLogin?: Date;
  readonly refreshTokenHash?: string;
  readonly refreshTokenExpiry?: Date;
  readonly resetPasswordTokenHash?: string;
  readonly resetPasswordTokenExpiry?: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.role = props.role;
    this.phoneNumber = props.phoneNumber;
    this.avatarUrl = props.avatarUrl;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.lastLogin = props.lastLogin;
    this.refreshTokenHash = props.refreshTokenHash;
    this.refreshTokenExpiry = props.refreshTokenExpiry;
    this.resetPasswordTokenHash = props.resetPasswordTokenHash;
    this.resetPasswordTokenExpiry = props.resetPasswordTokenExpiry;
  }

  isAdmin(): boolean {
    return this.role === "ADMIN";
  }

  isVendor(): boolean {
    return this.role === "VENDOR";
  }

  isUserActive(): boolean {
    return this.isActive;
  }
}
