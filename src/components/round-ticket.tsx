/**
 * The round "ticket": course painting with a date badge, a gold kicker, the course name, the tee time line, and
 * the group. Used for the live preview when scheduling, league/tournament rounds and scheduled rounds.
 * `compact` is the list size (shorter art, smaller type).
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/icons';
import { Tap } from '@/components/motion';
import { CourseThumb } from '@/components/round-card';
import { Avatar } from '@/components/social';
import type { Player } from '@/domain/types';
import { colors, fonts, radius, shadow, space, themed, type } from '@/theme';

const at = (iso: string) => new Date(`${iso}T12:00:00`);

export function RoundTicket({
  course, date, kicker, title, meta, players = [], openSpots = 0, playersText, note, status, statusTone = 'plain', footer, onPress, compact = false, faded = false, style,
}: {
  course?: { id: string; region: string };
  /** ISO date for the badge (omit for "date TBD"). */
  date?: string;
  kicker?: string;
  title: string;
  meta?: string;
  players?: Player[];
  /** Dashed empty slots after the players. */
  openSpots?: number;
  playersText?: string;
  note?: string;
  /** Small pill over the art, top left ("Today", "4 posted"). */
  status?: string;
  statusTone?: 'plain' | 'live';
  /** Actions under the body (e.g. "Log round"). */
  footer?: ReactNode;
  onPress?: () => void;
  compact?: boolean;
  /** Past rounds: slightly receded. */
  faded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const d = date ? at(date) : undefined;
  const avatar = compact ? 26 : 34;
  const shown = compact ? players.slice(0, 5) : players;
  const body = (
    <>
      <View style={[styles.top, compact && styles.topCompact]}>
        {course ? <CourseThumb course={course} style={styles.art} /> : <View style={[styles.art, styles.artEmpty]}><Icon name="flag" size={22} color={colors.inkMuted} /></View>}
        {status ? (
          <View style={[styles.status, statusTone === 'live' && styles.statusLive]}>
            <Text style={[styles.statusText, statusTone === 'live' && styles.statusTextLive]}>{status}</Text>
          </View>
        ) : null}
        <View style={[styles.badge, compact && styles.badgeCompact]}>
          {d ? (
            <>
              <Text style={styles.badgeDow}>{d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</Text>
              <Text style={[styles.badgeDay, compact && styles.badgeDayCompact]}>{d.getDate()}</Text>
              <Text style={styles.badgeMonth}>{d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
            </>
          ) : (
            <Text style={styles.badgeMonth}>TBD</Text>
          )}
        </View>
      </View>
      <View style={[styles.body, compact && styles.bodyCompact]}>
        {kicker ? <Text style={styles.kicker} numberOfLines={1}>{kicker}</Text> : null}
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>{title}</Text>
        {meta ? <Text style={styles.meta} numberOfLines={1}>{meta}</Text> : null}
        {shown.length || openSpots || playersText ? (
          <View style={[styles.slots, compact && { marginTop: space.sm }]}>
            {shown.map((p) => <View key={p.id} style={[styles.slotFilled, { borderRadius: avatar / 2 + 2 }]}><Avatar player={p} size={avatar} /></View>)}
            {Array.from({ length: openSpots }, (_, i) => (
              <View key={`open-${i}`} style={[styles.slotOpen, { width: avatar + 4, height: avatar + 4, borderRadius: avatar / 2 + 2 }]}><Icon name="plus" size={12} color={colors.inkMuted} /></View>
            ))}
            {playersText ? <Text style={styles.slotText} numberOfLines={1}>{playersText}</Text> : null}
          </View>
        ) : null}
        {note ? <Text style={styles.note} numberOfLines={3}>“{note}”</Text> : null}
      </View>
    </>
  );
  // The footer's buttons sit beside the tappable ticket, never inside it (no nested buttons).
  const foot = footer ? <View style={[styles.footer, compact && styles.footerCompact]}>{footer}</View> : null;
  return onPress ? (
    <View style={[styles.ticket, faded && styles.faded, style]}>
      <Tap onPress={onPress} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={[kicker, title, date ? at(date).toDateString() : undefined].filter(Boolean).join(', ')}>{body}</Tap>
      {foot}
    </View>
  ) : (
    <View style={[styles.ticket, faded && styles.faded, style]}>{body}{foot}</View>
  );
}

const styles = themed(() => StyleSheet.create({
  ticket: { backgroundColor: colors.creamLight, borderRadius: radius.xl, overflow: 'hidden', ...shadow.card },
  faded: { opacity: 0.72 },
  top: { height: 110 },
  topCompact: { height: 72 },
  art: { width: '100%', height: '100%', borderRadius: 0 },
  artEmpty: { backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  status: { position: 'absolute', left: space.md, top: space.md, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.artButton },
  statusLive: { backgroundColor: colors.fairway },
  statusText: { fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.6, color: colors.ink },
  statusTextLive: { color: colors.cream },
  badge: { position: 'absolute', right: space.lg, bottom: -28, width: 64, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.creamLight, alignItems: 'center', ...shadow.control },
  badgeCompact: { width: 54, paddingVertical: 6, bottom: -24 },
  badgeDow: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1.2, color: colors.gold },
  badgeDay: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, color: colors.fairway },
  badgeDayCompact: { fontSize: 21, lineHeight: 24 },
  badgeMonth: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1.2, color: colors.inkMuted },
  body: { padding: space.lg, paddingTop: space.md, gap: 2 },
  bodyCompact: { paddingVertical: space.md, paddingTop: space.sm },
  kicker: { fontFamily: fonts.bodySemibold, fontSize: 12, letterSpacing: 0.6, color: colors.gold, paddingRight: 72 },
  title: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 28, color: colors.fairway, paddingRight: 72 },
  titleCompact: { fontSize: 18, lineHeight: 24 },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  note: { fontFamily: fonts.displayItalic, fontSize: 15, color: colors.ink, marginTop: space.sm },
  slots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },
  slotFilled: { borderWidth: 2, borderColor: colors.creamLight },
  slotOpen: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' },
  slotText: { ...type.caption, fontSize: 12, color: colors.inkMuted, marginLeft: 4, flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.lg, marginTop: -space.xs },
  footerCompact: { paddingBottom: space.md },
}));
