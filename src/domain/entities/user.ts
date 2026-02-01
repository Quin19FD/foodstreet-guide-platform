/**
 * Domain Entity: User
 *
 * Represents a user in the system.
 * Framework-agnostic, pure TypeScript.
 */

export type UserRole = "user" | "admin" | "vendor";

export interface UserProps {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly phoneNumber?: string;
  readonly avatarUrl?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.role = props.role;
    this.phoneNumber = props.phoneNumber;
    this.avatarUrl = props.avatarUrl;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isAdmin(): boolean {
    return this.role === "admin";
  }

  isVendor(): boolean {
    return this.role === "vendor";
  }
}
