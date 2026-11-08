import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { I18nProvider } from '@/i18n'
import { ResultsProvider } from '@/state/ResultsContext'
import { EmailChecker } from '@/pages/EmailChecker'
import { Results } from '@/pages/Results'
import { UsernameChecker } from '@/pages/UsernameChecker'
import { PhoneChecker } from '@/pages/PhoneChecker'
import { PasswordChecker } from '@/pages/PasswordChecker'
import { About } from '@/pages/About'
import { Documentation } from '@/pages/Documentation'
import { NotFound } from '@/pages/NotFound'
import { SecurityRecommendations } from '@/components/SecurityRecommendations'
import { ProviderStatus } from '@/components/ProviderStatus'
import type { CheckResponse, ProviderResult } from '@/types'

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>
        <ResultsProvider>{children}</ResultsProvider>
      </I18nProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            providers: [
              {
                id: 'xposedornot',
                displayName: 'XposedOrNot',
                coverage: 'Open breach index.',
                homepage: 'https://xposedornot.com',
                lookups: ['email'],
                configured: true,
                activeForEmail: true,
                activeForUsername: false,
                activeForPhone: false,
              },
              {
                id: 'leakcheck',
                displayName: 'LeakCheck',
                coverage: 'Public API over leaked records.',
                homepage: 'https://leakcheck.io',
                lookups: ['email', 'username', 'phone'],
                configured: true,
                activeForEmail: true,
                activeForUsername: true,
                activeForPhone: true,
              },
            ],
            emailProviders: ['xposedornot', 'leakcheck'],
            usernameProviders: ['leakcheck'],
            phoneProviders: ['leakcheck'],
            passwordRangeAvailable: true,
          }),
          { status: 200 },
        ),
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('checker pages', () => {
  it('renders the email checker with its disclosure', () => {
    render(
      <Providers>
        <EmailChecker />
      </Providers>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Vérification d’adresse e-mail',
    )
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getByText('Avant l’envoi : qui reçoit votre adresse ?')).toBeInTheDocument()
  })

  it('renders the username checker with its disclosure', () => {
    render(
      <Providers>
        <UsernameChecker />
      </Providers>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Vérification de nom d’utilisateur',
    )
    expect(screen.getByText('Ce qui est envoyé')).toBeInTheDocument()
    // Coverage is narrower than for email addresses, and that is stated.
    expect(screen.getByText('Une couverture plus étroite que l’e-mail')).toBeInTheDocument()
  })

  it('validates a username before querying anything', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.mocked(fetch)
    render(
      <Providers>
        <UsernameChecker />
      </Providers>,
    )

    await user.type(screen.getByLabelText('Nom d’utilisateur'), 'a')
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))
    expect(await screen.findByText(/Le pseudo doit contenir 3 à 64/)).toBeInTheDocument()
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes('/api/check-username'))).toBe(
      false,
    )
  })

  it('requires consent, then runs a real username lookup', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes('/api/check-username')) {
        return new Response(
          JSON.stringify({
            kind: 'username',
            ok: true,
            state: 'breached',
            checkedAt: '2026-11-08T10:00:00.000Z',
            totalBreaches: 1,
            breaches: [],
            providers: [],
            respondingProviders: 1,
            totalProviders: 1,
            durationMs: 900,
          }),
          { status: 200 },
        )
      }
      return new Response('{}', { status: 404 })
    })

    render(
      <Providers>
        <UsernameChecker />
      </Providers>,
    )

    const input = screen.getByLabelText('Nom d’utilisateur')
    await user.type(input, 'known-user')

    // No consent yet: the request must never leave the browser.
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))
    expect(
      await screen.findByText('Cochez la case de consentement pour continuer.'),
    ).toBeInTheDocument()
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('/api/check-username')),
    ).toBe(false)

    // With consent, the real endpoint is called with the username only.
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    const call = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/api/check-username'))
    expect(call).toBeDefined()
    expect(JSON.parse(String((call?.[1] as RequestInit).body))).toEqual({
      username: 'known-user',
      consent: true,
    })
  })

  it('validates a phone number and shows the E.164 form', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <PhoneChecker />
      </Providers>,
    )

    // The default country follows the browser locale; pick France explicitly.
    await user.selectOptions(screen.getByLabelText('Pays'), 'FR')

    const input = screen.getByLabelText('Numéro de téléphone')
    await user.type(input, '0612345678')
    expect(await screen.findByText(/\+33612345678/)).toBeInTheDocument()
  })

  it('requires consent, then sends the E.164 number without the plus', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes('/api/check-phone')) {
        return new Response(
          JSON.stringify({
            kind: 'phone',
            ok: true,
            state: 'breached',
            checkedAt: '2026-11-08T10:00:00.000Z',
            totalBreaches: 1,
            breaches: [],
            providers: [],
            respondingProviders: 1,
            totalProviders: 1,
            durationMs: 700,
          }),
          { status: 200 },
        )
      }
      return new Response('{}', { status: 404 })
    })

    render(
      <Providers>
        <PhoneChecker />
      </Providers>,
    )

    await user.selectOptions(screen.getByLabelText('Pays'), 'FR')
    await user.type(screen.getByLabelText('Numéro de téléphone'), '0612345678')

    // Without consent the request never leaves the browser.
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))
    expect(
      await screen.findByText('Cochez la case de consentement pour continuer.'),
    ).toBeInTheDocument()
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('/api/check-phone')),
    ).toBe(false)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    const call = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/api/check-phone'))
    expect(call).toBeDefined()
    expect(JSON.parse(String((call?.[1] as RequestInit).body))).toEqual({
      phone: '+33612345678',
      consent: true,
    })
  })

  it('rejects an invalid phone number with a translated error', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <PhoneChecker />
      </Providers>,
    )

    await user.type(screen.getByLabelText('Numéro de téléphone'), '12')
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))
    expect(
      await screen.findByText(/Ce numéro n’est pas valide pour le pays sélectionné/),
    ).toBeInTheDocument()
  })

  it('renders the password checker with the k-anonymity explainer', () => {
    render(
      <Providers>
        <PasswordChecker />
      </Providers>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Votre mot de passe a-t-il déjà fuité ?',
    )
    expect(screen.getAllByText('Le k-anonymat, concrètement').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Mot de passe à vérifier')).toHaveAttribute('type', 'password')
  })
})

describe('results page', () => {
  it('redirects to the form when no in-memory result exists', () => {
    render(
      <MemoryRouter initialEntries={['/check/email/results']}>
        <I18nProvider>
          <ResultsProvider>
            <Results kind="email" />
          </ResultsProvider>
        </I18nProvider>
      </MemoryRouter>,
    )
    // <Navigate> to /check/email leaves nothing rendered here: no result leak.
    expect(screen.queryByText(/Résultat pour/)).not.toBeInTheDocument()
  })
})

describe('static pages', () => {
  it('renders the about page', () => {
    render(
      <Providers>
        <About />
      </Providers>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('À propos')
    expect(screen.getByText(/Pourquoi cet outil/)).toBeInTheDocument()
  })

  it('renders the documentation with the internal API', () => {
    render(
      <Providers>
        <Documentation />
      </Providers>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Documentation')
    expect(screen.getAllByText('Aucune clé d’API requise').length).toBeGreaterThan(0)
  })

  it('renders the not-found page', () => {
    render(
      <Providers>
        <NotFound />
      </Providers>,
    )
    expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()
  })
})

describe('ProviderStatus', () => {
  const providers: ProviderResult[] = [
    {
      provider: 'xposedornot',
      displayName: 'XposedOrNot',
      status: 'ok',
      responded: true,
      breaches: [],
      exposedCategories: [],
      error: null,
      queriedAt: '2026-11-08T10:00:00.000Z',
      durationMs: 300,
    },
    {
      provider: 'leakcheck',
      displayName: 'LeakCheck',
      status: 'timeout',
      responded: false,
      breaches: [],
      exposedCategories: [],
      error: { code: 'timeout', detail: 'Provider did not answer before the deadline.', retryAfterSeconds: null },
      queriedAt: '2026-11-08T10:00:00.000Z',
      durationMs: 6000,
    },
  ]

  it('distinguishes the source that answered from the one that did not', () => {
    render(
      <Providers>
        <ProviderStatus providers={providers} />
      </Providers>,
    )
    // Exactly one "answered" label per healthy source: the status badge.
    expect(screen.getAllByText('A répondu').length).toBe(1)
    expect(screen.getByText('Délai dépassé')).toBeInTheDocument()
    expect(screen.getAllByText('N’a pas répondu').length).toBeGreaterThan(0)
    expect(screen.getByText('Le fournisseur n’a pas répondu dans le délai imparti.')).toBeInTheDocument()
  })
})

describe('SecurityRecommendations', () => {
  it('lists the five recommendations and the disclaimer', () => {
    render(
      <Providers>
        <SecurityRecommendations />
      </Providers>,
    )
    expect(screen.getByText('Changez les mots de passe concernés')).toBeInTheDocument()
    expect(screen.getByText('Ne réutilisez jamais un mot de passe')).toBeInTheDocument()
    expect(screen.getByText('Activez la double authentification')).toBeInTheDocument()
    expect(screen.getByText('Méfiez-vous des messages ciblés')).toBeInTheDocument()
    expect(screen.getByText('Utilisez un gestionnaire de mots de passe')).toBeInTheDocument()
    expect(screen.getByText(/ne remplacent pas l’avis d’un professionnel/)).toBeInTheDocument()
  })
})

// Keeps the fixture type honest if the response shape ever changes.
export type { CheckResponse }
