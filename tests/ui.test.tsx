import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { webcrypto } from 'node:crypto'
import type { ReactNode } from 'react'
import type { EmailCheckResponse, NormalizedBreach, ProviderResult } from '@/types'
import { I18nProvider } from '@/i18n'
import { ResultsProvider } from '@/state/ResultsContext'
import { Home } from '@/pages/Home'
import { Privacy } from '@/pages/Privacy'
import { EmailSearchForm } from '@/components/EmailSearchForm'
import { PasswordSearchForm } from '@/components/PasswordSearchForm'
import { ResultsSummary } from '@/components/ResultsSummary'
import { AppShell } from '@/App'

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

const PROVIDERS_PAYLOAD = {
  providers: [
    {
      id: 'xposedornot',
      displayName: 'XposedOrNot',
      coverage: 'Open breach index.',
      homepage: 'https://xposedornot.com',
      lookups: ['email'],
      configured: true,
      activeForEmail: true,
    },
    {
      id: 'orelys',
      displayName: 'Orelys',
      coverage: 'Secondary source.',
      homepage: 'https://orelys.io',
      lookups: ['email'],
      configured: false,
      activeForEmail: true,
    },
  ],
  emailProviders: ['xposedornot'],
  usernameProviders: [],
  phoneProviders: [],
  passwordRangeAvailable: true,
}

function providerResult(overrides: Partial<ProviderResult> = {}): ProviderResult {
  return {
    provider: 'xposedornot',
    displayName: 'XposedOrNot',
    status: 'ok',
    responded: true,
    breaches: [],
    error: null,
    queriedAt: '2026-11-08T10:00:00.000Z',
    durationMs: 412,
    ...overrides,
  }
}

const ADOBE: NormalizedBreach = {
  id: 'b_adobe-com',
  name: 'Adobe',
  domain: 'adobe.com',
  breachDate: '2013-10-04',
  exposedData: ['Emails', 'Passwords', 'Usernames'],
  source: 'xposedornot',
  sources: ['xposedornot'],
  description: 'Creative Cloud credentials were exposed.',
  pwnCount: 152_445_165,
}

function emailResponse(overrides: Partial<EmailCheckResponse> = {}): EmailCheckResponse {
  return {
    ok: true,
    state: 'clean',
    checkedAt: '2026-11-08T10:00:00.000Z',
    totalBreaches: 0,
    breaches: [],
    providers: [providerResult(), providerResult({ provider: 'orelys', status: 'not_configured', responded: false })],
    respondingProviders: 1,
    totalProviders: 2,
    durationMs: 1200,
    ...overrides,
  }
}

type FetchHandler = (url: string, init?: RequestInit) => Response | Promise<Response>

function stubFetch(handler: FetchHandler) {
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init),
  )
  vi.stubGlobal('fetch', spy)
  return spy
}

/** Default backend: capability matrix + a clean email verdict. */
function stubBackend(emailResponseOverride?: EmailCheckResponse) {
  return stubFetch((url) => {
    if (url.includes('/api/providers')) {
      return new Response(JSON.stringify(PROVIDERS_PAYLOAD), { status: 200 })
    }
    if (url.includes('/api/check-email')) {
      return new Response(JSON.stringify(emailResponseOverride ?? emailResponse()), { status: 200 })
    }
    return new Response('{}', { status: 404 })
  })
}

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
  window.localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/* -------------------------------------------------------------------------- */

describe('Home page', () => {
  it('renders the hero, the four search categories and the email form', () => {
    stubBackend()
    render(
      <Providers>
        <Home />
      </Providers>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Avez-vous été victime d’une fuite ?',
    )
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'E-mail',
      'Pseudo',
      'Téléphone',
      'Mot de passe',
    ])
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
    expect(screen.getByText('Aucune donnée conservée')).toBeInTheDocument()
  })

  it('survives a malformed capability payload instead of crashing', async () => {
    // A proxy error page or a stale deploy can return 200 with a wrong body.
    stubFetch((url) => {
      if (url.includes('/api/providers')) {
        return new Response(JSON.stringify({ unexpected: true }), { status: 200 })
      }
      return new Response(JSON.stringify({ available: false, totalBreaches: 'many' }), { status: 200 })
    })

    render(
      <Providers>
        <Home />
      </Providers>,
    )

    // The hero still renders and the provider block degrades to a notice.
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(
      await screen.findByText('Les statistiques publiques sont momentanément indisponibles. Nous n’affichons pas de chiffres inventés à la place.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('NaN')).not.toBeInTheDocument()
  })

  it('switches the panel to the selected category', async () => {
    stubBackend()
    const user = userEvent.setup()
    render(
      <Providers>
        <Home />
      </Providers>,
    )

    await user.click(screen.getByRole('tab', { name: /Mot de passe/ }))
    expect(screen.getByLabelText('Mot de passe à vérifier')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Pseudo/ }))
    expect(screen.getByLabelText('Nom d’utilisateur')).toBeInTheDocument()
  })
})

describe('Email form', () => {
  it('shows a translated validation error for a malformed address', async () => {
    const fetchSpy = stubBackend()
    const onResult = vi.fn()
    const user = userEvent.setup()

    render(
      <Providers>
        <EmailSearchForm onResult={onResult} />
      </Providers>,
    )

    await user.type(screen.getByLabelText('Adresse e-mail'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(await screen.findByText(/Cette adresse e-mail n’est pas valide/)).toBeInTheDocument()
    expect(onResult).not.toHaveBeenCalled()
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes('check-email'))).toBe(false)
  })

  it('refuses to send anything without explicit consent', async () => {
    const fetchSpy = stubBackend()
    const onResult = vi.fn()
    const user = userEvent.setup()

    render(
      <Providers>
        <EmailSearchForm onResult={onResult} />
      </Providers>,
    )

    await user.type(screen.getByLabelText('Adresse e-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cochez la case de consentement pour continuer.',
    )
    expect(onResult).not.toHaveBeenCalled()
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes('check-email'))).toBe(false)
  })

  it('names the providers in the disclosure and submits once consented', async () => {
    const fetchSpy = stubBackend(emailResponse({ state: 'breached', totalBreaches: 1, breaches: [ADOBE] }))
    const onResult = vi.fn()
    const user = userEvent.setup()

    render(
      <Providers>
        <EmailSearchForm onResult={onResult} />
      </Providers>,
    )

    // Disclosed twice on purpose: explanatory paragraph + consent checkbox.
    expect(screen.getAllByText(/XposedOrNot et Orelys/).length).toBeGreaterThanOrEqual(1)

    await user.type(screen.getByLabelText('Adresse e-mail'), 'User@Example.com ')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1))
    expect(onResult.mock.calls[0][0]).toBe('User@Example.com')

    const call = fetchSpy.mock.calls.find(([url]) => String(url).includes('check-email'))
    expect(call).toBeDefined()
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      email: 'User@Example.com',
      consent: true,
    })
  })

  it('surfaces a rate-limited backend as a translated error', async () => {
    stubFetch((url) => {
      if (url.includes('/api/providers')) {
        return new Response(JSON.stringify(PROVIDERS_PAYLOAD), { status: 200 })
      }
      return new Response(JSON.stringify({ ok: false, error: { code: 'rate_limited' } }), {
        status: 429,
        headers: { 'retry-after': '30' },
      })
    })
    const user = userEvent.setup()
    render(
      <Providers>
        <EmailSearchForm onResult={vi.fn()} />
      </Providers>,
    )

    await user.type(screen.getByLabelText('Adresse e-mail'), 'user@example.com')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Trop de requêtes')
    expect(alert).toHaveTextContent('30 secondes')
  })
})

describe('Password form', () => {
  beforeEach(() => {
    // jsdom has no SubtleCrypto of its own; the node implementation is identical.
    vi.stubGlobal('crypto', webcrypto)
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
  })

  it('reports an exposure and clears the field afterwards', async () => {
    const suffix = '1E4C9B93F3F0682250B6CF8331B7EE68FD8'
    stubFetch((url) => {
      if (url.includes('api.pwnedpasswords.com')) {
        return new Response(`${suffix}:3861\r\n0000000000000000000000000000000000A:0`, {
          status: 200,
        })
      }
      return new Response('{}', { status: 404 })
    })

    const user = userEvent.setup()
    render(
      <Providers>
        <PasswordSearchForm />
      </Providers>,
    )

    const input = screen.getByLabelText('Mot de passe à vérifier')
    await user.type(input, 'password')
    await user.click(screen.getByRole('button', { name: 'Vérifier le mot de passe' }))

    expect(await screen.findByText('Ce mot de passe circule dans des fuites')).toBeInTheDocument()
    // 3861 rendered with the locale's grouping separator.
    expect(screen.getByText((_, element) => {
      const text = element?.textContent ?? ''
      return text.replace(/\D/g, '') === '3861' && text.length <= 8
    })).toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(screen.getByText('Le champ a été vidé après la vérification.')).toBeInTheDocument()
    expect(window.localStorage.length).toBe(0)
  })

  it('never claims a password is safe', async () => {
    stubFetch(() => new Response('11111111111111111111111111111111111:12', { status: 200 }))
    const user = userEvent.setup()
    render(
      <Providers>
        <PasswordSearchForm />
      </Providers>,
    )

    await user.type(screen.getByLabelText('Mot de passe à vérifier'), 'password')
    await user.click(screen.getByRole('button', { name: 'Vérifier le mot de passe' }))

    expect(await screen.findByText('Aucune correspondance connue')).toBeInTheDocument()
    expect(
      screen.getByText(/ne garantit pas que le mot de passe soit sûr/),
    ).toBeInTheDocument()
  })

  it('can hide and show the typed password', async () => {
    stubFetch(() => new Response('{}', { status: 404 }))
    const user = userEvent.setup()
    render(
      <Providers>
        <PasswordSearchForm />
      </Providers>,
    )

    const input = screen.getByLabelText('Mot de passe à vérifier')
    await user.type(input, 'hunter2')
    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: "Afficher le mot de passe" }))
    expect(input).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Effacer' }))
    expect(input).toHaveValue('')
  })
})

describe('Results summary states', () => {
  const cases = [
    {
      name: 'breached is red and counts the breaches',
      result: emailResponse({ state: 'breached', totalBreaches: 2, breaches: [ADOBE, ADOBE] }),
      expected: '2 fuites trouvées',
      state: 'breached',
    },
    {
      name: 'clean is green but hedged',
      result: emailResponse({ state: 'clean' }),
      expected: 'Aucune correspondance trouvée',
      state: 'clean',
    },
    {
      name: 'incomplete is amber',
      result: emailResponse({ state: 'incomplete' }),
      expected: 'Résultat incomplet',
      state: 'incomplete',
    },
    {
      name: 'error never implies safety',
      result: emailResponse({ state: 'error', ok: false }),
      expected: 'Vérification impossible',
      state: 'error',
    },
  ]

  it.each(cases)('$name', ({ result, expected, state }) => {
    const { container } = render(
      <Providers>
        <ResultsSummary result={result} email="user@example.com" />
      </Providers>,
    )

    expect(screen.getByText(expected)).toBeInTheDocument()
    expect(container.querySelector(`[data-state="${state}"]`)).not.toBeNull()
  })

  it('reports how many sources actually answered', () => {
    render(
      <Providers>
        <ResultsSummary result={emailResponse({ respondingProviders: 1, totalProviders: 2 })} email="a@b.co" />
      </Providers>,
    )
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })
})

describe('Application shell', () => {
  it('switches the whole interface to English and stores only the locale', async () => {
    stubBackend()
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/privacy']}>
        <AppShell />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Politique de confidentialité',
    )

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Privacy policy')
    expect(screen.getAllByRole('link', { name: 'Password' }).length).toBeGreaterThan(0)

    expect(window.localStorage.length).toBe(1)
    expect(window.localStorage.getItem('ihl.language')).toBe('en')
  })

  it('runs a full lookup and lands on the results page', async () => {
    stubBackend(
      emailResponse({
        state: 'breached',
        totalBreaches: 1,
        breaches: [ADOBE],
        providers: [
          providerResult({ breaches: [ADOBE] }),
          providerResult({ provider: 'orelys', status: 'not_configured', responded: false }),
        ],
      }),
    )
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/check/email']}>
        <AppShell />
      </MemoryRouter>,
    )

    await user.type(await screen.findByLabelText('Adresse e-mail'), 'victim@example.com')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    // Navigated to the results page with the verdict and the breach record.
    expect(await screen.findByText('Résultat pour victim@example.com')).toBeInTheDocument()
    expect(screen.getByText('1 fuite trouvée')).toBeInTheDocument()
    expect(screen.getByText('Adobe')).toBeInTheDocument()
    expect(screen.getByTestId('breach-card')).toBeInTheDocument()

    // Provider transparency and recommendations are present.
    expect(screen.getByText('État des sources')).toBeInTheDocument()
    expect(screen.getByText('Non configurée')).toBeInTheDocument()
    expect(screen.getByText('Changez les mots de passe concernés')).toBeInTheDocument()
    expect(screen.getByText('Mots de passe')).toBeInTheDocument() // exposed-data pill
  })

  it('sends the user back to the form if the results page is opened cold', async () => {
    stubBackend()
    render(
      <MemoryRouter initialEntries={['/check/email/results']}>
        <AppShell />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Vérification d’adresse e-mail',
    )
  })

  it('renders the documentation page', async () => {
    render(
      <MemoryRouter initialEntries={['/documentation']}>
        <AppShell />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { level: 1, name: 'Documentation' })).toBeInTheDocument()
    expect(screen.getAllByText('/api/check-email').length).toBeGreaterThan(0)
  })

  it('shows a translated 404 for an unknown route', async () => {
    render(
      <MemoryRouter initialEntries={['/nope']}>
        <AppShell />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()
  })
})

describe('Privacy policy', () => {
  it('lists every section and the summary', () => {
    render(
      <Providers>
        <Privacy />
      </Providers>,
    )
    const summary = screen.getByRole('heading', { name: 'En résumé' }).closest('div')!
    expect(within(summary).getByText(/Aucun compte, aucune base de données/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Ce que nous ne collectons pas/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Vos droits/ })).toBeInTheDocument()
  })
})
