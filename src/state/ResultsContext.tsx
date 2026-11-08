import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { EmailCheckResponse } from '@/types'

export interface EmailResultState {
  email: string
  result: EmailCheckResponse
}

interface ResultsContextValue {
  emailResult: EmailResultState | null
  setEmailResult: (value: EmailResultState) => void
  clearEmailResult: () => void
}

const ResultsContext = createContext<ResultsContextValue | null>(null)

/**
 * In-memory store for the current lookup result.
 *
 * Deliberately *not* persisted: no sessionStorage, no localStorage, no URL
 * parameter, no history state. A refresh or a new tab loses the result, which
 * is exactly the intended behaviour for personal search data.
 */
export function ResultsProvider({ children }: { children: ReactNode }) {
  const [emailResult, setValue] = useState<EmailResultState | null>(null)

  const setEmailResult = useCallback((value: EmailResultState) => setValue(value), [])
  const clearEmailResult = useCallback(() => setValue(null), [])

  const value = useMemo(
    () => ({ emailResult, setEmailResult, clearEmailResult }),
    [emailResult, setEmailResult, clearEmailResult],
  )

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>
}

export function useResults(): ResultsContextValue {
  const context = useContext(ResultsContext)
  if (!context) throw new Error('useResults must be used inside <ResultsProvider>')
  return context
}
