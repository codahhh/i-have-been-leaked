import { Fragment, type ReactNode } from 'react'

/**
 * Renders `text` with every case-insensitive occurrence of `highlight` wrapped
 * in a styled element. Keeps translations free of markup while still allowing
 * one accented word in a headline.
 */
export function HighlightedText({
  text,
  highlight,
  className = 'text-brand',
  as: Tag = 'span',
}: {
  text: string
  highlight?: string
  className?: string
  as?: 'span' | 'strong'
}): ReactNode {
  if (!highlight) return <>{text}</>

  const needle = highlight.toLowerCase()
  const haystack = text.toLowerCase()
  const parts: ReactNode[] = []
  let cursor = 0
  let index = haystack.indexOf(needle)

  if (index === -1) return <>{text}</>

  let key = 0
  while (index !== -1) {
    if (index > cursor) parts.push(<Fragment key={key++}>{text.slice(cursor, index)}</Fragment>)
    parts.push(
      <Tag key={key++} className={className}>
        {text.slice(index, index + highlight.length)}
      </Tag>,
    )
    cursor = index + highlight.length
    index = haystack.indexOf(needle, cursor)
  }
  if (cursor < text.length) parts.push(<Fragment key={key++}>{text.slice(cursor)}</Fragment>)

  return <>{parts}</>
}
