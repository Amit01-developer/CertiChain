/** Safely coerce Express's `string | string[]` param to a plain string. */
export function str(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}
