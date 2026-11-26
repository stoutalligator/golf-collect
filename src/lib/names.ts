/** Short display name used on collectibles ("Keney Park Golf Course" → "Keney Park"). Mirrors scripts/art/art.mjs. */
export function shortCourseName(name: string): string {
  return name
    .replace(/\s*\(.*\)$/, '')
    .replace(/\s+(Golf Course|Golf Club|Golf Links|Country Club|Course)$/i, '')
    .trim();
}
