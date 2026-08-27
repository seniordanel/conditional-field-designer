/** Short, collision-unlikely client-side id. A real backend would assign these. */
export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
