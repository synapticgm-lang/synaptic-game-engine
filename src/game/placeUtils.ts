/**
 * Utility functions for place ID generation.
 * Extracted to break circular dependency between places.ts and worldMapAuthority.ts.
 */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'place';
}

export function placeIdFromName(name: string): string {
  return `place_${slugify(name)}`;
}
