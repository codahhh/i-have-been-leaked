/**
 * English dictionary.
 *
 * Typed against `Dictionary`, so it must implement every French key.
 */
import type { Dictionary } from './fr'

export const en: Dictionary = {
  /* ---------------------------------------------------------------- brand */
  'brand.name': 'i have been leaked',
  'brand.tagline': 'Data breach checking',

  /* -------------------------------------------------------------- nav */
  'nav.home': 'Home',
  'nav.email': 'Email',
  'nav.username': 'Username',
  'nav.phone': 'Phone',
  'nav.password': 'Password',
  'nav.documentation': 'Documentation',
  'nav.about': 'About',
  'nav.privacy': 'Privacy',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.skipToContent': 'Skip to content',

  /* -------------------------------------------------------------- common */
  'common.loading': 'Loading…',
  'common.retry': 'Try again',
  'common.back': 'Back',
  'common.backHome': 'Back to home',
  'common.close': 'Close',
  'common.copy': 'Copy',
  'common.copied': 'Copied',
  'common.learnMore': 'Learn more',
  'common.source': 'Source',
  'common.sources': 'Sources',
  'common.required': 'Required',
  'common.optional': 'optional',
  'common.unknown': 'Unknown',
  'common.showMore': 'Show details',
  'common.showLess': 'Hide details',
  'common.newCheck': 'New check',
  'common.understood': 'Understood',
  'common.updated': 'Updated',
  'common.notAvailable': 'Not available',
  'common.via': 'via',

  /* -------------------------------------------------------------- language */
  'lang.label': 'Language',
  'lang.fr': 'Français',
  'lang.en': 'English',
  'lang.switchTo': 'Switch to {language}',

  /* ---------------------------------------------------------------- home */
  'home.eyebrow': 'Breach checking · named sources',
  'home.hero.title': 'Have you been leaked?',
  'home.hero.highlight': 'leaked',
  'home.hero.lede':
    'Find out whether your email address shows up in publicly known data breaches, whether your password has already circulated, and what to do next. No account, and your address is never stored.',

  'home.trust.storage': 'Nothing stored',
  'home.trust.account': 'No account, no history',
  'home.trust.providers': 'Named, verifiable sources',

  'home.types.title': 'What do you want to check?',

  'home.how.title': 'How it works',
  'home.how.step1.title': 'You enter a value',
  'home.how.step1.body':
    'An email address, a username, a number or a password. Nothing leaves your browser until you have given explicit consent.',
  'home.how.step2.title': 'We query the sources',
  'home.how.step2.body':
    'Our server function forwards your address to the providers named below, with a hard timeout and without logging personal data.',
  'home.how.step3.title': 'You get an honest verdict',
  'home.how.step3.body':
    'Breaches found, sources that answered, sources that did not. We never default to “you are fine”: a silent provider makes the result incomplete.',

  'home.providers.title': 'Our sources, nothing hidden',
  'home.providers.body':
    'Every result states which source actually answered. If a source is unavailable or unconfigured, we say so instead of replacing it with a reassuring conclusion.',
  'home.providers.statusOk': 'Available',
  'home.providers.statusNotConfigured': 'Not configured',
  'home.providers.statusUnavailable': 'Unavailable',
  'home.providers.passwordSource': 'Passwords',
  'home.providers.passwordSourceBody':
    'Direct query to the Have I Been Pwned Pwned Passwords API, by hash prefix (k-anonymity). No key required, no password transmitted.',
  'home.providers.notConfiguredNote':
    'An unconfigured source is shown as such and makes results incomplete. See the documentation to enable it.',

  'home.stats.title': 'Real figures, no decoration',
  'home.stats.lede': 'Aggregates fetched on demand from the public {source} index.',
  'home.stats.breaches': 'Indexed breaches',
  'home.stats.records': 'Exposed accounts',
  'home.stats.latest': 'Most recent breach',
  'home.stats.unavailable':
    'Public statistics are temporarily unavailable. We do not display invented numbers in their place.',
  'home.stats.loading': 'Fetching figures…',

  'home.privacy.title': 'Your data is not ours',
  'home.privacy.body':
    'No user database, no search history, no advertising tracker. Your address passes through our server function for the duration of one request and is never written to disk.',
  'home.privacy.link': 'Read the privacy policy',

  'home.cta.title': 'Start with your email address',
  'home.cta.body':
    'It is the most reliable check we offer: two independent sources, de-duplicated, with an explicit status for each.',
  'home.cta.note': 'no account · no storage · named sources',
  'home.cta.button': 'Check an address',

  /* --------------------------------------------------------- search types */
  'search.type.email.title': 'Email address',
  'search.type.email.short': 'Email',
  'search.type.email.description': 'Queries two breach indexes and merges the results.',
  'search.type.username.title': 'Username',
  'search.type.username.short': 'Username',
  'search.type.username.description': 'Real lookups through LeakCheck’s public API.',
  'search.type.phone.title': 'Phone number',
  'search.type.phone.short': 'Phone',
  'search.type.phone.description':
    'Validated international input, then a real lookup through LeakCheck’s public API.',
  'search.type.password.title': 'Password',
  'search.type.password.short': 'Password',
  'search.type.password.description':
    'Local hashing, k-anonymity: only 5 characters leave the browser.',

  /* --------------------------------------------------------------- email */
  'email.form.label': 'Email address',
  'email.form.placeholder': 'you@example.com',
  'email.form.submit': 'Check',
  'email.form.validating': 'Validating…',
  'email.form.hint': 'No account required. The address is not retained.',
  'email.consent.title': 'Before we send: who receives your address?',
  'email.consent.body':
    'To check a breach, your address has to be sent to the providers. It goes to {providers} from our server function, never from your browser, and each provider applies its own retention policy.',
  'email.consent.checkbox': 'I consent to my address being sent to {providers} for the purpose of this check.',
  'email.consent.privacyLink': 'Privacy policy',
  'email.consent.noAnonymity':
    'We do not promise anonymity: those providers necessarily see the address they are asked to check.',
  'email.page.title': 'Email address check',
  'email.page.sidebar.title': 'What we send',
  'email.page.sidebar.body': 'Your address leaves our server function for the named providers, for the duration of one request. It is never written to disk, never logged, and never echoed back to the browser.',
  'email.page.lede':
    'We query XposedOrNot and LeakCheck, merge the results, remove duplicates and identify the source of every breach.',

  /* ------------------------------------------------------------- results */
  'results.title': 'Check result',
  'results.for': 'Result for {email}',
  'results.forUsername': 'Result for @{username}',
  'results.forPhone': 'Result for {phone}',
  'results.checkedAt': 'Checked on {date}',
  'results.state.clean.title': 'No match found',
  'results.state.clean.body':
    'None of the sources that answered recognise this address. That does not prove it was never leaked: public indexes are incomplete and a private leak will not appear in them.',
  'results.state.breached.title.one': '{count} breach found',
  'results.state.breached.title.other': '{count} breaches found',
  'results.state.breached.body':
    'This address appears in at least one exposed dataset. The affected data and the date of each breach are listed below.',
  'results.state.incomplete.title': 'Incomplete result',
  'results.state.incomplete.body':
    'No match in the sources that answered, but a source failed to answer or is not configured. This result does not allow a conclusion.',
  'results.state.error.title': 'Check could not complete',
  'results.state.error.body':
    'No source could be queried. We cannot say whether this address was leaked. Please try again shortly.',
  'results.summary.breaches': 'Breaches detected',
  'results.summary.providers': 'Sources that answered',
  'results.summary.duration': 'Request duration',
  'results.summary.state': 'Status',
  'results.summary.stateValue.clean': 'No match',
  'results.summary.stateValue.breached': 'Exposure detected',
  'results.summary.stateValue.incomplete': 'Partial coverage',
  'results.summary.stateValue.error': 'Undetermined',
  'results.list.title': 'Breaches involved',
  'results.list.count.one': '{count} breach',
  'results.list.count.other': '{count} breaches',
  'results.providers.title': 'Source status',
  'results.providers.legend':
    'Each source is queried separately. A source that did not answer is flagged: it makes the result incomplete, never “clean”.',
  'results.disclaimer':
    'A result depends on the sources queried and how fresh they are. No match does not mean no breach.',
  'results.error.banner': 'The request failed.',
  'results.missing.title': 'No result to display',
  'results.missing.body': 'Run a check from the form to see a result here.',

  /* ------------------------------------------------------------ providers */
  'provider.coverage.xposedornot':
    'Open breach index covering thousands of publicly disclosed breaches. Free email endpoint, no key required.',
  'provider.coverage.leakcheck':
    'Public API over 10B+ leaked records: emails, usernames and phone numbers. Reports the breach sources and the categories of exposed data, never the data itself.',
  'provider.categories': 'Exposed categories (aggregated for this query): {categories}',
  'provider.status.ok': 'Answered',
  'provider.status.not_found': 'Answered — no match',
  'provider.status.not_configured': 'Not configured',
  'provider.status.unavailable': 'Unavailable',
  'provider.status.timeout': 'Timed out',
  'provider.status.rate_limited': 'Rate limited',
  'provider.status.invalid_response': 'Unusable response',
  'provider.respondedYes': 'Answered',
  'provider.respondedNo': 'Did not answer',
  'provider.duration': '{ms} ms',
  'provider.queriedAt': 'Queried at {time}',
  'provider.detail': 'Technical detail',
  'provider.retryAfter': 'Retry possible in {seconds}s',
  'provider.notConfiguredHelp': 'See the documentation to enable this source.',
  'provider.error.network_error': 'Could not reach the provider.',
  'provider.error.timeout': 'The provider did not answer within the deadline.',
  'provider.error.rate_limited': 'The provider limits how often it can be queried.',
  'provider.error.provider_error': 'The provider returned an error.',
  'provider.error.not_configured': 'API key missing on this deployment.',
  'provider.error.unauthorized': 'The provider rejected the credentials.',
  'provider.error.invalid_response': 'The provider response could not be interpreted.',
  'provider.error.unknown': 'Unexpected provider error.',

  /* -------------------------------------------------------------- breaches */
  'breach.date': 'Breach date',
  'breach.dateUnknown': 'Date not disclosed',
  'breach.exposed': 'Exposed data',
  'breach.exposedUnknown': 'Not detailed by the source',
  'breach.source': 'Source',
  'breach.accounts': 'exposed accounts',
  'breach.description': 'Description',
  'breach.more': 'More information',
  'breach.less': 'Collapse',

  /* --------------------------------------------------------- exposed data */
  'exposed.email': 'Email addresses',
  'exposed.password': 'Passwords',
  'exposed.username': 'Usernames',
  'exposed.phone': 'Phone numbers',
  'exposed.name': 'Names',
  'exposed.address': 'Postal addresses',
  'exposed.ip': 'IP addresses',
  'exposed.dob': 'Dates of birth',
  'exposed.financial': 'Financial data',
  'exposed.social': 'Social profiles',
  'exposed.device': 'Device data',
  'exposed.location': 'Location',
  'exposed.identity': 'Identity documents',
  'exposed.other': 'Other',

  /* -------------------------------------------------------- recommendations */
  'rec.title': 'What to do now',
  'rec.times.one': 'One action is enough to dramatically reduce the risk.',
  'rec.times.other': 'In order, from most urgent to most structural.',
  'rec.password.title': 'Change the affected passwords',
  'rec.password.body':
    'Start with the services exposed above, then your main mailbox: it is the key that resets every other account.',
  'rec.reuse.title': 'Never reuse a password',
  'rec.reuse.body':
    'One unique password per service keeps a leak isolated instead of letting it become a cascading compromise.',
  'rec.tfa.title': 'Turn on two-factor authentication',
  'rec.tfa.body':
    'An authenticator app (TOTP) or a hardware key protects the account even when the password is known. Avoid SMS when another option exists.',
  'rec.phishing.title': 'Watch for targeted messages',
  'rec.phishing.body':
    'A leak gives attackers credible details (old password, address, service used). No legitimate support team asks for a password by email.',
  'rec.manager.title': 'Use a password manager',
  'rec.manager.body':
    'It generates and remembers unique passwords. You only have one secret left to protect — and you can check it below.',
  'rec.disclaimer':
    'These recommendations are general. They do not replace professional advice if your identity or bank accounts are involved.',

  /* ------------------------------------------------------------- password */
  'password.aside.title': 'What we guarantee',
  'password.page.title': 'Has your password already leaked?',
  'password.page.lede':
    'The password is hashed locally in your browser. Only the first five characters of the SHA-1 digest are sent — never the password, never the full hash.',
  'password.form.label': 'Password to check',
  'password.form.placeholder': 'Type or paste a password',
  'password.form.submit': 'Check password',
  'password.form.checking': 'Checking…',
  'password.form.show': 'Show password',
  'password.form.hide': 'Hide password',
  'password.form.clear': 'Clear',
  'password.form.localOnly': 'Stays in this tab · never stored · never logged',
  'password.form.cleared': 'The field was cleared after the check.',
  'password.result.pwned.title': 'This password circulates in breaches',
  'password.result.pwned.body.one':
    'Digest found in public corpora: {count} occurrence recorded. Treat this password as compromised and replace it everywhere you use it.',
  'password.result.pwned.body.other':
    'Digest found in public corpora: {count} occurrences recorded. Treat this password as compromised and replace it everywhere you use it.',
  'password.result.safe.title': 'No known match',
  'password.result.safe.body':
    'This digest does not appear among the {count} digests in the queried range. That does not guarantee the password is safe: corpora are partial, and a weak but unseen password is still weak.',
  'password.result.error.title': 'Check could not complete',
  'password.result.error.body':
    'The password source could not be queried. No conclusion can be drawn from this failure.',
  'password.error.empty': 'Enter a password.',
  'password.error.tooShort': 'A password shorter than 8 characters cannot be considered safe, even without a match.',
  'password.error.insecureContext':
    'Local hashing requires a secure connection (HTTPS). Reload the page over HTTPS to check a password.',
  'password.error.hashFailed': 'Local hashing failed in this browser. No password was sent.',
  'password.error.network':
    'The range API could not be reached. Your password stayed in this browser.',
  'password.how.title': 'k-anonymity, concretely',
  'password.how.step1': 'Your browser computes the SHA-1 digest of the password.',
  'password.how.step2': 'It sends only the first 5 characters of that digest.',
  'password.how.step3':
    'The server returns every digest beginning with those 5 characters — several hundred of them.',
  'password.how.step4': 'The final comparison happens in your browser, against your full digest.',
  'password.how.why':
    'The source therefore never learns which password you tested. This is Have I Been Pwned’s public protocol, and we send nothing else.',
  'password.result.occurrences': 'Known occurrences',
  'password.result.rangeSizeLabel': 'Digests compared',
  'password.result.viaDirect': 'Direct call · api.pwnedpasswords.com',
  'password.result.viaRelay': 'Via our server relay · range API',
  'password.diagram.hash': 'SHA-1 of the password',
  'password.diagram.sent': 'sent — 5 characters',
  'password.diagram.local': 'compared locally',
  'password.note.exit': 'Close this tab to wipe the password from memory.',
  'password.note.autofill': 'Disable your browser’s autofill suggestion if you share this device.',

  /* ------------------------------------------------------------- username */
  'username.page.title': 'Username check',
  'username.page.lede':
    'Usernames mostly surface in leaks from forums, games and consumer services. We query LeakCheck’s public API, which covers usernames as well as email addresses.',
  'username.page.scope.title': 'Narrower coverage than email',
  'username.page.scope.body':
    'Only one source can search a username: no match means “nothing in that source”, never “nothing anywhere”.',
  'username.form.label': 'Username',
  'username.form.placeholder': 'username',
  'username.form.submit': 'Check',
  'username.form.hint': 'Letters, digits, dots, dashes and underscores.',
  'username.form.minLength': 'At least {count} characters.',
  'username.consent.title': 'What is sent',
  'username.consent.body':
    'The username is sent from our server function to {providers} for the duration of one request. It is never stored, never logged and never returned to the browser.',
  'username.consent.checkbox': 'I agree to query {providers}.',
  'username.consent.coverage':
    'A username is not an identity: the same name on two sites can be two people. Treat every match as a lead, not a certainty.',

  /* ---------------------------------------------------------------- phone */
  'phone.page.title': 'Phone number check',
  'phone.page.lede':
    'The number is validated in international format (E.164) before anything is sent, then checked against the only free source that can search by number. A match points to a public breach — never to a certainty about you.',
  'phone.form.label': 'Phone number',
  'phone.form.country': 'Country',
  'phone.form.placeholder': '6 12 34 56 78',
  'phone.form.submit': 'Check',
  'phone.form.e164': 'International format: {e164}',
  'phone.form.countryHint': 'Select the country of the number.',
  'phone.form.note': 'Numbers get recycled: a match stays a clue.',
  'phone.consent.title': 'What is sent',
  'phone.consent.body':
    'The number in international format, without the leading “+”, is sent from our server function to {providers} for the duration of one request. It is never stored, logged or echoed back to the browser.',
  'phone.consent.checkbox': 'I agree to querying {providers}.',
  'phone.consent.coverage':
    'Only one public source answers phone searches. No match means “nothing in that source”, never “nothing anywhere”.',
  'phone.scope.title': 'Narrower coverage than email',
  'phone.scope.body':
    'Phone numbers mostly surface in e-commerce, service and marketing dumps. A negative answer does not prove the number is absent everywhere.',
  'phone.results.caveat':
    'A number can be recycled by a carrier: the match may belong to a previous owner. Treat it as a clue, not as proof.',

  /* -------------------------------------------------------------- loading */
  'loading.title': 'Check in progress',
  'loading.step1': 'Validating input',
  'loading.step2': 'Querying {count} sources',
  'loading.step3': 'Merging and removing duplicates',
  'loading.provider': 'Contacting {provider}…',
  'loading.elapsed': '{seconds}s elapsed',
  'loading.slow': 'A source is slow. We abort beyond 9 seconds and report the real status.',

  /* -------------------------------------------------------------- errors */
  'errors.title': 'Something went wrong',
  'errors.network.title': 'Network unavailable',
  'errors.network.body':
    'The request did not reach the server. Check your connection and try again.',
  'errors.timeout.title': 'Timed out',
  'errors.timeout.body': 'The service took too long to answer. Try again in a moment.',
  'errors.rate_limited.title': 'Too many requests',
  'errors.rate_limited.body':
    'Our abuse protection limits how many checks can be run per minute. Try again in {seconds} seconds.',
  'errors.server.title': 'Service temporarily unavailable',
  'errors.server.body': 'The server could not process the request. No data was recorded.',
  'errors.invalid_response.title': 'Unexpected response',
  'errors.invalid_response.body':
    'The server returned a response we could not use. We would rather tell you than show a doubtful result.',
  'errors.invalid_email.title': 'Invalid address',
  'errors.invalid_email.body': 'Check the format of the email address.',
  'errors.crash.title': 'An unexpected error occurred',
  'errors.crash.body':
    'This page could not be displayed. Your search data is stored nowhere, so reloading is enough. Nothing was sent anywhere.',
  'errors.crash.reload': 'Reload the page',
  'errors.generic.title': 'Check failed',
  'errors.generic.body': 'The check could not be completed. Try again in a moment.',

  /* ---------------------------------------------------------- validation */
  'validation.email.required': 'Enter an email address.',
  'validation.email.invalid': 'This email address is not valid (example: name@domain.com).',
  'validation.email.tooLong': 'This address exceeds the maximum allowed length.',
  'validation.username.required': 'Enter a username.',
  'validation.username.invalid':
    'Usernames must be 3–64 characters: letters, digits, dot, hyphen or underscore.',
  'validation.phone.required': 'Enter a phone number.',
  'validation.phone.invalid': 'This number is not valid for the selected country.',
  'validation.phone.unrecognized': 'Unrecognised number. Check the dialling code or change country.',
  'validation.password.required': 'Enter a password.',
  'validation.consent.required': 'Tick the consent box to continue.',

  /* --------------------------------------------------------------- about */
  'about.title': 'About',
  'about.lede':
    'i have been leaked is a breach-checking tool built on one idea: an incomplete result labelled as incomplete is better than a reassuring “you are fine” that happens to be false.',
  'about.why.title': 'Why this tool',
  'about.why.body':
    'Most checkers display a binary result and imply that no match means safe. It does not: public indexes are partial and change daily. So we show separately what the sources answered and what they could not say.',
  'about.arch.title': 'Architecture',
  'about.arch.body':
    'A React/TypeScript app, Netlify Functions on the server, and one adapter per provider. API keys stay server-side; the browser only talks to our own API, except for the password check where the range request goes straight to the range API.',
  'about.limits.title': 'Accepted limits',
  'about.limits.body':
    'Username and phone lookups rely on a single free source (LeakCheck), so their coverage is narrower than email addresses, which query two. That public tier allows one request per second. Passwords are never transmitted, but the range API does see the partial digest and your IP address.',
  'about.stack.title': 'Technical',
  'about.stack.body':
    'React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Netlify Functions. No database, no accounts, no trackers.',
  'about.contact.title': 'Contact',
  'about.contact.body':
    'Report a bug, suggest a source or request a correction: open an issue on the project repository.',

  /* ------------------------------------------------------------- privacy */
  'privacy.title': 'Privacy policy',
  'privacy.updated': 'Last updated: {date}',
  'privacy.lede':
    'This page describes exactly what is sent, what is retained and what is not. It is written to be read, not to legally cover a hidden collection.',
  'privacy.summary.title': 'In short',
  'privacy.summary.item1': 'No account, no user database.',
  'privacy.summary.item2': 'No search history, no cache of personal results.',
  'privacy.summary.item3': 'No advertising tracker and no third-party analytics.',
  'privacy.summary.item4': 'No password and no full hash ever leaves your browser.',
  'privacy.s1.title': 'What we do not collect',
  'privacy.s1.body':
    'We create no account, set no audience-measurement cookie, use no Google Analytics or equivalent, and do not retain the addresses you search. There is therefore no database in which we could link you to anything.',
  'privacy.s2.title': 'What is sent to the providers',
  'privacy.s2.body':
    'When you run a check and consent to it, the address or username is sent to XposedOrNot (addresses) and to LeakCheck from our server function. Those providers are independent third parties: they see the value you searched, the IP address of our function, and apply their own retention policy. We cannot guarantee the anonymity of that transmission.',
  'privacy.s2.xon': 'XposedOrNot — privacy policy',
  'privacy.s2.leakcheck': 'LeakCheck — terms and privacy',
  'privacy.s3.title': 'Passwords',
  'privacy.s3.body':
    'The password is SHA-1 hashed in your browser. Only the first five characters of the digest are sent to the Have I Been Pwned range API, which returns several hundred digests. The final comparison happens locally. The password and the full digest are never stored, logged or transmitted. The field is cleared after the check.',
  'privacy.s4.title': 'Server logs',
  'privacy.s4.body':
    'Abuse protection counts requests per IP address as a salted hash that changes with every instance: the raw IP is never written. Technical logs contain no searched identifier; any logged error is filtered to strip email addresses and long numeric values.',
  'privacy.s5.title': 'Local storage',
  'privacy.s5.body':
    'Exactly one item is kept in your browser: your language preference (key “ihl.language”). No search result, address or password is ever written there — not in localStorage, not in sessionStorage, not in a cookie.',
  'privacy.s6.title': 'Security',
  'privacy.s6.body':
    'HTTPS only, strict security headers (CSP, HSTS, nosniff, Referrer-Policy), timeouts on every outbound call, input validation in the browser and on the server, rate limiting to prevent abuse, and no API key exposed to the client.',
  'privacy.s7.title': 'Your rights',
  'privacy.s7.body':
    'Because we keep no personal data, there is nothing on our side to access, export or delete. For transmissions to the providers, requests must be addressed to them. You can reach us through the project repository for any question.',
  'privacy.s8.title': 'No guarantee',
  'privacy.s8.body':
    'A negative result does not guarantee that a piece of data was never leaked. This tool provides an indication drawn from public sources, at a given moment.',

  /* ---------------------------------------------------------------- docs */
  'docs.title': 'Documentation',
  'docs.lede':
    'Architecture, internal API, environment variables and deployment procedure. Everything needed to run this project yourself.',
  'docs.arch.title': 'Architecture',
  'docs.arch.body':
    'The front end (React + TypeScript + Vite) holds no secret. Netlify Functions orchestrate the providers, normalise, merge and derive a state. One adapter per provider implements the same interface, which keeps adding a source isolated and testable.',
  'docs.api.title': 'Internal API',
  'docs.api.checkEmail':
    'POST — { email: string, consent: true }. Returns a state (clean / breached / incomplete / error), merged breaches and the status of each provider. Never cached.',
  'docs.api.checkUsername':
    'POST — { username: string, consent: true }. Same contract as email, on the only sources that can search a username.',
  'docs.api.checkPhone':
    'POST — { phone: string, consent: true }. The number must be E.164; the server strips the “+” before querying the source.',
  'docs.api.passwordRange':
    'GET ?prefix=ABCDE — relay for the HIBP range API. Receives only 5 digest characters.',
  'docs.api.providers':
    'GET — source matrix: capabilities, availability, configuration.',
  'docs.api.breachStats':
    'GET — public aggregates (breach count, exposed accounts) from the XposedOrNot index.',
  'docs.env.title': 'Environment variables',
  'docs.env.none':
    'No API key is needed: XposedOrNot, LeakCheck and HIBP Pwned Passwords are all queried without authentication. The deployment works as-is.',
  'docs.env.node': 'NODE_VERSION — pinned to 22 in netlify.toml. No other setting is required.',
  'docs.env.noneShort': 'No API key required',
  'docs.deploy.title': 'Deployment',
  'docs.deploy.body':
    'Connect the repository to Netlify: the netlify.toml configuration (build, publish directory, functions, redirects, headers) applies automatically. Vercel is supported too, through vercel.json and the api/ directory. No environment variable is required.',
  'docs.limits.title': 'Limits and abuse',
  'docs.limits.body':
    'Rate limiting is in-memory, per function instance. For fleet-wide protection, add a Netlify rate-limit rule or a shared counter (Netlify Blobs, Upstash) in front of the check function.',
  'docs.extend.title': 'Adding a provider',
  'docs.extend.body':
    'Declare the entry in netlify/lib/config.ts (endpoints, timeout, key, capabilities), implement queryX in netlify/lib/providers/, then register it in the PROVIDER_QUERIES map of checkEmail.ts. Normalisation, merging, status display and translation are already handled.',

  /* -------------------------------------------------------------- footer */
  'footer.tagline': 'Breach checking, no account, no retention of your data.',
  'footer.product': 'Checks',
  'footer.resources': 'Resources',
  'footer.legal': 'Information',
  'footer.sources': 'Data sources',
  'footer.disclaimer':
    'A negative result does not guarantee the absence of a breach. Public sources are incomplete.',
  'footer.rights': 'Open-source project. No personal data collected.',
  'footer.status': 'Source status',

  /* ----------------------------------------------------------- not found */
  'notFound.title': 'Page not found',
  'notFound.body': 'This page does not exist or has been moved.',
  'notFound.action': 'Back to home',

  /* ----------------------------------------------------------- a11y only */
  'a11y.primaryNav': 'Main navigation',
  'a11y.externalLink': 'opens in a new tab',
  'a11y.results': 'Check results',
  'a11y.copyHash': 'Copy',
}
