/**
 * A minimal `classnames`-style helper.
 *
 * Accepts strings, arrays, and objects whose keys are class names mapped
 * to a truthy/falsy flag. Falsy values are skipped, the result is a
 * single space-separated string.
 *
 * @example
 *   cx('btn', isActive && 'btn--active', { 'btn--lg': size === 'lg' })
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, unknown>
  | ClassValue[];

export function cx(...values: ClassValue[]): string {
  const out: string[] = [];

  const push = (value: ClassValue) => {
    if (!value) return;
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    if (typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (value[key]) out.push(key);
      }
    }
  };

  values.forEach(push);
  return out.join(' ');
}
