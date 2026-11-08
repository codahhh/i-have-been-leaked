/** Tiny class-name joiner — avoids pulling in `clsx` for six lines. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}
