// Phone-size screenshots of every main screen (iPhone 15/16: 393×852 pt).
// Usage: start the web preview first (`npx expo start --web --port 8099`), then `npm run screens`.
//   SCREENS_URL=http://localhost:8099  CHROME_PATH=...  SCREENS_SCALE=2  SCREENS_OUT=docs/screenshots
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = process.env.SCREENS_URL ?? 'http://localhost:8099';
const OUT = process.env.SCREENS_OUT ?? 'docs/screenshots';
const SCALE = Number(process.env.SCREENS_SCALE ?? 2);
const CHROME = process.env.CHROME_PATH ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p));

// Supabase mode: sign in as the test account (npm run db:seed-test) and use its real round/friend ids.
// Offline demo (no Supabase env): the deterministic sample ids.
try { process.loadEnvFile('.env'); } catch { /* no .env: offline demo */ }
const SUPA = process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.TEST_ACCOUNT_EMAIL;

async function testIds() {
  if (!SUPA) return { mine: 'sample-30', friendRound: 'f-mike-01', friend: 'f-dana' };
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: users } = await db.auth.admin.listUsers({ perPage: 200 });
  const id = (email) => users.users.find((u) => u.email === email)?.id;
  const me = id(process.env.TEST_ACCOUNT_EMAIL);
  const mike = id('mike@greenskeeper.test');
  const latest = async (owner) => (await db.from('rounds').select('id').eq('owner_id', owner).eq('kind', 'course').eq('status', 'complete')
    .order('played_on', { ascending: false }).limit(1).single()).data?.id;
  const oldest = async (owner) => (await db.from('rounds').select('id').eq('owner_id', owner).order('played_on').limit(1).single()).data?.id;
  return { mine: await latest(me), friendRound: await oldest(mike), friend: id('dana@greenskeeper.test') };
}
const ids = await testIds();

/** name → route. */
const SCREENS = [
  ['01-splash', '/?splash=hold'],
  ['02-home-feed', '/'],
  ['03-courses', '/courses'],
  ['04-course-detail', '/course/keney-park'],
  ['05-scorecard', `/round/${ids.mine}`],
  ['06-friend-round', `/round/${ids.friendRound}`],
  ['07-stats', '/stats'],
  ['08-stats-rounds', '/stats?view=rounds'],
  ['09-trophy-room', '/collection'],
  ['10-collection-case', '/collection/ball-marker'],
  ['11-collectible-detail', '/collectible/keney-park/patch'],
  ['12-badges', '/achievements'],
  ['13-badge-detail', '/achievement/break-90'],
  ['14-profile', '/profile'],
  ['15-friend-profile', `/player/${ids.friend}`],
  ['16-friends', '/friends'],
  ['17-log-round', '/round/new?courseId=airways'],
];

if (!CHROME) {
  console.error('Chrome not found. Set CHROME_PATH to your Chrome executable.');
  process.exit(1);
}
try {
  await fetch(BASE);
} catch {
  console.error(`Nothing is running at ${BASE}. Start it with: npx expo start --web --port 8099`);
  process.exit(1);
}

const settle = () => new Promise((r) => setTimeout(r, 2600)); // launch overlay fades at ~1.75s

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: SCALE, isMobile: true, hasTouch: true });
  if (SUPA) {
    // Sign-in screen first, then sign in (the session persists in the page's storage).
    await page.goto(`${BASE}/sign-in?phone=1`, { waitUntil: 'networkidle0' });
    await settle();
    await page.screenshot({ path: join(OUT, '00-sign-in.png') });
    console.log(`✓ ${join(OUT, '00-sign-in.png')}`);
    await page.type('input[aria-label="Email"]', process.env.TEST_ACCOUNT_EMAIL);
    await page.type('input[aria-label="Password"]', process.env.TEST_ACCOUNT_PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('input[aria-label="Password"]'), { timeout: 20000 });
  }
  for (const [name, route] of SCREENS) {
    const url = `${BASE}${route}${route.includes('?') ? '&' : '?'}phone=1`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await settle();
    const file = join(OUT, `${name}.png`);
    await page.screenshot({ path: file });
    console.log(`✓ ${file}`);
  }
} finally {
  await browser.close();
}
