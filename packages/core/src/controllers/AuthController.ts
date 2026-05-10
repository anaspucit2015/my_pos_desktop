import { ok, err, type Result } from '@my-pos/shared';
import type { IUser, CreateUserDTO, UpdateUserDTO } from '@my-pos/shared';
import type { UserRepository } from '@my-pos/database';
import { AuthService } from '../services/AuthService.js';

/**
 * Controller for authentication and session management.
 * Session is held in memory — appropriate for a single-process Electron app.
 */
export class AuthController {
  private readonly authService = new AuthService();
  private currentUser: IUser | null = null;

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Authenticates a user by username and PIN.
   * Sets the in-memory session on success.
   *
   * @param username - The user's username.
   * @param pin - The plain-text PIN entered by the user.
   */
  async loginWithPin(username: string, pin: string): Promise<Result<IUser, Error>> {
    if (!username.trim()) return err(new Error('Username is required'));

    const pinValidation = this.authService.validatePinFormat(pin);
    if (!pinValidation.success) return pinValidation;

    const hashResult = await this.userRepository.getPinHash(username);
    if (!hashResult.success) return hashResult;
    if (!hashResult.data) return err(new Error('Invalid username or PIN'));

    const verifyResult = await this.authService.verifyPin(pin, hashResult.data);
    if (!verifyResult.success) return verifyResult;
    if (!verifyResult.data) return err(new Error('Invalid username or PIN'));

    const userResult = await this.userRepository.findByUsername(username);
    if (!userResult.success) return userResult;
    if (!userResult.data) return err(new Error('User not found'));
    if (!userResult.data.isActive) return err(new Error('This account is inactive'));

    this.currentUser = userResult.data;
    return ok(userResult.data);
  }

  /**
   * Returns the currently authenticated user, or null if no session exists.
   */
  getCurrentUser(): IUser | null {
    return this.currentUser;
  }

  /**
   * Clears the current session.
   */
  logout(): void {
    this.currentUser = null;
  }

  /**
   * Returns all users in the system.
   * Intended for admin use only — enforce role checks in the IPC layer.
   */
  async getUsers(): Promise<Result<IUser[], Error>> {
    return this.userRepository.getAll();
  }

  /**
   * Updates an existing user's details or active status.
   * If a new PIN is provided it is hashed before storing.
   * Intended for admin use only — enforce role checks in the IPC layer.
   */
  async updateUser(id: number, dto: UpdateUserDTO): Promise<Result<IUser, Error>> {
    let pinHash: string | undefined;
    if (dto.pin) {
      const hashResult = await this.authService.hashPin(dto.pin);
      if (!hashResult.success) return hashResult;
      pinHash = hashResult.data;
    }
    return this.userRepository.update(id, dto, pinHash);
  }

  /**
   * Creates a new user. Hashes the PIN before storing.
   * Intended for use by admin users only — enforce role checks in the IPC layer.
   */
  async createUser(dto: CreateUserDTO): Promise<Result<IUser, Error>> {
    const existingResult = await this.userRepository.findByUsername(dto.username);
    if (!existingResult.success) return existingResult;
    if (existingResult.data) {
      return err(new Error(`Username "${dto.username}" is already taken`));
    }

    const hashResult = await this.authService.hashPin(dto.pin);
    if (!hashResult.success) return hashResult;

    return this.userRepository.create(dto, hashResult.data);
  }
}
