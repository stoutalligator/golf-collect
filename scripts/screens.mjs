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

/** name → route. Sample data is deterministic, so these ids are stable. */
const SCREENS = [
  ['01-splash', '/?splash=hold'],
  ['02-home-feed', '/'],
  ['03-courses', '/courses'],
  ['04-course-detail', '/course/keney-park'],
  ['05-scorecard', '/round/sample-30'],
  ['06-friend-round', '/round/f-mike-01'],
  ['07-stats', '/stats'],
  ['08-stats-rounds', '/stats?view=rounds'],
  ['09-trophy-room', '/collection'],
  ['10-collection-case', '/collection/ball-marker'],
  ['11-collectible-detail', '/collectible/keney-park/patch'],
  ['12-badges', '/achievements'],
  ['13-badge-detail', '/achievement/break-90'],
  ['14-profile', '/profile'],
  ['15-friend-profile', '/player/f-dana'],
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

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: SCALE, isMobile: true, hasTouch: true });
  for (const [name, route] of SCREENS) {
    const url = `${BASE}${route}${route.includes('?') ? '&' : '?'}phone=1`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2600)); // launch overlay fades at ~1.75s
    const file = join(OUT, `${name}.png`);
    await page.screenshot({ path: file });
    console.log(`✓ ${file}`);
  }
} finally {
  await browser.close();
}
