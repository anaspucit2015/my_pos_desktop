import { create } from 'zustand';
import type { IUser } from '@my-pos/shared';

interface AuthState {
  currentUser: IUser | null;
  isAuthenticated: boolean;
  /** Attempt to restore a previously active session from the main process. */
  restoreSession(): Promise<void>;
  /** Authenticate with username + PIN. Returns an error string on failure. */
  login(username: string, pin: string): Promise<string | null>;
  /** Clear the active session both locally and in the main process. */
  logout(): Promise<void>;
  /** Directly set the active user (used after a successful login response). */
  setUser(user: IUser): void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,

  async restoreSession() {
    const res = await window.api.auth.getCurrentUser();
    if (res.success) {
      set({ currentUser: res.data, isAuthenticated: true });
    }
  },

  async login(username, pin) {
    const res = await window.api.auth.login(username, pin);
    if (res.success) {
      set({ currentUser: res.data, isAuthenticated: true });
      return null;
    }
    return res.error;
  },

  async logout() {
    await window.api.auth.logout();
    set({ currentUser: null, isAuthenticated: false });
  },

  setUser(user) {
    set({ currentUser: user, isAuthenticated: true });
  },
}));
