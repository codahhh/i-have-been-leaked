import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CheckResponse, LookupKind } from '@/types'

/** The identifier the visitor submitted, plus the verdict for it. */
export interface LookupResultState {
  identifier: string
  result: CheckResponse
}

interface ResultsContextValue {
  getResult: (kind: LookupKind) => LookupResultState | null
  setResult: (kind: LookupKind, value: LookupResultState) => void
  clearResult: (kind: LookupKind) => void
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
  const [results, setResults] = useState<Record<LookupKind, LookupResultState | null>>({
    email: null,
    username: null,
  })

  const setResult = useCallback((kind: LookupKind, value: LookupResultState) => {
    setResults((current) => ({ ...current, [kind]: value }))
  }, [])

  const clearResult = useCallback((kind: LookupKind) => {
    setResults((current) => ({ ...current, [kind]: null }))
  }, [])

  const getResult = useCallback((kind: LookupKind) => results[kind], [results])

  const value = useMemo(
    () => ({ getResult, setResult, clearResult }),
    [getResult, setResult, clearResult],
  )

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>
}

export function useResults(): ResultsContextValue {
  const context = useContext(ResultsContext)
  if (!context) throw new Error('useResults must be used inside <ResultsProvider>')
  return context
}
