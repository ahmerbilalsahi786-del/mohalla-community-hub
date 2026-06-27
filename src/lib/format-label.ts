export function titleCaseWord(value?: string | null) {
  const text = value?.trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function titleCaseWords(value?: string | null) {
  return value
    ?.split(/\s+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(' ') ?? ''
}
