import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '@/i18n'
import { cn } from '@/utils/cn'

/** The public repository. Fixed on purpose: it is the project's own source. */
export const REPOSITORY_URL = 'https://github.com/codahhh/i-have-been-leaked'

/**
 * GitHub mark, inline.
 *
 * lucide dropped brand icons, and pulling a whole icon package in for one path
 * is not worth it: this is the official 16px octocat silhouette, drawn with
 * `currentColor` so it inherits the surrounding text colour.
 */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

/**
 * Quiet "star this project" prompt.
 *
 * Sits above the search form, because the code is the reason a privacy tool can
 * be audited at all. A pill rather than a banner: it must stay subordinate to
 * the checker, which is what visitors came for.
 */
export function GitHubStar({ className }: { className?: string }) {
  const { t } = useI18n()

  return (
    <a
      href={REPOSITORY_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('star.aria')}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1.5 text-[12.5px] leading-none text-muted transition-colors hover:border-brand/40 hover:bg-rail hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base',
        className,
      )}
    >
      <GitHubMark className="h-3.5 w-3.5 shrink-0" />
      <span>{t('star.label')}</span>
      <ArrowUpRight
        className="h-3 w-3 text-faint transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
        aria-hidden
      />
    </a>
  )
}
