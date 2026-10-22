const SETTINGS_KEY = "commerce-toolkit-settings"
const MAX_VALUE_BYTES = 2 * 1024
const MAX_TOTAL_BYTES = 4 * 1024

export function byteLength(str: string): number {
  return new TextEncoder().encode(str).length
}

function loadAll(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {}
}

export function saveSlice(
  tabKey: string,
  data: unknown,
  onError?: (msg: string) => void
): void {
  const valueStr = JSON.stringify(data)
  if (byteLength(valueStr) > MAX_VALUE_BYTES) {
    onError?.(`This setting exceeds the 2 KB per-section limit (${byteLength(valueStr)} bytes).`)
    return
  }
  const current = loadAll()
  const merged = { ...current, [tabKey]: data }
  const str = JSON.stringify(merged)
  const bytes = byteLength(str)
  if (bytes > MAX_TOTAL_BYTES) {
    onError?.(`Total settings too large (${bytes} bytes / 4 KB limit).`)
    return
  }
  try {
    localStorage.setItem(SETTINGS_KEY, str)
  } catch (e) {
    onError?.(e instanceof Error ? e.message : "Failed to save settings")
  }
}

export function loadSlice<T>(tabKey: string): T | null {
  const all = loadAll()
  return (all[tabKey] as T) ?? null
}
