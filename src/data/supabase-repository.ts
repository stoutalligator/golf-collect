/**
 * Repository backed by Supabase. Same interface as the local demo repository, so screens don't change.
 *
 * Reads: one load (courses, your profile, friendships, every round you can see, reactions, comments,
 * wishlist); row-level security decides what "can see" means. The result is cached; writes go to Supabase
 * and patch the cache, so per-hole saves don't re-download everything. `load(true)` refetches.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Comment, Course, CourseAccess, CourseSummary, FairwayResult, HoleScore, Player, Reaction, ReactionEmoji, Round, SimCourse, SocialState, Tee,
} from '@/domain/types';

import type { CompetitionEvent, EventFormat, EventMember, EventRound } from '@/domain/competition';
import { makeJoinCode } from '@/domain/competition';

import type { AppSnapshot, NewEvent, Repository } from './repository';

// ── Row shapes (only the columns we read) ───────────────────────────────────

type ProfileRow = {
  id: string; username: string | null; display_name: string; tagline: string | null; avatar_url: string | null;
  home_state: string | null; home_course_id: string | null; created_at: string;
};
type HoleScoreRow = {
  hole_number: number; strokes: number; putts: number | null; fairway: FairwayResult | null; gir: boolean | null;
  penalties: number | null; chips: number | null; sand_shots: number | null;
};
type RoundPlayerRow = { id: string; profile_id: string | null; guest_name: string | null; is_owner: boolean; hole_scores: HoleScoreRow[] };
type RoundRow = {
  id: string; owner_id: string; kind: 'course' | 'sim'; course_id: string | null; sim_course_id: string | null; tee_id: string | null;
  played_on: string; status: 'active' | 'complete'; hole_numbers: number[]; created_at: string; completed_at: string | null;
  event_round_id: string | null;
  round_players: RoundPlayerRow[];
};

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';

function toPlayer(p: ProfileRow, me: string): Player {
  return {
    id: p.id,
    name: p.display_name,
    initials: initialsOf(p.display_name),
    username: p.username ?? undefined,
    homeState: p.home_state ?? undefined,
    homeCourseId: p.home_course_id ?? undefined,
    tagline: p.tagline ?? undefined,
    memberSince: p.created_at.slice(0, 10),
    isMe: p.id === me,
  };
}

function toHoleScore(h: HoleScoreRow): HoleScore {
  const s: HoleScore = { strokes: h.strokes };
  if (h.putts !== null) s.putts = h.putts;
  if (h.fairway !== null) s.fairway = h.fairway;
  if (h.gir !== null) s.gir = h.gir;
  if (h.penalties !== null) s.penalties = h.penalties;
  if (h.chips !== null) s.chips = h.chips;
  if (h.sand_shots !== null) s.sandShots = h.sand_shots;
  return s;
}

function toRound(r: RoundRow): Round {
  const players = r.round_players.filter((p) => p.profile_id);
  const others = players.filter((p) => p.profile_id !== r.owner_id).map((p) => p.profile_id!);
  const scores: Round['scores'] = {};
  for (const p of players) {
    scores[p.profile_id!] = r.hole_numbers.map((n) => {
      const h = p.hole_scores.find((x) => x.hole_number === n);
      return h ? toHoleScore(h) : null;
    });
  }
  if (!scores[r.owner_id]) scores[r.owner_id] = r.hole_numbers.map(() => null);
  return {
    id: r.id,
    ownerId: r.owner_id,
    kind: r.kind,
    courseId: (r.kind === 'course' ? r.course_id : r.sim_course_id) ?? '',
    teeId: r.tee_id ?? undefined,
    date: r.played_on,
    status: r.status,
    holeNumbers: r.hole_numbers,
    playerIds: [r.owner_id, ...others],
    scores,
    createdAt: r.created_at,
    completedAt: r.completed_at ?? undefined,
    eventRoundId: r.event_round_id ?? undefined,
  };
}

type CourseRow = {
  id: string; name: string; city: string; state: string; county: string | null; region: string; biome: Course['biome'] | null;
  biome_source: Course['biomeSource'] | null; access: CourseAccess; lat: number; lng: number; website: string | null; architect: string | null;
  year_opened: number | null; description: string; verification_status: Course['verification']['status']; verification_notes: string[];
  tags: string[];
  course_holes: { number: number; par: number; handicap: number }[];
  course_tees: {
    id: string; name: string; par: number; total_yards: number; hole_yardages: number[] | null; sort_order: number;
    rating_men: number | null; slope_men: number | null; rating_women: number | null; slope_women: number | null;
  }[];
  course_sources: { name: string; url: string; license: string | null; checked_on: string }[];
};

function toCourse(c: CourseRow): Course {
  const tees: Tee[] = [...c.course_tees].sort((a, b) => a.sort_order - b.sort_order).map((t) => ({
    id: t.id,
    name: t.name,
    par: t.par,
    totalYards: t.total_yards,
    yardages: t.hole_yardages,
    ratings: {
      ...(t.rating_men !== null && t.slope_men !== null ? { men: { rating: Number(t.rating_men), slope: t.slope_men } } : {}),
      ...(t.rating_women !== null && t.slope_women !== null ? { women: { rating: Number(t.rating_women), slope: t.slope_women } } : {}),
    },
  }));
  return {
    id: c.id,
    name: c.name,
    city: c.city,
    state: c.state,
    county: c.county ?? undefined,
    region: c.region,
    biome: c.biome ?? undefined,
    biomeSource: c.biome_source ?? undefined,
    access: c.access,
    location: { lat: c.lat, lng: c.lng },
    website: c.website ?? undefined,
    architect: c.architect ?? undefined,
    yearOpened: c.year_opened ?? undefined,
    description: c.description,
    holes: [...c.course_holes].sort((a, b) => a.number - b.number),
    tees,
    verification: {
      status: c.verification_status,
      sources: c.course_sources.map((s) => ({ name: s.name, url: s.url, checked: s.checked_on, license: s.license ?? undefined })),
      notes: c.verification_notes,
    },
    tags: c.tags.length ? c.tags : undefined,
  };
}

type IndexRow = {
  id: string; name: string; city: string; state: string; county: string | null; region: string; access: CourseAccess;
  lat: number; lng: number; par: number | null; hole_count: number | null;
};

const toSummary = (c: IndexRow): CourseSummary => ({
  id: c.id, name: c.name, city: c.city, state: c.state, county: c.county ?? undefined, region: c.region, access: c.access,
  location: { lat: c.lat, lng: c.lng }, par: c.par ?? 0, holeCount: c.hole_count ?? 18,
});

type EventRow = { id: string; kind: CompetitionEvent['kind']; name: string; organizer_id: string; format: EventFormat; join_code: string; starts_on: string; ends_on: string | null; created_at: string };
type MemberRow = { event_id: string; profile_id: string; role: EventMember['role']; status: EventMember['status'] };
type EventRoundRow = { id: string; event_id: string; seq: number; name: string; course_id: string; tee_id: string | null; scheduled_on: string; tee_time: string | null; holes: EventRound['holes'] };
type MatchRow = { id: string; event_round_id: string; player_a: string; player_b: string };

const toEvent = (e: EventRow): CompetitionEvent => ({
  id: e.id, kind: e.kind, name: e.name, organizerId: e.organizer_id, format: e.format, joinCode: e.join_code,
  startsOn: e.starts_on, endsOn: e.ends_on ?? undefined, createdAt: e.created_at,
});
const toEventRound = (r: EventRoundRow): EventRound => ({
  id: r.id, eventId: r.event_id, seq: r.seq, name: r.name, courseId: r.course_id, teeId: r.tee_id ?? undefined,
  scheduledOn: r.scheduled_on, teeTime: r.tee_time?.slice(0, 5) ?? undefined, holes: r.holes,
});

/** Strip characters that would break a PostgREST `or=` filter. */
const safeQuery = (q: string) => q.replace(/[^\p{L}\p{N} _.'-]/gu, '').trim().slice(0, 40);

export class SupabaseRepository implements Repository {
  private snap: AppSnapshot | null = null;
  /** Course index + sim courses: shared reference data, fetched once per app session. */
  private static reference: { index: CourseSummary[]; simCourses: SimCourse[] } | null = null;
  /** Full scorecards fetched so far (shared across users in this session). */
  private static fullCourses = new Map<string, Course>();
  /** round id → the owner's round_players id (needed to write hole scores). */
  private ownerSlot = new Map<string, string>();

  private db: SupabaseClient;
  private userId: string;

  constructor(db: SupabaseClient, userId: string) {
    this.db = db;
    this.userId = userId;
  }

  private async must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>, what: string): Promise<T> {
    const { data, error } = await p;
    if (error) throw new Error(`${what}: ${error.message}`);
    return data;
  }

  /** Lightweight index of every course (paged; PostgREST returns at most 1000 rows per request). */
  private async referenceData() {
    if (SupabaseRepository.reference) return SupabaseRepository.reference;
    const index: CourseSummary[] = [];
    for (let from = 0; ; from += 1000) {
      const page = (await this.must(
        this.db.from('courses').select('id, name, city, state, county, region, access, lat, lng, par, hole_count').order('id').range(from, from + 999),
        'course index',
      )) as IndexRow[];
      index.push(...page.map(toSummary));
      if (page.length < 1000) break;
    }
    const sims = await this.must(this.db.from('sim_courses').select('id, name, platform, holes'), 'sim courses');
    SupabaseRepository.reference = {
      index: index.sort((a, b) => a.name.localeCompare(b.name)),
      simCourses: (sims as { id: string; name: string; platform: string | null; holes: SimCourse['holes'] }[])
        .map((s) => ({ id: s.id, name: s.name, platform: s.platform ?? undefined, holes: s.holes })),
    };
    return SupabaseRepository.reference;
  }

  /** Fetch full scorecards (holes, tees, sources) for any of these ids not cached yet. */
  private async fetchCourses(ids: string[]) {
    const cache = SupabaseRepository.fullCourses;
    const missing = [...new Set(ids)].filter((id) => id && !cache.has(id));
    for (let i = 0; i < missing.length; i += 100) {
      const rows = (await this.must(
        this.db.from('courses')
          .select('*, course_holes(number, par, handicap), course_tees(*), course_sources(name, url, license, checked_on)')
          .in('id', missing.slice(i, i + 100)),
        'courses',
      )) as CourseRow[];
      for (const r of rows) cache.set(r.id, toCourse(r));
    }
  }

  private loadedCourses(): Course[] {
    return [...SupabaseRepository.fullCourses.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async loadCourses(ids: string[]) {
    const before = SupabaseRepository.fullCourses.size;
    await this.fetchCourses(ids);
    if (this.snap && SupabaseRepository.fullCourses.size !== before) this.patch({ courses: this.loadedCourses() });
  }

  async load(force = false): Promise<AppSnapshot> {
    if (this.snap && !force) return this.snap;
    const me = this.userId;
    const [ref, friendships, roundRows, wish, reactions, comments, eventRows, memberRows, eventRoundRows, matchRows] = await Promise.all([
      this.referenceData(),
      this.must(this.db.from('friendships').select('requester_id, addressee_id, status'), 'friendships'),
      this.must(
        this.db.from('rounds')
          .select('id, owner_id, kind, course_id, sim_course_id, tee_id, played_on, status, hole_numbers, created_at, completed_at, event_round_id, round_players(id, profile_id, guest_name, is_owner, hole_scores(hole_number, strokes, putts, fairway, gir, penalties, chips, sand_shots))')
          .order('played_on', { ascending: false })
          .limit(500),
        'rounds',
      ),
      this.must(this.db.from('wishlist').select('course_id'), 'wishlist'),
      this.must(this.db.from('reactions').select('round_id, user_id, emoji'), 'reactions'),
      this.must(this.db.from('comments').select('id, round_id, user_id, body, created_at').order('created_at'), 'comments'),
      this.must(this.db.from('events').select('id, kind, name, organizer_id, format, join_code, starts_on, ends_on, created_at'), 'events'),
      this.must(this.db.from('event_members').select('event_id, profile_id, role, status'), 'event members'),
      this.must(this.db.from('event_rounds').select('id, event_id, seq, name, course_id, tee_id, scheduled_on, tee_time, holes').order('scheduled_on'), 'event rounds'),
      this.must(this.db.from('event_matches').select('id, event_round_id, player_a, player_b'), 'event matches'),
    ]);
    const events = (eventRows as EventRow[]).map(toEvent);
    const eventMembers = (memberRows as MemberRow[]).map((m) => ({ eventId: m.event_id, playerId: m.profile_id, role: m.role, status: m.status }));
    const eventRounds = (eventRoundRows as EventRoundRow[]).map(toEventRound);
    const eventMatches = (matchRows as MatchRow[]).map((m) => ({ id: m.id, eventRoundId: m.event_round_id, playerA: m.player_a, playerB: m.player_b }));

    const fs = friendships as { requester_id: string; addressee_id: string; status: 'pending' | 'accepted' }[];
    const other = (f: (typeof fs)[number]) => (f.requester_id === me ? f.addressee_id : f.requester_id);
    const friendIds = fs.filter((f) => f.status === 'accepted').map(other);
    const incomingIds = fs.filter((f) => f.status === 'pending' && f.addressee_id === me).map((f) => f.requester_id);
    const outgoingIds = fs.filter((f) => f.status === 'pending' && f.requester_id === me).map((f) => f.addressee_id);

    const rounds = (roundRows as RoundRow[]).map((r) => {
      const owner = r.round_players.find((p) => p.is_owner && p.profile_id === r.owner_id);
      if (owner && r.owner_id === me) this.ownerSlot.set(r.id, owner.id);
      return toRound(r);
    });
    const taggedIds = [...rounds.flatMap((r) => r.playerIds), ...eventMembers.map((m) => m.playerId), ...events.map((e) => e.organizerId)];
    const ids = [...new Set([me, ...friendIds, ...incomingIds, ...outgoingIds, ...taggedIds])];
    const profiles = (await this.must(this.db.from('profiles').select('*').in('id', ids), 'profiles')) as ProfileRow[];
    const byId = new Map(profiles.map((p) => [p.id, toPlayer(p, me)]));
    const mine = byId.get(me);
    if (!mine) throw new Error('Your profile is missing. Try signing out and in again.');

    const social: SocialState = { reactions: {}, comments: {} };
    for (const r of reactions as { round_id: string; user_id: string; emoji: ReactionEmoji }[]) {
      (social.reactions[r.round_id] ??= []).push({ playerId: r.user_id, emoji: r.emoji });
    }
    for (const c of comments as { id: string; round_id: string; user_id: string; body: string; created_at: string }[]) {
      (social.comments[c.round_id] ??= []).push({ id: c.id, playerId: c.user_id, text: c.body, at: c.created_at });
    }

    const wishlist = (wish as { course_id: string }[]).map((w) => w.course_id);
    // Full scorecards only for courses that stats, feed and collections need right away.
    await this.fetchCourses([...rounds.filter((r) => r.kind === 'course').map((r) => r.courseId), ...wishlist, ...eventRounds.map((r) => r.courseId)]);

    const pick = (list: string[]) => list.map((id) => byId.get(id)).filter((p): p is Player => !!p);
    this.snap = {
      me: mine,
      friends: pick(friendIds),
      others: pick([...new Set(taggedIds)].filter((id) => id !== me && !friendIds.includes(id))),
      requests: { incoming: pick(incomingIds), outgoing: pick(outgoingIds) },
      courseIndex: ref.index,
      courses: this.loadedCourses(),
      simCourses: ref.simCourses,
      rounds: rounds.filter((r) => r.ownerId === me),
      friendRounds: rounds.filter((r) => r.ownerId !== me),
      wishlist,
      social,
      events,
      eventMembers,
      eventRounds,
      eventMatches,
    };
    return this.snap;
  }

  private patch(next: Partial<AppSnapshot>) {
    if (this.snap) this.snap = { ...this.snap, ...next };
  }

  async saveRound(round: Round) {
    const me = this.userId;
    await this.must(this.db.from('rounds').upsert({
      id: round.id,
      owner_id: me,
      kind: round.kind,
      course_id: round.kind === 'course' ? round.courseId : null,
      sim_course_id: round.kind === 'sim' ? round.courseId : null,
      tee_id: round.kind === 'course' ? round.teeId ?? null : null,
      played_on: round.date,
      status: round.status,
      hole_numbers: round.holeNumbers,
      created_at: round.createdAt,
      completed_at: round.completedAt ?? null,
      event_round_id: round.eventRoundId ?? null,
    }), 'save round');

    // Players: the owner row once; tagged friends added/removed to match playerIds.
    let slot = this.ownerSlot.get(round.id);
    const existing = (await this.must(this.db.from('round_players').select('id, profile_id, is_owner').eq('round_id', round.id), 'round players')) as
      { id: string; profile_id: string | null; is_owner: boolean }[];
    if (!slot) {
      slot = existing.find((p) => p.is_owner)?.id;
      if (!slot) {
        const created = (await this.must(this.db.from('round_players').insert({ round_id: round.id, profile_id: me, is_owner: true }).select('id').single(), 'add owner')) as { id: string };
        slot = created.id;
      }
      this.ownerSlot.set(round.id, slot);
    }
    const tagged = round.playerIds.filter((id) => id !== me);
    const have = existing.filter((p) => !p.is_owner && p.profile_id).map((p) => p.profile_id!);
    const add = tagged.filter((id) => !have.includes(id));
    const drop = have.filter((id) => !tagged.includes(id));
    if (add.length) await this.must(this.db.from('round_players').insert(add.map((profile_id) => ({ round_id: round.id, profile_id }))), 'tag players');
    if (drop.length) await this.must(this.db.from('round_players').delete().eq('round_id', round.id).in('profile_id', drop), 'untag players');

    // Scores: write entered holes (unentered stats as null, never 0); remove holes cleared back to empty.
    const scores = round.scores[me] ?? round.scores[round.playerIds[0]] ?? [];
    const rows = round.holeNumbers.flatMap((n, i) => {
      const s = scores[i];
      return s ? [{
        round_player_id: slot, hole_number: n, strokes: s.strokes, putts: s.putts ?? null, fairway: s.fairway ?? null, gir: s.gir ?? null,
        penalties: s.penalties ?? null, chips: s.chips ?? null, sand_shots: s.sandShots ?? null,
      }] : [];
    });
    if (rows.length) await this.must(this.db.from('hole_scores').upsert(rows), 'save scores');
    const empty = round.holeNumbers.filter((_, i) => !scores[i]);
    if (empty.length) await this.must(this.db.from('hole_scores').delete().eq('round_player_id', slot).in('hole_number', empty), 'clear scores');

    const stored: Round = { ...round, ownerId: me, scores: { [me]: scores } };
    if (this.snap) this.patch({ rounds: [...this.snap.rounds.filter((r) => r.id !== round.id), stored] });
  }

  async deleteRound(id: string) {
    await this.must(this.db.from('rounds').delete().eq('id', id), 'delete round');
    this.ownerSlot.delete(id);
    if (this.snap) this.patch({ rounds: this.snap.rounds.filter((r) => r.id !== id) });
  }

  async clearRounds() {
    await this.must(this.db.from('rounds').delete().eq('owner_id', this.userId), 'clear rounds');
    this.ownerSlot.clear();
    this.patch({ rounds: [] });
  }

  async setWishlist(courseIds: string[]) {
    const current = this.snap?.wishlist ?? [];
    const add = courseIds.filter((id) => !current.includes(id));
    const drop = current.filter((id) => !courseIds.includes(id));
    if (add.length) await this.must(this.db.from('wishlist').insert(add.map((course_id) => ({ user_id: this.userId, course_id }))), 'wishlist add');
    if (drop.length) await this.must(this.db.from('wishlist').delete().eq('user_id', this.userId).in('course_id', drop), 'wishlist remove');
    this.patch({ wishlist: courseIds });
  }

  async react(roundId: string, emoji: ReactionEmoji) {
    const me = this.userId;
    const list = this.snap?.social.reactions[roundId] ?? [];
    const mine = list.find((r) => r.playerId === me);
    let next: Reaction[];
    if (mine?.emoji === emoji) {
      await this.must(this.db.from('reactions').delete().eq('round_id', roundId).eq('user_id', me), 'remove reaction');
      next = list.filter((r) => r.playerId !== me);
    } else {
      await this.must(this.db.from('reactions').upsert({ round_id: roundId, user_id: me, emoji }), 'react');
      next = [...list.filter((r) => r.playerId !== me), { playerId: me, emoji }];
    }
    if (this.snap) this.patch({ social: { ...this.snap.social, reactions: { ...this.snap.social.reactions, [roundId]: next } } });
  }

  async addComment(roundId: string, text: string) {
    const row = (await this.must(
      this.db.from('comments').insert({ round_id: roundId, user_id: this.userId, body: text }).select('id, created_at').single(),
      'comment',
    )) as { id: string; created_at: string };
    const c: Comment = { id: row.id, playerId: this.userId, text, at: row.created_at };
    if (this.snap) {
      const list = this.snap.social.comments[roundId] ?? [];
      this.patch({ social: { ...this.snap.social, comments: { ...this.snap.social.comments, [roundId]: [...list, c] } } });
    }
  }

  async searchPlayers(query: string): Promise<Player[]> {
    const q = safeQuery(query);
    if (q.length < 2) return [];
    const rows = (await this.must(
      this.db.from('profiles').select('*').or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).neq('id', this.userId).limit(20),
      'search',
    )) as ProfileRow[];
    return rows.map((p) => toPlayer(p, this.userId));
  }

  async sendFriendRequest(playerId: string) {
    await this.must(this.db.from('friendships').insert({ requester_id: this.userId, addressee_id: playerId }), 'friend request');
    await this.load(true);
  }

  async respondToRequest(playerId: string, accept: boolean) {
    const q = this.db.from('friendships');
    if (accept) {
      await this.must(q.update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('requester_id', playerId).eq('addressee_id', this.userId), 'accept');
    } else {
      await this.must(q.delete().eq('requester_id', playerId).eq('addressee_id', this.userId), 'decline');
    }
    await this.load(true);
  }

  async removeFriend(playerId: string) {
    const me = this.userId;
    await this.must(
      this.db.from('friendships').delete().or(`and(requester_id.eq.${me},addressee_id.eq.${playerId}),and(requester_id.eq.${playerId},addressee_id.eq.${me})`),
      'remove friend',
    );
    await this.load(true);
  }

  // ── Events ──────────────────────────────────────────────────────────────

  async createEvent(input: NewEvent): Promise<string> {
    const dates = input.rounds.map((r) => r.scheduledOn).sort();
    let event: { id: string } | null = null;
    for (let attempt = 0; attempt < 3 && !event; attempt++) {
      const { data, error } = await this.db.from('events').insert({
        kind: input.kind, name: input.name.trim(), organizer_id: this.userId, format: input.format, join_code: makeJoinCode(),
        starts_on: dates[0], ends_on: dates[dates.length - 1] ?? null,
      }).select('id').single();
      if (error && !/join_code/.test(error.message)) throw new Error(`create event: ${error.message}`);
      event = data as { id: string } | null; // retry only on a join-code collision
    }
    if (!event) throw new Error('create event: could not allocate a join code');
    if (input.rounds.length) {
      await this.must(this.db.from('event_rounds').insert(input.rounds.map((r, i) => ({
        event_id: event!.id, seq: i + 1, name: r.name, course_id: r.courseId, tee_id: r.teeId ?? null,
        scheduled_on: r.scheduledOn, tee_time: r.teeTime ?? null, holes: r.holes,
      }))), 'schedule');
    }
    const invite = input.inviteIds.filter((id) => id !== this.userId);
    if (invite.length) {
      await this.must(this.db.from('event_members').insert(invite.map((profile_id) => ({ event_id: event!.id, profile_id, invited_by: this.userId }))), 'invites');
    }
    await this.load(true);
    return event.id;
  }

  async joinEvent(code: string): Promise<string> {
    const { data, error } = await this.db.rpc('join_event', { code });
    if (error) throw new Error(/No event/.test(error.message) ? 'No event with that code.' : error.message);
    await this.load(true);
    return data as string;
  }

  async respondToEvent(eventId: string, accept: boolean) {
    await this.must(this.db.from('event_members').update({ status: accept ? 'joined' : 'declined' }).eq('event_id', eventId).eq('profile_id', this.userId), 'respond');
    await this.load(true);
  }

  async inviteToEvent(eventId: string, playerIds: string[]) {
    if (!playerIds.length) return;
    await this.must(this.db.from('event_members').upsert(playerIds.map((profile_id) => ({ event_id: eventId, profile_id, invited_by: this.userId, status: 'invited' })), { onConflict: 'event_id,profile_id', ignoreDuplicates: true }), 'invite');
    await this.load(true);
  }

  async leaveEvent(eventId: string) {
    await this.must(this.db.from('event_members').delete().eq('event_id', eventId).eq('profile_id', this.userId), 'leave');
    await this.load(true);
  }

  async deleteEvent(eventId: string) {
    await this.must(this.db.from('events').delete().eq('id', eventId), 'delete event');
    await this.load(true);
  }

  async setPairings(eventRoundId: string, pairs: [string, string][]) {
    await this.must(this.db.from('event_matches').delete().eq('event_round_id', eventRoundId), 'clear pairings');
    if (pairs.length) {
      await this.must(this.db.from('event_matches').insert(pairs.map(([a, b]) => ({ event_round_id: eventRoundId, player_a: a, player_b: b }))), 'pairings');
    }
    await this.load(true);
  }
}
