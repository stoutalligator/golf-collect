/**
 * Email + password auth (Supabase). When Supabase isn't configured the app runs as an offline demo:
 * `signedIn` is true and the user id is the sample player's.
 */
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { forgetDevice } from '@/lib/push';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export interface Auth {
  /** False until the stored session has been checked. */
  ready: boolean;
  signedIn: boolean;
  /** Supabase user id, or the demo player id offline. */
  userId: string | null;
  email: string | null;
  offline: boolean;
  /** Returns an error message, or null on success. */
  signIn(email: string, password: string): Promise<string | null>;
  /** Returns an error message, `'confirm'` when Supabase is waiting for email confirmation, or null when signed in. */
  signUp(name: string, email: string, password: string): Promise<string | null | 'confirm'>;
  /** Email a password-reset code. Returns an error message or null. */
  requestPasswordReset(email: string): Promise<string | null>;
  /**
   * Check a code from an email and sign in: `recovery` (password reset, then sets `newPassword`) or `signup`
   * (confirms a new account). Returns an error message or null.
   */
  verifyCode(email: string, code: string, kind: 'recovery' | 'signup', newPassword?: string): Promise<string | null>;
  /** Resend the sign-up confirmation email. */
  resendConfirmation(email: string): Promise<string | null>;
  /** Signed in: change your password. Returns an error message or null. */
  updatePassword(password: string): Promise<string | null>;
  signOut(): Promise<void>;
}

const Ctx = createContext<Auth | null>(null);

const friendly = (message: string) =>
  /invalid login credentials/i.test(message) ? 'That email and password don’t match.'
    : /already registered/i.test(message) ? 'There’s already an account with that email. Try signing in.'
      : /password/i.test(message) && /6/.test(message) ? 'Use a password with at least 6 characters.'
        : /expired|invalid.*(otp|token)|token.*(expired|invalid)/i.test(message) ? 'That code didn’t work or has expired. Request a new one.'
          : /rate limit|too many|security purposes/i.test(message) ? 'Too many emails just now. Wait a minute and try again.'
            : /same.*password|different from the old/i.test(message) ? 'Choose a password you haven’t used here before.'
              : message;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<Auth>(() => ({
    ready,
    offline: !supabaseConfigured,
    signedIn: !supabaseConfigured || !!session,
    userId: supabaseConfigured ? session?.user.id ?? null : 'me',
    email: session?.user.email ?? null,
    signIn: async (email, password) => {
      if (!supabase) return null;
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? friendly(error.message) : null;
    },
    signUp: async (name, email, password) => {
      if (!supabase) return null;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) return friendly(error.message);
      return data.session ? null : 'confirm';
    },
    requestPasswordReset: async (email) => {
      if (!supabase) return null;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      return error ? friendly(error.message) : null;
    },
    verifyCode: async (email, code, kind, newPassword) => {
      if (!supabase) return null;
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.replace(/\s/g, ''), type: kind });
      if (error) return friendly(error.message);
      if (kind === 'recovery' && newPassword) {
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) return friendly(pwError.message);
      }
      return null;
    },
    resendConfirmation: async (email) => {
      if (!supabase) return null;
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      return error ? friendly(error.message) : null;
    },
    updatePassword: async (password) => {
      if (!supabase) return null;
      const { error } = await supabase.auth.updateUser({ password });
      return error ? friendly(error.message) : null;
    },
    signOut: async () => {
      await forgetDevice().catch(() => {}); // this phone stops receiving this account's notifications
      await supabase?.auth.signOut();
    },
  }), [ready, session]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): Auth {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
