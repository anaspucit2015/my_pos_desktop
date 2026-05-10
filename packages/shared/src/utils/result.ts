/**
 * Represents a successful result containing a value.
 */
export interface Ok<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Represents a failed result containing an error.
 */
export interface Err<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * A discriminated union for error handling without exceptions.
 * Use `result.success` to narrow the type.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Wraps a value in a successful Result.
 * @param data - The value to wrap.
 */
export function ok<T>(data: T): Ok<T> {
  return { success: true, data };
}

/**
 * Wraps an error in a failed Result.
 * @param error - The error to wrap.
 */
export function err<E>(error: E): Err<E> {
  return { success: false, error };
}

/**
 * Checks whether a Result is successful.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success === true;
}

/**
 * Checks whether a Result is a failure.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.success === false;
}

/**
 * Unwraps the data from a Result, throwing if it is an error.
 * Only use in contexts where failure is truly unexpected.
 * @param result - The Result to unwrap.
 * @throws The contained error if the Result is Err.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}
