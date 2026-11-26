import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { homeHeroKeys } from '@/art';
import { Emblem, SceneImage } from '@/art/components';
import { Tap } from '@/components/motion';
import { Button, Chips } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { colors, fonts, radius, shadow, space, type } from '@/theme';

type Mode = 'sign-in' | 'sign-up';
/** Steps after the main form: request a reset code, enter it with a new password, or confirm a new account. */
type Flow = 'main' | 'forgot' | 'reset' | 'confirm';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [flow, setFlow] = useState<Flow>('main');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  const signUp = mode === 'sign-up';
  const emailOk = /\S+@\S+\.\S+/.test(email);
  const codeOk = /^\d{6,10}$/.test(code.replace(/\s/g, ''));
  const valid = flow === 'forgot' ? emailOk
    : flow === 'reset' ? codeOk && password.length >= 6
      : flow === 'confirm' ? codeOk
        : emailOk && password.length >= 6 && (!signUp || name.trim().length > 0);

  const go = (next: Flow, note?: string) => {
    setFlow(next);
    setCode('');
    setMessage(note ? { kind: 'info', text: note } : null);
    if (next === 'reset') setPassword('');
  };

  /** Runs one auth call with the busy flag; `undefined` means it didn't run. */
  const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (!valid || busy) return undefined;
    setBusy(true);
    setMessage(null);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (flow === 'forgot') {
      const err = await run(() => auth.requestPasswordReset(email));
      if (err === undefined) return;
      if (err) setMessage({ kind: 'error', text: err });
      else go('reset', `We emailed a code to ${email.trim()}. Enter it with your new password.`);
      return;
    }
    if (flow === 'reset' || flow === 'confirm') {
      const err = await run(() => auth.verifyCode(email, code, flow === 'reset' ? 'recovery' : 'signup', flow === 'reset' ? password : undefined));
      if (err) setMessage({ kind: 'error', text: err });
      return; // success signs you in
    }
    const result = await run(() => (signUp ? auth.signUp(name, email, password) : auth.signIn(email, password)));
    if (result === 'confirm') go('confirm', `We emailed a code to ${email.trim()}. Enter it to finish creating your account.`);
    else if (result) setMessage({ kind: 'error', text: result });
  };

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    const err = flow === 'reset' ? await auth.requestPasswordReset(email) : await auth.resendConfirmation(email);
    setBusy(false);
    setMessage(err ? { kind: 'error', text: err } : { kind: 'info', text: `New code sent to ${email.trim()}.` });
  };

  const title = flow === 'forgot' ? 'Reset your password' : flow === 'reset' ? 'Choose a new password' : flow === 'confirm' ? 'Confirm your email' : null;
  const action = busy ? 'One moment…'
    : flow === 'forgot' ? 'Email me a code'
      : flow === 'reset' ? 'Set password and sign in'
        : flow === 'confirm' ? 'Confirm and sign in'
          : signUp ? 'Create account' : 'Sign in';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Emblem size={56} onDark={false} />
          <Text style={styles.wordmark}>Greens Keeper</Text>
          <Text style={styles.tagline}>PLAY · TRACK · COLLECT</Text>
        </View>

        <View style={styles.hero}>
          <SceneImage artKeys={homeHeroKeys()} seed="sign-in" style={StyleSheet.absoluteFill} />
        </View>

        <View style={styles.form}>
          {flow === 'main' ? (
            <Chips
              value={mode}
              onChange={(m) => { setMode(m); setMessage(null); }}
              options={[{ value: 'sign-in', label: 'Sign in' }, { value: 'sign-up', label: 'Create account' }]}
            />
          ) : (
            <Text style={styles.flowTitle}>{title}</Text>
          )}
          {flow === 'main' && signUp ? (
            <Field label="Your name" value={name} onChange={setName} placeholder="First and last name" autoComplete="name" textContentType="name" />
          ) : null}
          {flow === 'main' || flow === 'forgot' ? (
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" onSubmit={flow === 'forgot' ? submit : undefined} />
          ) : null}
          {flow === 'reset' || flow === 'confirm' ? (
            <Field label="Code from the email" value={code} onChange={setCode} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" onSubmit={flow === 'confirm' ? submit : undefined} />
          ) : null}
          {flow === 'main' || flow === 'reset' ? (
            <Field
              label={flow === 'reset' ? 'New password' : 'Password'}
              value={password}
              onChange={setPassword}
              placeholder={signUp || flow === 'reset' ? 'At least 6 characters' : 'Password'}
              secure
              autoComplete={signUp || flow === 'reset' ? 'new-password' : 'current-password'}
              textContentType={signUp || flow === 'reset' ? 'newPassword' : 'password'}
              onSubmit={submit}
            />
          ) : null}
          {message ? <Text style={[styles.message, message.kind === 'error' && styles.error]} accessibilityLiveRegion="polite">{message.text}</Text> : null}
          <Button label={action} onPress={submit} disabled={!valid || busy} />
          {flow === 'main' && !signUp ? (
            <LinkText label="Forgot password?" onPress={() => go('forgot')} />
          ) : flow !== 'main' ? (
            <View style={styles.links}>
              {flow !== 'forgot' ? <LinkText label="Send a new code" onPress={resend} /> : null}
              <LinkText label="Back to sign in" onPress={() => { setMode('sign-in'); go('main'); }} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tap haptic="tap" scaleTo={0.96} onPress={onPress} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 4 }}>
      <Text style={styles.link}>{label}</Text>
    </Tap>
  );
}

function Field({ label, value, onChange, placeholder, secure, keyboardType, autoComplete, textContentType, onSubmit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; secure?: boolean;
  keyboardType?: 'email-address' | 'number-pad'; autoComplete?: 'email' | 'name' | 'new-password' | 'current-password' | 'one-time-code';
  textContentType?: 'emailAddress' | 'name' | 'newPassword' | 'password' | 'oneTimeCode'; onSubmit?: () => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType || secure ? 'none' : 'words'}
        autoCorrect={false}
        autoComplete={autoComplete}
        textContentType={textContentType}
        returnKeyType={onSubmit ? 'go' : 'next'}
        onSubmitEditing={onSubmit}
        accessibilityLabel={label}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: space.lg, gap: space.xl },
  brand: { alignItems: 'center', gap: 4 },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 34, color: colors.fairway, marginTop: space.sm },
  tagline: { fontFamily: fonts.bodySemibold, fontSize: 12, letterSpacing: 2.4, color: colors.gold },
  hero: { height: 150, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.paper },
  form: { backgroundColor: colors.creamLight, borderRadius: radius.xl, padding: space.lg, gap: space.lg, ...shadow.card },
  label: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  input: { height: 50, borderRadius: radius.md, backgroundColor: colors.paper, paddingHorizontal: space.md, fontFamily: fonts.body, fontSize: 16, color: colors.ink, outlineStyle: 'none' } as never,
  message: { ...type.body, fontSize: 14, color: colors.fairway },
  error: { color: colors.danger },
  flowTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.fairway },
  links: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
  link: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway, textDecorationLine: 'underline' },
});
