/**
 * Derives a quiet "age caption" (e.g. "1st month", "2nd year") for a photo
 * relative to the earliest dated photo in its set.
 *
 * There is no birth-date field in the data model (see `types/index.ts` —
 * `Photo` only carries `created_time`), so this uses the earliest
 * `created_time` across the photo set as a reasonable proxy "start" date
 * rather than inventing a birth-date field. This is a judgment call: for a
 * baby/child chapter whose earliest photos are close to the start of that
 * chapter's timeline, the derived captions read naturally; it will not be
 * exactly accurate if the very first photo in the set was captured well
 * after the true reference date.
 */

export function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  const rem10 = n % 10
  const suffix = rem10 === 1 ? 'st' : rem10 === 2 ? 'nd' : rem10 === 3 ? 'rd' : 'th'
  return `${n}${suffix}`
}

export interface AgeCaption {
  /** e.g. "6th month" / "2nd year" */
  label: string
  /** Months elapsed since the reference start date — used for chronological sort/grouping. */
  monthsElapsed: number
}

/** Earliest valid `created_time` in a list of ISO date strings, or null if none. */
export function earliestDate(isoDates: Array<string | null | undefined>): Date | null {
  let earliest: Date | null = null
  for (const iso of isoDates) {
    if (!iso) continue
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) continue
    if (!earliest || d < earliest) earliest = d
  }
  return earliest
}

export function ageCaption(photoDate: Date, startDate: Date): AgeCaption {
  const months = Math.max(
    (photoDate.getFullYear() - startDate.getFullYear()) * 12 +
      (photoDate.getMonth() - startDate.getMonth()),
    0,
  )
  if (months < 12) {
    return { label: `${ordinal(months + 1)} month`, monthsElapsed: months }
  }
  const years = Math.floor(months / 12) + 1
  return { label: `${ordinal(years)} year`, monthsElapsed: months }
}

/** Short, quiet date display for hover metadata, e.g. "Jun 2019". */
export function shortDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/** Full, literal date display, e.g. "Aug 29, 2021" — used where a precise
 * (not month-only) date is meaningful, e.g. the Memories "on this day" flow. */
export function fullDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Full, precise date-range label for a real album `start_date`/`end_date`
 * pair (PR 7 metadata fields — day-precision, unlike the photo-capture-
 * derived `dateRangeLabel` below), e.g. "May 10 – May 17, 2024" (board 4's
 * own example) or "Dec 25, 2025" for a single date. Either field may be
 * absent; returns undefined only when both are. Never fabricates a date —
 * only formats what the caller actually has.
 */
export function explicitDateRangeLabel(
  startIso?: string | null,
  endIso?: string | null,
): string | undefined {
  const start = startIso ? new Date(startIso) : null
  const end = endIso ? new Date(endIso) : null
  const validStart = start && !Number.isNaN(start.getTime()) ? start : null
  const validEnd = end && !Number.isNaN(end.getTime()) ? end : null
  if (!validStart && !validEnd) return undefined

  if (validStart && validEnd) {
    if (validStart.getTime() === validEnd.getTime()) {
      return validStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    const sameYear = validStart.getFullYear() === validEnd.getFullYear()
    const startLabel = validStart.toLocaleDateString(
      'en-US',
      sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' },
    )
    const endLabel = validEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startLabel} – ${endLabel}`
  }

  const only = (validStart ?? validEnd)!
  return only.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Latest valid `created_time` in a list of ISO date strings, or null if none. */
export function latestDate(isoDates: Array<string | null | undefined>): Date | null {
  let latest: Date | null = null
  for (const iso of isoDates) {
    if (!iso) continue
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) continue
    if (!latest || d > latest) latest = d
  }
  return latest
}

/**
 * Quiet date-range label derived from real photo capture dates, e.g.
 * "Summer 2025" is NOT attempted (too much invention) — this stays literal:
 * "Jul 2025" for a single month, "2024 – 2025" for a span, or just the
 * single dated month when start/end land in the same month. Returns
 * undefined when no photo in the set has a usable `created_time` (never
 * fabricates a date for undated media — see Travel/Milestones in
 * `docs/redesign/STATE.md` PR 6 notes).
 */
export function dateRangeLabel(isoDates: Array<string | null | undefined>): string | undefined {
  const start = earliestDate(isoDates)
  const end = latestDate(isoDates)
  if (!start || !end) return undefined
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return startLabel
  }
  if (start.getFullYear() === end.getFullYear()) {
    return String(start.getFullYear())
  }
  return `${start.getFullYear()} – ${end.getFullYear()}`
}
