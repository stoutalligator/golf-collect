import { existsSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const src = resolvePath(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const hasExt = /\.(?:[cm]?[jt]sx?|json)$/;

export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith('@/')) base = resolvePath(src, specifier.slice(2));
  else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith('file:') && !hasExt.test(specifier)) {
    base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base) {
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, resolvePath(base, 'index.ts')]) {
      if (hasExt.test(candidate) && existsSync(candidate)) return next(pathToFileURL(candidate).href, context);
    }
  }
  return next(specifier, context);
}
