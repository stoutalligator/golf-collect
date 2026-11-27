/**
 * Core domain types. Pure data, no React. Persisted shapes are kept
 * backend-agnostic so a remote repository can replace local storage later.
 */

export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string;

// ── Courses ────────────────────────────────────────────────────────────────

export type CourseAccess = 'public' | 'municipal' | 'semi-private' | 'private';

/** Terrain type. Tagged per course from research; not yet used for art (heroes vary by region). */
export type Biome = 'parkland' | 'coastal' | 'links' | 'mountain' | 'desert' | 'lakeside' | 'prairie' | 'lowcountry';

export type Gender = 'men' | 'women';

export interface TeeRating {
  rating: number;
  slope: number;
}

export interface Tee {
  id: string; // stable within a course, e.g. "blue"
  name: string; // display name, e.g. "Blue"
  par: number;
  totalYards: number;
  /** Hole-by-hole yardage (one per real hole: 9 or 18), or null if no trustworthy breakdown exists. */
  yardages: number[] | null;
  ratings: Partial<Record<Gender, TeeRating>>;
  /** 9-hole courses: whether `ratings` are for the nine (9) or for playing it twice (18). Default 18. */
  ratedHoles?: 9 | 18;
}

export interface Hole {
  number: number; // 1..18
  par: number;
  /** Men's stroke index (1 = hardest). */
  handicap: number;
}

export type VerificationStatus =
  /** Matches the course's own published scorecard. */
  | 'official'
  /** Two independent sources agree. */
  | 'cross-checked'
  /** One source, internally consistent (par/stroke-index/totals checks pass). */
  | 'single-source';

export interface CourseSource {
  name: string;
  url: string;
  checked: ISODate;
  license?: string;
}

export interface CourseVerification {
  status: VerificationStatus;
  sources: CourseSource[];
  notes: string[];
}

export interface Course {
  id: string; // slug
  name: string;
  city: string;
  state: string; // USPS code
  county?: string;
  /** Region id from src/data/config/regions.json (derived from state). Drives shared hero/vignette art. */
  region: string;
  /** Researched terrain tag; omitted until researched. */
  biome?: Biome;
  biomeSource?: { name: string; url: string; note: string };
  access: CourseAccess;
  location: { lat: number; lng: number };
  website?: string;
  architect?: string;
  yearOpened?: number;
  /** Short description written by us from verified facts — never copied text. */
  description: string;
  holes: Hole[];
  tees: Tee[];
  verification: CourseVerification;
  /** Optional facets used by achievements, e.g. "national-park". */
  tags?: string[];
}

/**
 * Lightweight course listing (no holes or tees). The app downloads the index of every course and loads full
 * `Course` scorecards on demand, so new courses in the database appear without an app update.
 */
export interface CourseSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  county?: string;
  region: string;
  access: CourseAccess;
  location: { lat: number; lng: number };
  par: number;
  holeCount: number;
}

export const summarizeCourse = (c: Course): CourseSummary => ({
  id: c.id, name: c.name, city: c.city, state: c.state, county: c.county, region: c.region, access: c.access,
  location: c.location, par: c.holes.reduce((s, h) => s + h.par, 0), holeCount: c.holes.length,
});

// ── Simulator ──────────────────────────────────────────────────────────────

export interface SimCourse {
  id: string;
  name: string;
  platform?: string;
  holes: Hole[];
}

// ── Players & rounds ───────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  initials: string;
  username?: string;
  homeState?: string;
  isMe?: boolean;
  memberSince?: ISODate;
  /** Home course id (real course). */
  homeCourseId?: string;
  /** Short bio line shown on profiles. */
  tagline?: string;
  /** Profile photo (public URL); initials show when there's none. */
  avatarUrl?: string;
}

// ── Collection ─────────────────────────────────────────────────────────────

export type CollectibleItem = 'bag-tag' | 'ball-marker' | 'pitch-marker' | 'patch' | 'pin';
export type CollectibleCategory = 'bag-tags' | 'markers' | 'patches' | 'pins';
export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

/** Where a missed shot finished: left, right, short of the target, or long (past / through it). */
export type MissDirection = 'left' | 'right' | 'short' | 'long';
/** Tee shot on a par 4 or 5: in the fairway, or where it missed. */
export type FairwayResult = 'hit' | MissDirection;
/** Approach: green in regulation ('hit'), or where it missed the green. */
export type GreenResult = 'hit' | MissDirection;

/** Only `strokes` is required; every other stat is optional and `undefined` means "not entered". */
export interface HoleScore {
  strokes: number;
  putts?: number;
  fairway?: FairwayResult;
  /** Green in regulation, or the miss direction. Sets GIR when entered (and `gir` is kept in step for older builds). */
  green?: GreenResult;
  /** Explicit GIR override; otherwise derived from `green`, then from strokes/putts. */
  gir?: boolean;
  penalties?: number;
  chips?: number;
  sandShots?: number;
  /** Who last entered this hole's strokes (set by the server; shared scoring while playing). */
  enteredBy?: string;
}

export type RoundKind = 'course' | 'sim';
export type RoundStatus = 'active' | 'complete';

export interface Round {
  id: string;
  /** Whose round this is (the player whose scorecard it is). Omitted = the signed-in user ("me"). */
  ownerId?: string;
  kind: RoundKind;
  /** Course id when kind === 'course'; SimCourse id when kind === 'sim'. */
  courseId: string;
  teeId?: string;
  date: ISODate;
  status: RoundStatus;
  /** Which holes are played, e.g. 1..18, 1..9 or 10..18. */
  holeNumbers: number[];
  playerIds: string[];
  /** Keyed by player id; index i corresponds to holeNumbers[i]. Missing = not yet played. */
  scores: Record<string, (HoleScore | null)[]>;
  competitionId?: string;
  /** League/tournament/scheduled round this round counts toward (see domain/competition). */
  eventRoundId?: string;
  /** Someone else keeping this round's score from their phone (group scoring). Omitted = the owner. */
  scoredBy?: string;
  /** Rounds scored together on one phone share a group id. */
  groupId?: string;
  /** Team scramble: one team score per hole, teammates in playerIds. Never counts toward handicap, stats,
   *  collectibles or badges. Omitted = an individual round. */
  format?: 'scramble';
  createdAt: ISODateTime;
  completedAt?: ISODateTime;
}

/** Owner of a round ("me" when omitted). */
export const roundOwner = (r: Round): string => r.ownerId ?? 'me';

/** Rounds that count toward handicap, stats, collectibles and badges (scrambles don't). */
export const countsForStats = (r: Pick<Round, 'format'>): boolean => r.format !== 'scramble';

/**
 * Rounds played together share a group: a scorekeeper's group (`groupId` on every round), or a friend who added
 * their own scores to your round afterwards (their `groupId` is your round's id). Every round is in its own group.
 */
export const roundGroupKey = (r: Round): string => r.groupId ?? r.id;

// ── Social ─────────────────────────────────────────────────────────────────

export const REACTIONS = ['👏', '🔥', '⛳', '😂'] as const;
export type ReactionEmoji = (typeof REACTIONS)[number];

export interface Reaction {
  playerId: string;
  emoji: ReactionEmoji;
}

export interface Comment {
  id: string;
  playerId: string;
  text: string;
  at: ISODateTime;
}

/** Reactions and comments, keyed by round id (each completed round is one feed post). */
export interface SocialState {
  reactions: Record<string, Reaction[]>;
  comments: Record<string, Comment[]>;
}
