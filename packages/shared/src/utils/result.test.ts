import { ok, err, isOk, isErr, unwrap, type Result } from './result.js';

describe('ok', () => {
  it('creates a successful result', () => {
    const result = ok(42);
    expect(result.success).toBe(true);
    expect(result.data).toBe(42);
  });
});

describe('err', () => {
  it('creates a failed result', () => {
    const result = err(new Error('oops'));
    expect(result.success).toBe(false);
    expect(result.error.message).toBe('oops');
  });
});

describe('isOk / isErr', () => {
  it('isOk returns true for Ok', () => {
    expect(isOk(ok('value'))).toBe(true);
  });

  it('isOk returns false for Err', () => {
    expect(isOk(err('fail'))).toBe(false);
  });

  it('isErr returns true for Err', () => {
    expect(isErr(err('fail'))).toBe(true);
  });

  it('isErr returns false for Ok', () => {
    expect(isErr(ok('value'))).toBe(false);
  });
});

describe('unwrap', () => {
  it('returns data for a successful result', () => {
    expect(unwrap(ok('hello'))).toBe('hello');
  });

  it('throws for a failed result', () => {
    expect(() => unwrap(err(new Error('bad')))).toThrow('bad');
  });
});

describe('Result type narrowing', () => {
  it('narrows type correctly via success flag', () => {
    const result: Result<number, string> = ok(5);
    if (result.success) {
      expect(result.data).toBe(5);
    } else {
      fail('Should not reach Err branch');
    }
  });
});
