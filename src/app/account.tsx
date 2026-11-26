import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Tap } from '@/components/motion';
import { Button, Card, IconButton, SearchField, SheetScreen } from '@/components/ui';
import { useAppData } from '@/state/app-data';
import { useAuth } from '@/state/auth';
import { colors, fonts, radius, space, themed, type } from '@/theme';

const USERNAME = /^[a-z0-9_]{3,20}$/;

/** Edit your profile (name, username, tagline, home course) and change your password. */
export default function Account() {
  const data = useAppData();
  const auth = useAuth();
  const me = data.me;
  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username ?? '');
  const [tagline, setTagline] = useState(me.tagline ?? '');
  const [homeId, setHomeId] = useState<string | null>(me.homeCourseId ?? null);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  // Fill the form once your profile has loaded (opening this screen straight from a link can beat the first load).
  const [seeded, setSeeded] = useState(data.ready ? me.id : null);
  if (data.ready && seeded !== me.id) {
    setSeeded(me.id);
    setName(me.name);
    setUsername(me.username ?? '');
    setTagline(me.tagline ?? '');
    setHomeId(me.homeCourseId ?? null);
  }

  const [password, setPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  const home = homeId ? data.courseSummary(homeId) : undefined;
  const handle = username.trim().toLowerCase();
  const nameOk = name.trim().length >= 1 && name.trim().length <= 40;
  const handleOk = !handle || USERNAME.test(handle);
  const changed = name.trim() !== me.name || handle !== (me.username ?? '') || tagline.trim() !== (me.tagline ?? '') || homeId !== (me.homeCourseId ?? null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return data.courseIndex.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)).slice(0, 12);
  }, [query, data.courseIndex]);

  const save = async () => {
    if (!changed || !nameOk || !handleOk || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await data.updateProfile({ name, username: handle || null, tagline: tagline.trim() || null, homeCourseId: homeId });
      setMessage({ kind: 'info', text: 'Saved.' });
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (password.length < 6 || pwBusy) return;
    setPwBusy(true);
    const err = await auth.updatePassword(password);
    setPwBusy(false);
    if (err) setPwMessage({ kind: 'error', text: err });
    else {
      setPassword('');
      setPwMessage({ kind: 'info', text: 'Password updated.' });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SheetScreen title="Edit profile" right={<IconButton name="x" label="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />}>
        <Card style={styles.card}>
          <Field label="Name" value={name} onChange={setName} placeholder="First and last name" max={40} />
          <Field
            label="Username"
            value={username}
            onChange={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="e.g. birdie_hunter"
            prefix="@"
            max={20}
            hint={handleOk ? 'Friends can find you by this. Letters, numbers and _ (3–20).' : 'Use 3–20 lowercase letters, numbers or underscores.'}
            hintError={!handleOk}
          />
          <Field label="Tagline" value={tagline} onChange={setTagline} placeholder="A line about your game" max={80} hint={`${tagline.length}/80`} />

          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Home course</Text>
            {home && !picking ? (
              <View style={styles.home}>
                <Icon name="flag" size={16} color={colors.fairway} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.homeName} numberOfLines={1}>{home.name}</Text>
                  <Text style={styles.hint}>{home.city}, {home.state}</Text>
                </View>
                <Tap haptic="tap" onPress={() => setPicking(true)} accessibilityRole="button" hitSlop={8}><Text style={styles.link}>Change</Text></Tap>
                <Tap haptic="tap" onPress={() => setHomeId(null)} accessibilityRole="button" accessibilityLabel="Remove home course" hitSlop={8}>
                  <Icon name="x" size={16} color={colors.inkMuted} />
                </Tap>
              </View>
            ) : (
              <>
                <SearchField value={query} onChange={setQuery} placeholder="Search courses or towns" />
                {matches.map((c) => (
                  <Tap key={c.id} haptic="select" scaleTo={0.985} onPress={() => { setHomeId(c.id); setPicking(false); setQuery(''); }} accessibilityRole="button" style={styles.option}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionName} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.hint}>{c.city}, {c.state}</Text>
                    </View>
                    <Icon name="chevron-right" size={14} color={colors.inkMuted} />
                  </Tap>
                ))}
                {picking ? <Tap haptic="tap" onPress={() => { setPicking(false); setQuery(''); }} accessibilityRole="button"><Text style={styles.link}>Cancel</Text></Tap> : null}
              </>
            )}
          </View>

          {message ? <Text style={[styles.message, message.kind === 'error' && styles.error]} accessibilityLiveRegion="polite">{message.text}</Text> : null}
          <Button label={saving ? 'Saving…' : 'Save profile'} onPress={save} disabled={!changed || !nameOk || !handleOk || saving} />
        </Card>

        {auth.offline ? null : (
          <Card style={styles.card}>
            <Text style={styles.section}>Password</Text>
            <Text style={styles.hint}>Signed in as {auth.email}</Text>
            <Field label="New password" value={password} onChange={setPassword} placeholder="At least 6 characters" secure onSubmit={changePassword} />
            {pwMessage ? <Text style={[styles.message, pwMessage.kind === 'error' && styles.error]} accessibilityLiveRegion="polite">{pwMessage.text}</Text> : null}
            <Button variant="secondary" label={pwBusy ? 'Updating…' : 'Change password'} onPress={changePassword} disabled={password.length < 6 || pwBusy} />
          </Card>
        )}

        {auth.offline ? null : <Button variant="secondary" label="Sign out" icon="lock" haptic="warning" onPress={auth.signOut} />}
      </SheetScreen>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, prefix, max, hint, hintError, secure, onSubmit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; prefix?: string; max?: number;
  hint?: string; hintError?: boolean; secure?: boolean; onSubmit?: () => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMuted}
          maxLength={max}
          secureTextEntry={secure}
          autoCapitalize={prefix || secure ? 'none' : 'sentences'}
          autoCorrect={!prefix && !secure}
          autoComplete={secure ? 'new-password' : undefined}
          textContentType={secure ? 'newPassword' : undefined}
          onSubmitEditing={onSubmit}
          accessibilityLabel={label}
          style={styles.input}
        />
      </View>
      {hint ? <Text style={[styles.hint, hintError && styles.error]}>{hint}</Text> : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { padding: space.lg, gap: space.lg },
  section: { fontFamily: fonts.display, fontSize: 20, color: colors.fairway },
  label: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: radius.md, backgroundColor: colors.paper, paddingHorizontal: space.md },
  prefix: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.inkMuted, marginRight: 2 },
  input: { flex: 1, height: 50, fontFamily: fonts.body, fontSize: 16, color: colors.ink, outlineStyle: 'none' } as never,
  hint: { ...type.caption, color: colors.inkMuted },
  home: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 50, borderRadius: radius.md, backgroundColor: colors.paper, paddingHorizontal: space.md },
  homeName: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  optionName: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  link: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway },
  message: { ...type.body, fontSize: 14, color: colors.fairway },
  error: { color: colors.danger },
}));
