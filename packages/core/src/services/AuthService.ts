import bcrypt from 'bcryptjs';
import { ok, err, type Result, MIN_PIN_LENGTH, MAX_PIN_LENGTH } from '@my-pos/shared';

const BCRYPT_ROUNDS = 10;

/**
 * Stateless service for PIN hashing and verification.
 * All user-facing PIN operations must go through this service.
 */
export class AuthService {
  /**
   * Hashes a plain-text PIN using bcrypt.
   *
   * @param pin - The raw PIN string from the user.
   * @returns The bcrypt hash to store in the database.
   */
  async hashPin(pin: string): Promise<Result<string, Error>> {
    const validation = this.validatePinFormat(pin);
    if (!validation.success) return validation;

    const hash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
    return ok(hash);
  }

  /**
   * Verifies a plain-text PIN against a stored bcrypt hash.
   *
   * @param pin - The raw PIN the user entered.
   * @param hash - The stored bcrypt hash.
   * @returns true if the PIN matches, false otherwise.
   */
  async verifyPin(pin: string, hash: string): Promise<Result<boolean, Error>> {
    try {
      const matches = await bcrypt.compare(pin, hash);
      return ok(matches);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Validates that a PIN meets the format requirements.
   * PINs must be numeric strings between MIN_PIN_LENGTH and MAX_PIN_LENGTH digits.
   */
  validatePinFormat(pin: string): Result<void, Error> {
    if (!/^\d+$/.test(pin)) {
      return err(new Error('PIN must contain only digits'));
    }
    if (pin.length < MIN_PIN_LENGTH || pin.length > MAX_PIN_LENGTH) {
      return err(
        new Error(`PIN must be between ${MIN_PIN_LENGTH} and ${MAX_PIN_LENGTH} digits`),
      );
    }
    return ok(undefined);
  }
}
