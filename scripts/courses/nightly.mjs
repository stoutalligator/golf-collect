// Nightly course fetch: continues a region's build after the API quota resets, imports what's done into
// Supabase, and removes its own Windows scheduled task once the region is complete.
//
//   node scripts/courses/nightly.mjs [region]          (default: new-england)
//
// Registered by scripts/courses/schedule-nightly.ps1 as the "GreensKeeper Course Fetch" task.
// Output is appended to scripts/courses/.cache/nightly.log.
import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

import { cacheDir, root } from './lib.mjs';

const region = process.argv[2] ?? 'new-england';
const TASK = 'GreensKeeper Course Fetch';
const log = (msg) => appendFileSync(join(cacheDir, 'nightly.log'), `[${new Date().toISOString()}] ${msg}\n`);

function run(args) {
  const res = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  log(`$ node ${args.join(' ')} → exit ${res.status}\n${(res.stdout ?? '').trim()}\n${(res.stderr ?? '').trim()}`.trim());
  return res.status;
}

log(`--- nightly run for ${region} ---`);
const build = run(['scripts/courses/build-seed.mjs', '--region', region]);
if (build !== 0 && build !== 3) {
  log('Build failed; leaving the task in place to retry tomorrow.');
  process.exitCode = 1;
} else {
  const imported = run(['--env-file=.env', 'scripts/db/import-courses.ts']);
  if (imported !== 0) {
    log('Import failed; leaving the task in place to retry tomorrow.');
    process.exitCode = 1;
  } else if (build === 0) {
    log(`${region} complete and imported. Removing the scheduled task.`);
    spawnSync('schtasks', ['/Delete', '/TN', TASK, '/F'], { encoding: 'utf8' });
  } else {
    log('Quota reached; will continue after the next reset.');
  }
}
