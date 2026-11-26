import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { homeHeroKeys } from '@/art';
import { Emblem, SceneImage } from '@/art/components';
import { Button, Chips } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { colors, fonts, radius, shadow, space, type } from '@/theme';

type Mode = 'sign-in' | 'sign-up';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  const signUp = mode === 'sign-up';
  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6 && (!signUp || name.trim().length > 0);

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setMessage(null);
    const result = signUp ? await auth.signUp(name, email, password) : await auth.signIn(email, password);
    setBusy(false);
    if (result === 'confirm') setMessage({ kind: 'info', text: `Check ${email.trim()} for a link to confirm your account, then sign in.` });
    else if (result) setMessage({ kind: 'error', text: result });
  };

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
          <Chips
            value={mode}
            onChange={(m) => { setMode(m); setMessage(null); }}
            options={[{ value: 'sign-in', label: 'Sign in' }, { value: 'sign-up', label: 'Create account' }]}
          />
          {signUp ? (
            <Field label="Your name" value={name} onChange={setName} placeholder="First and last name" autoComplete="name" textContentType="name" />
          ) : null}
          <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder={signUp ? 'At least 6 characters' : 'Password'}
            secure
            autoComplete={signUp ? 'new-password' : 'current-password'}
            textContentType={signUp ? 'newPassword' : 'password'}
            onSubmit={submit}
          />
          {message ? <Text style={[styles.message, message.kind === 'error' && styles.error]} accessibilityLiveRegion="polite">{message.text}</Text> : null}
          <Button label={busy ? 'One moment…' : signUp ? 'Create account' : 'Sign in'} onPress={submit} disabled={!valid || busy} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, secure, keyboardType, autoComplete, textContentType, onSubmit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; secure?: boolean;
  keyboardType?: 'email-address'; autoComplete?: 'email' | 'name' | 'new-password' | 'current-password';
  textContentType?: 'emailAddress' | 'name' | 'newPassword' | 'password'; onSubmit?: () => void;
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
        autoCapitalize={keyboardType === 'email-address' || secure ? 'none' : 'words'}
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
});
