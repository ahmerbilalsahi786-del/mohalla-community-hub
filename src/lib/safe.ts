export function safeArray<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

export function safeString(value: string | null | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function safeNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
