const toCamelKey = (k: string) =>
  k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const toSnakeKey = (k: string) =>
  k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function convert(value: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, fn));
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [fn(k), convert(v, fn)]),
    );
  }
  return value;
}

/** DB rows use snake_case columns; the API speaks camelCase. */
export const camelize = <T = unknown>(value: unknown) =>
  convert(value, toCamelKey) as T;

/** Converts a camelCase DTO to column names, dropping undefined fields. */
export function toColumns(dto: object): Record<string, unknown> {
  const clean = Object.fromEntries(
    Object.entries(dto).filter(([, v]) => v !== undefined),
  );
  return convert(clean, toSnakeKey) as Record<string, unknown>;
}
