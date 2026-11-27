/**
 * First-run welcome: a short checklist for a brand-new account (no rounds, no friends). Each step ticks itself off
 * as it's done; it's shown once per account on this phone (see `welcomeSeen` / `markWelcomeSeen`).
 */
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Emblem } from '@/art/components';
import { Icon } from '@/components/icons';
import { Tap } from '@/components/motion';
import { Button, SearchField } from '@/components/ui';
import { markWelcomeSeen } from '@/lib/welcome';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, shadow, space, themed, type } from '@/theme';

const USERNAME = /^[a-z0-9_]{3,20}$/;

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const me = data.me;
  const [username, setUsername] = useState(me.username ?? '');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const appName = Constants.expoConfig?.name ?? 'the app';

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q.length < 2 ? [] : data.courseIndex.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)).slice(0, 5);
  }, [query, data.courseIndex]);
  const home = me.homeCourseId ? data.courseSummary(me.homeCourseId) : undefined;
  const hasFriends = data.friends.length > 0 || data.requests.outgoing.length > 0;
  const hasRound = data.roundsByDate.length > 0;

  const save = async (what: string, changes: Parameters<typeof data.updateProfile>[0]) => {
    setBusy(what);
    setError(null);
    try {
      await data.updateProfile(changes);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };
  const close = (to?: string) => {
    void markWelcomeSeen(me.id);
    if (to) router.replace(to as never);
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const handle = username.trim().toLowerCase();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Emblem size={64} onDark={false} />
          <Text style={styles.title}>Welcome to {appName}</Text>
          <Text style={styles.sub}>Track your rounds, play with friends, and collect every course you play. Four quick things to get set up:</Text>
        </View>

        <Step n={1} done={!!me.username} title="Pick a username" sub="So friends can find you.">
          {me.username ? (
            <Text style={styles.doneText}>@{me.username}</Text>
          ) : (
            <View style={styles.row}>
              <View style={styles.inputWrap}>
                <Text style={styles.prefix}>@</Text>
                <TextInput
                  value={username}
                  onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="birdie_hunter"
                  placeholderTextColor={colors.inkMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  accessibilityLabel="Username"
                  style={styles.input}
                />
              </View>
              <Button label={busy === 'username' ? '…' : 'Save'} onPress={() => save('username', { username: handle })} disabled={!USERNAME.test(handle) || !!busy} style={{ minWidth: 88 }} />
            </View>
          )}
        </Step>

        <Step n={2} done={!!home} title="Your home course" sub="It shows on your profile, and Log a Round suggests it.">
          {home ? (
            <View style={styles.row}>
              <Text style={[styles.doneText, { flex: 1 }]} numberOfLines={1}>{home.name}</Text>
              <Tap onPress={() => save('home', { homeCourseId: null })} haptic="tap" scaleTo={0.95} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.link}>Change</Text>
              </Tap>
            </View>
          ) : (
            <View style={{ gap: space.sm }}>
              <SearchField value={query} onChange={setQuery} placeholder="Search courses or towns" />
              {matches.map((c) => (
                <Tap key={c.id} onPress={() => { setQuery(''); void save('home', { homeCourseId: c.id }); }} haptic="select" scaleTo={0.98} accessibilityRole="button" style={styles.option}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionName} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.optionSub}>{c.city}, {c.state}</Text>
                  </View>
                  <Icon name="chevron-right" size={14} color={colors.inkMuted} />
                </Tap>
              ))}
            </View>
          )}
        </Step>

        <Step n={3} done={hasFriends} title="Find your friends" sub="See each other’s rounds, play together and keep score for the group.">
          <Button variant="secondary" label={hasFriends ? 'Find more friends' : 'Find friends'} icon="users" onPress={() => router.push('/friends?tab=find')} />
        </Step>

        <Step n={4} done={hasRound} title="Log your first round" sub="Start one now, or add one you’ve already played.">
          <View style={styles.row}>
            <Button label="Play now" icon="flag" onPress={() => close('/round/new')} style={{ flex: 1 }} />
            <Button variant="secondary" label="Already played" onPress={() => close('/round/new?when=earlier')} style={{ flex: 1 }} />
          </View>
        </Step>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button variant="secondary" label={me.username && home && hasFriends ? 'Done' : 'I’ll look around first'} onPress={() => close()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Step({ n, done, title, sub, children }: { n: number; done: boolean; title: string; sub: string; children: ReactNode }) {
  return (
    <View style={styles.step} accessibilityLabel={`Step ${n}: ${title}${done ? ', done' : ''}`}>
      <View style={styles.stepHead}>
        <View style={[styles.badge, done && styles.badgeDone]}>
          {done ? <Icon name="check" size={14} color={colors.cream} strokeWidth={2.6} /> : <Text style={styles.badgeText}>{n}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepSub}>{sub}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: space.lg },
  hero: { alignItems: 'center', gap: space.sm, paddingBottom: space.sm },
  title: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36, color: colors.fairway, textAlign: 'center' },
  sub: { ...type.body, color: colors.inkMuted, textAlign: 'center', maxWidth: 330 },
  step: { backgroundColor: colors.creamLight, borderRadius: radius.lg, padding: space.lg, gap: space.md, ...shadow.card },
  stepHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  badge: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.fairway, alignItems: 'center', justifyContent: 'center' },
  badgeDone: { backgroundColor: colors.fairway },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.fairway },
  stepTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  stepSub: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: radius.md, backgroundColor: colors.paper, paddingHorizontal: space.md },
  prefix: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.inkMuted, marginRight: 2 },
  input: { flex: 1, height: 50, fontFamily: fonts.body, fontSize: 16, color: colors.ink, outlineStyle: 'none' } as never,
  doneText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.fairway },
  link: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  optionName: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  optionSub: { ...type.caption, color: colors.inkMuted },
  error: { ...type.body, fontSize: 14, color: colors.danger, textAlign: 'center' },
}));
