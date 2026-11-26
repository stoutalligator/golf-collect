// Lets Node run the app's TypeScript sample-data modules directly: resolves the `@/` alias to src/ and
// adds `.ts` to extensionless relative imports. Usage: node --import ./scripts/db/register.mjs <script.ts>
import { register } from 'node:module';

register('./resolve-hooks.mjs', import.meta.url);
