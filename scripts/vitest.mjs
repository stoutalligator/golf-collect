// Runs vitest from the canonical-case working directory. On Windows a lowercase
// drive letter (c:\ vs C:\) makes vitest load two module instances and fail.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';

const cwd = realpathSync.native(process.cwd());
const bin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const res = spawnSync(bin, ['vitest', ...process.argv.slice(2)], { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(res.status ?? 1);
