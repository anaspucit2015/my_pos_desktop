/**
 * Roles available in the POS system.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
}

/**
 * Represents an authenticated system user.
 */
export interface IUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new user.
 */
export interface CreateUserDTO {
  username: string;
  pin: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/**
 * Data for updating an existing user. All fields optional.
 */
export interface UpdateUserDTO {
  username?: string;
  pin?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}
