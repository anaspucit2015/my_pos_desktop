import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Full-screen login page. Accepts username + numeric PIN.
 * Redirects to /pos on successful authentication.
 */
export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !pin.trim()) return;

    setError(null);
    setLoading(true);
    const err = await login(username, pin);
    setLoading(false);

    if (err) {
      setError(err);
      setPin('');
      pinRef.current?.focus();
    } else {
      navigate('/pos', { replace: true });
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--surface)' }}
    >
      <div className="w-full max-w-[340px]">
        {/* Brand mark */}
        <div className="mb-6 flex flex-col items-center">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'var(--accent)' }}
          >
            {/* Simple register/receipt icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>My POS</h1>
          <p className="mt-1 text-xs" style={{ color: 'var(--t3)' }}>Sign in to continue</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--line)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-medium"
                style={{ color: 'var(--t2)' }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input text-sm"
                placeholder="Enter your username"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="pin"
                className="mb-1.5 block text-xs font-medium"
                style={{ color: 'var(--t2)' }}
              >
                PIN
              </label>
              <input
                id="pin"
                ref={pinRef}
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="input text-sm tracking-[0.3em]"
                placeholder="••••"
                maxLength={6}
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-3 py-2 text-xs"
                style={{ background: 'rgba(240,149,149,0.1)', color: '#F09595' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !pin.trim()}
              className="btn-primary w-full py-2.5 text-sm mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
