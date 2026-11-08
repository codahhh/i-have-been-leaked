/**
 * French dictionary — the reference locale.
 *
 * Keys are flat, dotted strings. `en.ts` is typed against this object, so a
 * forgotten translation is a TypeScript error rather than a runtime surprise.
 *
 * Placeholders use `{name}` interpolation. Pluralised strings use the
 * `.one` / `.other` suffix and are resolved by `tp()` in `src/i18n/index.tsx`.
 */
export const fr = {
  /* ---------------------------------------------------------------- brand */
  'brand.name': 'i have been leaked',
  'brand.tagline': 'Vérification de fuites de données',

  /* -------------------------------------------------------------- nav */
  'nav.home': 'Accueil',
  'nav.email': 'E-mail',
  'nav.username': 'Pseudo',
  'nav.phone': 'Téléphone',
  'nav.password': 'Mot de passe',
  'nav.documentation': 'Documentation',
  'nav.about': 'À propos',
  'nav.privacy': 'Confidentialité',
  'nav.openMenu': 'Ouvrir le menu',
  'nav.closeMenu': 'Fermer le menu',
  'nav.skipToContent': 'Aller au contenu',

  /* -------------------------------------------------------------- common */
  'common.loading': 'Chargement…',
  'common.retry': 'Réessayer',
  'common.back': 'Retour',
  'common.backHome': 'Retour à l’accueil',
  'common.close': 'Fermer',
  'common.copy': 'Copier',
  'common.copied': 'Copié',
  'common.learnMore': 'En savoir plus',
  'common.source': 'Source',
  'common.sources': 'Sources',
  'common.required': 'Obligatoire',
  'common.optional': 'facultatif',
  'common.unknown': 'Inconnue',
  'common.showMore': 'Afficher les détails',
  'common.showLess': 'Masquer les détails',
  'common.newCheck': 'Nouvelle vérification',
  'common.understood': 'Compris',
  'common.updated': 'Mis à jour',
  'common.notAvailable': 'Non disponible',
  'common.via': 'via',

  /* -------------------------------------------------------------- language */
  'lang.label': 'Langue',
  'lang.fr': 'Français',
  'lang.en': 'English',
  'lang.switchTo': 'Passer en {language}',

  /* ---------------------------------------------------------------- home */
  'home.eyebrow': 'Vérification de fuites · sources nommées',
  'home.hero.title': 'Avez-vous été victime d’une fuite ?',
  'home.hero.highlight': 'fuite',
  'home.hero.lede':
    'Vérifiez si votre adresse e-mail apparaît dans des fuites de données publiquement connues, si votre mot de passe circule déjà, et ce que vous devez faire ensuite. Sans compte, sans stockage de votre adresse.',

  'home.trust.storage': 'Aucune donnée conservée',
  'home.trust.account': 'Sans compte, sans historique',
  'home.trust.providers': 'Sources nommées et vérifiables',

  'home.types.title': 'Que voulez-vous vérifier ?',

  'home.how.title': 'Comment ça marche',
  'home.how.step1.title': 'Vous saisissez',
  'home.how.step1.body':
    'Une adresse e-mail, un pseudo, un numéro ou un mot de passe. Rien ne quitte votre navigateur tant que vous n’avez pas donné votre consentement.',
  'home.how.step2.title': 'Nous interrogeons les sources',
  'home.how.step2.body':
    'Notre fonction serveur transmet votre adresse aux fournisseurs explicitement nommés ci-dessous, avec un délai maximal et sans journaliser de données personnelles.',
  'home.how.step3.title': 'Vous obtenez un verdict honnête',
  'home.how.step3.body':
    'Fuites trouvées, sources qui ont répondu, sources indisponibles. Nous n’affichons jamais « tout va bien » par défaut : un fournisseur muet rend le résultat incomplet.',

  'home.providers.title': 'Nos sources, sans zone d’ombre',
  'home.providers.body':
    'Chaque résultat indique quelle source a réellement répondu. Si une source est indisponible ou non configurée, nous le disons au lieu de compenser par une conclusion rassurante.',
  'home.providers.statusOk': 'Disponible',
  'home.providers.statusNotConfigured': 'Non configurée',
  'home.providers.statusUnavailable': 'Indisponible',
  'home.providers.passwordSource': 'Mots de passe',
  'home.providers.passwordSourceBody':
    'Interrogation directe de l’API Pwned Passwords de Have I Been Pwned, par préfixe de hachage (k-anonymat). Aucune clé requise, aucun mot de passe transmis.',
  'home.providers.notConfiguredNote':
    'Une source non configurée est affichée comme telle et rend les résultats incomplets. Voir la documentation pour l’activer.',

  'home.stats.title': 'Chiffres réels, pas de décoration',
  'home.stats.lede': 'Agrégats récupérés à la demande depuis l’index public de {source}.',
  'home.stats.breaches': 'Fuites indexées',
  'home.stats.records': 'Comptes exposés',
  'home.stats.latest': 'Fuite la plus récente',
  'home.stats.unavailable':
    'Les statistiques publiques sont momentanément indisponibles. Nous n’affichons pas de chiffres inventés à la place.',
  'home.stats.loading': 'Récupération des chiffres…',

  'home.privacy.title': 'Vos données ne nous appartiennent pas',
  'home.privacy.body':
    'Aucune base de données d’utilisateurs, aucun historique de recherche, aucun traqueur publicitaire. Votre adresse transite par notre fonction serveur le temps d’une requête et n’est jamais écrite sur disque.',
  'home.privacy.link': 'Lire la politique de confidentialité',

  'home.cta.title': 'Commencez par votre adresse e-mail',
  'home.cta.body':
    'C’est la vérification la plus fiable : deux sources indépendantes, dédoublonnage, et un état explicite pour chacune.',
  'home.cta.note': 'aucun compte · aucun stockage · sources nommées',
  'home.cta.button': 'Vérifier une adresse',

  /* --------------------------------------------------------- search types */
  'search.type.email.title': 'Adresse e-mail',
  'search.type.email.short': 'E-mail',
  'search.type.email.description': 'Interroge deux index de fuites et fusionne les résultats.',
  'search.type.username.title': 'Nom d’utilisateur',
  'search.type.username.short': 'Pseudo',
  'search.type.username.description': 'Aucune source publique fiable pour les pseudos en V1.',
  'search.type.phone.title': 'Numéro de téléphone',
  'search.type.phone.short': 'Téléphone',
  'search.type.phone.description': 'Saisie internationale validée, couverture en cours.',
  'search.type.password.title': 'Mot de passe',
  'search.type.password.short': 'Mot de passe',
  'search.type.password.description':
    'Hachage local, k-anonymat : seuls 5 caractères sortent du navigateur.',

  /* --------------------------------------------------------------- email */
  'email.form.label': 'Adresse e-mail',
  'email.form.placeholder': 'vous@exemple.com',
  'email.form.submit': 'Vérifier',
  'email.form.validating': 'Validation…',
  'email.form.hint': 'Aucun compte requis. L’adresse n’est pas conservée.',
  'email.consent.title': 'Avant l’envoi : qui reçoit votre adresse ?',
  'email.consent.body':
    'Pour vérifier une fuite, votre adresse doit être transmise aux fournisseurs. Elle est envoyée à {providers} depuis notre fonction serveur, jamais depuis votre navigateur, et chaque fournisseur applique sa propre politique de conservation.',
  'email.consent.checkbox': 'J’autorise l’envoi de mon adresse à {providers} aux fins de vérification.',
  'email.consent.privacyLink': 'Politique de confidentialité',
  'email.consent.noAnonymity':
    'Nous ne promettons pas l’anonymat : ces fournisseurs voient nécessairement l’adresse qu’ils doivent vérifier.',
  'email.page.title': 'Vérification d’adresse e-mail',
  'email.page.sidebar.title': 'Ce que nous envoyons',
  'email.page.sidebar.body': 'Votre adresse part depuis notre fonction serveur vers les fournisseurs nommés, le temps d’une requête. Elle n’est ni écrite sur disque, ni journalisée, ni renvoyée au navigateur.',
  'email.page.lede':
    'Nous interrogeons XposedOrNot et Orelys, fusionnons les résultats, retirons les doublons et identifions la source de chaque fuite.',

  /* ------------------------------------------------------------- results */
  'results.title': 'Résultat de la vérification',
  'results.for': 'Résultat pour {email}',
  'results.checkedAt': 'Vérifié le {date}',
  'results.state.clean.title': 'Aucune correspondance trouvée',
  'results.state.clean.body':
    'Aucune des sources qui ont répondu ne connaît cette adresse. Cela ne prouve pas que l’adresse n’a jamais fuité : les index publics sont incomplets et une fuite privée n’y figure pas.',
  'results.state.breached.title.one': '{count} fuite trouvée',
  'results.state.breached.title.other': '{count} fuites trouvées',
  'results.state.breached.body':
    'Cette adresse apparaît dans au moins un jeu de données exposé. Les données concernées et la date de chaque fuite sont détaillées ci-dessous.',
  'results.state.incomplete.title': 'Résultat incomplet',
  'results.state.incomplete.body':
    'Aucune correspondance dans les sources qui ont répondu, mais une source n’a pas pu répondre ou n’est pas configurée. Ce résultat ne permet pas de conclure.',
  'results.state.error.title': 'Vérification impossible',
  'results.state.error.body':
    'Aucune source n’a pu être interrogée. Nous ne pouvons pas dire si cette adresse a fuité ou non. Réessayez dans un instant.',
  'results.summary.breaches': 'Fuites détectées',
  'results.summary.providers': 'Sources ayant répondu',
  'results.summary.duration': 'Durée de la requête',
  'results.summary.state': 'État',
  'results.summary.stateValue.clean': 'Aucune correspondance',
  'results.summary.stateValue.breached': 'Exposition détectée',
  'results.summary.stateValue.incomplete': 'Couverture partielle',
  'results.summary.stateValue.error': 'Indéterminé',
  'results.list.title': 'Fuites concernées',
  'results.list.count.one': '{count} fuite',
  'results.list.count.other': '{count} fuites',
  'results.providers.title': 'État des sources',
  'results.providers.legend':
    'Chaque source est interrogée séparément. Une source qui n’a pas répondu est signalée : elle rend le résultat incomplet, jamais « propre ».',
  'results.disclaimer':
    'Un résultat dépend des sources interrogées et de leur fraîcheur. Absence de correspondance ne signifie pas absence de fuite.',
  'results.error.banner': 'La requête a échoué.',
  'results.missing.title': 'Aucun résultat à afficher',
  'results.missing.body': 'Lancez une vérification depuis le formulaire pour voir un résultat ici.',

  /* ------------------------------------------------------------ providers */
  'provider.coverage.xposedornot':
    'Index de fuites public couvrant des milliers de fuites divulguées. Endpoint e-mail gratuit, sans clé.',
  'provider.coverage.orelys':
    'Source secondaire interrogée en parallèle de XposedOrNot : une lacune dans un index ne doit pas devenir un faux négatif.',
  'provider.status.ok': 'A répondu',
  'provider.status.not_found': 'A répondu — aucune correspondance',
  'provider.status.not_configured': 'Non configurée',
  'provider.status.unavailable': 'Indisponible',
  'provider.status.timeout': 'Délai dépassé',
  'provider.status.rate_limited': 'Limite de requêtes atteinte',
  'provider.status.invalid_response': 'Réponse inexploitable',
  'provider.respondedYes': 'A répondu',
  'provider.respondedNo': 'N’a pas répondu',
  'provider.duration': '{ms} ms',
  'provider.queriedAt': 'Interrogée à {time}',
  'provider.detail': 'Détail technique',
  'provider.retryAfter': 'Nouvel essai possible dans {seconds} s',
  'provider.notConfiguredHelp': 'Voir la documentation pour activer cette source.',
  'provider.error.network_error': 'Impossible de joindre le fournisseur.',
  'provider.error.timeout': 'Le fournisseur n’a pas répondu dans le délai imparti.',
  'provider.error.rate_limited': 'Le fournisseur limite le nombre de requêtes.',
  'provider.error.provider_error': 'Le fournisseur a renvoyé une erreur.',
  'provider.error.not_configured': 'Clé d’API absente sur ce déploiement.',
  'provider.error.unauthorized': 'Identifiants refusés par le fournisseur.',
  'provider.error.invalid_response': 'La réponse du fournisseur n’a pas pu être interprétée.',
  'provider.error.unknown': 'Erreur inattendue côté fournisseur.',

  /* -------------------------------------------------------------- breaches */
  'breach.date': 'Date de la fuite',
  'breach.dateUnknown': 'Date non communiquée',
  'breach.exposed': 'Données exposées',
  'breach.exposedUnknown': 'Détail non communiqué par la source',
  'breach.source': 'Source',
  'breach.accounts': 'comptes exposés',
  'breach.description': 'Description',
  'breach.more': 'Plus d’informations',
  'breach.less': 'Réduire',

  /* --------------------------------------------------------- exposed data */
  'exposed.email': 'Adresses e-mail',
  'exposed.password': 'Mots de passe',
  'exposed.username': 'Identifiants',
  'exposed.phone': 'Numéros de téléphone',
  'exposed.name': 'Noms',
  'exposed.address': 'Adresses postales',
  'exposed.ip': 'Adresses IP',
  'exposed.dob': 'Dates de naissance',
  'exposed.financial': 'Données bancaires',
  'exposed.social': 'Profils sociaux',
  'exposed.device': 'Données d’appareil',
  'exposed.location': 'Localisation',
  'exposed.identity': 'Documents d’identité',
  'exposed.other': 'Autre',

  /* -------------------------------------------------------- recommendations */
  'rec.title': 'Ce qu’il faut faire maintenant',
  'rec.times.one': 'Une action suffit pour réduire fortement le risque.',
  'rec.times.other': 'Dans l’ordre, du plus urgent au plus structurant.',
  'rec.password.title': 'Changez les mots de passe concernés',
  'rec.password.body':
    'Commencez par les services exposés ci-dessus, puis par votre messagerie principale : elle permet de réinitialiser tous les autres comptes.',
  'rec.reuse.title': 'Ne réutilisez jamais un mot de passe',
  'rec.reuse.body':
    'Un mot de passe unique par service fait qu’une fuite reste une fuite isolée au lieu de devenir une compromission en cascade.',
  'rec.tfa.title': 'Activez la double authentification',
  'rec.tfa.body':
    'Une application d’authentification (TOTP) ou une clé physique protège le compte même lorsque le mot de passe est connu. Évitez le SMS quand une autre option existe.',
  'rec.phishing.title': 'Méfiez-vous des messages ciblés',
  'rec.phishing.body':
    'Une fuite fournit aux attaquants des détails crédibles (ancien mot de passe, adresse, service utilisé). Aucun support légitime ne demande un mot de passe par e-mail.',
  'rec.manager.title': 'Utilisez un gestionnaire de mots de passe',
  'rec.manager.body':
    'Il génère et retient des mots de passe uniques. Vous n’avez plus qu’un secret à protéger, et vous pouvez le vérifier ci-dessous.',
  'rec.disclaimer':
    'Ces recommandations sont générales. Elles ne remplacent pas l’avis d’un professionnel si votre identité ou vos comptes bancaires sont concernés.',

  /* ------------------------------------------------------------- password */
  'password.aside.title': 'Ce que nous garantissons',
  'password.page.title': 'Votre mot de passe a-t-il déjà fuité ?',
  'password.page.lede':
    'Le mot de passe est haché localement dans votre navigateur. Seuls les cinq premiers caractères de l’empreinte SHA-1 sont envoyés — jamais le mot de passe, jamais l’empreinte complète.',
  'password.form.label': 'Mot de passe à vérifier',
  'password.form.placeholder': 'Saisissez ou collez un mot de passe',
  'password.form.submit': 'Vérifier le mot de passe',
  'password.form.checking': 'Vérification…',
  'password.form.show': 'Afficher le mot de passe',
  'password.form.hide': 'Masquer le mot de passe',
  'password.form.clear': 'Effacer',
  'password.form.localOnly': 'Reste dans cet onglet · jamais stocké · jamais journalisé',
  'password.form.cleared': 'Le champ a été vidé après la vérification.',
  'password.result.pwned.title': 'Ce mot de passe circule dans des fuites',
  'password.result.pwned.body.one':
    'Empreinte présente dans les corpus publics : {count} occurrence recensée. Considérez ce mot de passe comme compromis et remplacez-le partout où vous l’utilisez.',
  'password.result.pwned.body.other':
    'Empreinte présente dans les corpus publics : {count} occurrences recensées. Considérez ce mot de passe comme compromis et remplacez-le partout où vous l’utilisez.',
  'password.result.safe.title': 'Aucune correspondance connue',
  'password.result.safe.body':
    'Cette empreinte n’apparaît pas dans les {count} empreintes de la plage interrogée. Cela ne garantit pas que le mot de passe soit sûr : les corpus sont partiels, et un mot de passe faible mais inédit reste faible.',
  'password.result.error.title': 'Vérification impossible',
  'password.result.error.body':
    'La source de mots de passe n’a pas pu être interrogée. Aucune conclusion ne peut être tirée de cet échec.',
  'password.error.empty': 'Saisissez un mot de passe.',
  'password.error.tooShort': 'Un mot de passe de moins de 8 caractères ne peut pas être considéré comme sûr, même en l’absence de correspondance.',
  'password.error.insecureContext':
    'Le hachage local nécessite une connexion sécurisée (HTTPS). Rechargez la page en HTTPS pour vérifier un mot de passe.',
  'password.error.hashFailed': 'Le hachage local a échoué dans ce navigateur. Aucun mot de passe n’a été envoyé.',
  'password.error.network':
    'Impossible de joindre l’API de plages. Votre mot de passe est resté dans ce navigateur.',
  'password.how.title': 'Le k-anonymat, concrètement',
  'password.how.step1': 'Votre navigateur calcule l’empreinte SHA-1 du mot de passe.',
  'password.how.step2': 'Il n’envoie que les 5 premiers caractères de cette empreinte.',
  'password.how.step3':
    'Le serveur renvoie toutes les empreintes qui commencent par ces 5 caractères — plusieurs centaines.',
  'password.how.step4': 'La comparaison finale a lieu dans votre navigateur, sur votre empreinte complète.',
  'password.how.why':
    'La source ne sait donc jamais quel mot de passe vous avez testé. C’est le protocole public de Have I Been Pwned, et nous n’envoyons rien d’autre.',
  'password.result.occurrences': 'Occurrences connues',
  'password.result.rangeSizeLabel': 'Empreintes comparées',
  'password.result.viaDirect': 'Appel direct · api.pwnedpasswords.com',
  'password.result.viaRelay': 'Via notre relais serveur · API de plages',
  'password.diagram.hash': 'SHA-1 du mot de passe',
  'password.diagram.sent': 'envoyé — 5 caractères',
  'password.diagram.local': 'comparé localement',
  'password.note.exit': 'Quittez cet onglet pour effacer le mot de passe de la mémoire.',
  'password.note.autofill': 'Désactivez la suggestion automatique de votre navigateur si vous partagez l’appareil.',

  /* ------------------------------------------------------------- username */
  'username.page.title': 'Vérification de nom d’utilisateur',
  'username.page.lede':
    'Les pseudos circulent surtout dans des fuites de forums et de jeux. Contrairement aux adresses e-mail, il n’existe pas d’index public universel pour les rattacher à des fuites vérifiées.',
  'username.form.label': 'Nom d’utilisateur',
  'username.form.placeholder': 'pseudo',
  'username.form.submit': 'Vérifier',
  'username.unavailable.title': 'Recherche indisponible en V1',
  'username.unavailable.body':
    'Nous préférons vous le dire clairement plutôt que d’afficher un résultat inventé : aucune source gratuite et universelle ne permet aujourd’hui de vérifier un pseudo de façon fiable.',
  'username.unavailable.reason1.title': 'Pas de base universelle',
  'username.unavailable.reason1.body':
    'Les pseudos ne sont pas normalisés : le même nom sur deux sites désigne deux personnes différentes. Un index global produirait surtout des faux positifs.',
  'username.unavailable.reason2.title': 'Pas d’aspiration sauvage',
  'username.unavailable.reason2.body':
    'Certains sites proposent un « nom d’utilisateur trouvé quelque part » en aspirant des sites sans autorisation. Nous ne le faisons pas, ni ne l’affichons.',
  'username.unavailable.reason3.title': 'Architecture déjà prête',
  'username.unavailable.reason3.body':
    'Le fournisseur de recherche est un module isolé, comme XposedOrNot ou Orelys. Brancher une source sous licence suffira, sans toucher à l’interface.',
  'username.unavailable.result': 'Aucune conclusion n’est tirée pour « {username} ».',
  'username.unavailable.next': 'Pour activer cette fonction',
  'username.unavailable.nextBody':
    'Déclarer un fournisseur capable de résoudre les pseudos dans netlify/lib/config.ts, implémenter son adaptateur, puis l’ajouter à la liste des sources. Voir la documentation.',

  /* ---------------------------------------------------------------- phone */
  'phone.page.title': 'Vérification de numéro de téléphone',
  'phone.page.lede':
    'Le numéro est validé au format international (E.164) avant tout envoi. Une source fiable et gratuite couvrant les numéros n’est pas encore branchée.',
  'phone.form.label': 'Numéro de téléphone',
  'phone.form.country': 'Pays',
  'phone.form.placeholder': '6 12 34 56 78',
  'phone.form.submit': 'Vérifier',
  'phone.form.e164': 'Format international retenu : {e164}',
  'phone.form.countryHint': 'Choisissez le pays du numéro.',
  'phone.unavailable.title': 'Couverture indisponible en V1',
  'phone.unavailable.body':
    'Aucun fournisseur branché ne permet de vérifier un numéro. Nous n’affichons donc ni « propre » ni fuite : les deux seraient des inventions.',
  'phone.unavailable.reason1.title': 'Pas de source gratuite fiable',
  'phone.unavailable.reason1.body':
    'Les bases couvrant les numéros sont commerciales et sous licence. Les rares services gratuits sont opaques sur leur provenance de données.',
  'phone.unavailable.reason2.title': 'Un numéro n’est pas une identité',
  'phone.unavailable.reason2.body':
    'Un numéro recyclé par un opérateur peut avoir appartenu à quelqu’un d’autre. Une correspondance brute serait trompeuse sans contexte.',
  'phone.unavailable.reason3.title': 'Priorité à la précision',
  'phone.unavailable.reason3.body':
    'La validation E.164 et l’architecture fournisseur sont en place. L’affichage d’un résultat n’attend qu’une source contractuelle.',
  'phone.unavailable.next': 'Ce qui reste à configurer',
  'phone.unavailable.nextBody':
    'Une clé d’API auprès d’un fournisseur couvrant les numéros, puis un adaptateur déclaré dans netlify/lib/config.ts. Le formulaire ci-dessus est déjà prêt à l’appeler.',

  /* -------------------------------------------------------------- loading */
  'loading.title': 'Vérification en cours',
  'loading.step1': 'Validation de la saisie',
  'loading.step2': 'Interrogation de {count} sources',
  'loading.step3': 'Fusion et suppression des doublons',
  'loading.provider': 'Contact de {provider}…',
  'loading.elapsed': '{seconds} s écoulées',
  'loading.slow': 'Une source est lente. Nous abandonnons au-delà de 9 secondes et signalons l’état réel.',

  /* -------------------------------------------------------------- errors */
  'errors.title': 'Une erreur est survenue',
  'errors.network.title': 'Réseau indisponible',
  'errors.network.body':
    'La requête n’a pas atteint le serveur. Vérifiez votre connexion, puis réessayez.',
  'errors.timeout.title': 'Délai dépassé',
  'errors.timeout.body': 'Le service a mis trop de temps à répondre. Réessayez dans un instant.',
  'errors.rate_limited.title': 'Trop de requêtes',
  'errors.rate_limited.body':
    'Notre protection anti-abus limite le nombre de vérifications par minute. Réessayez dans {seconds} secondes.',
  'errors.server.title': 'Service momentanément indisponible',
  'errors.server.body': 'Le serveur n’a pas pu traiter la demande. Aucune donnée n’a été enregistrée.',
  'errors.invalid_response.title': 'Réponse inattendue',
  'errors.invalid_response.body':
    'Le serveur a renvoyé une réponse inexploitable. Nous préférons vous le dire plutôt que d’afficher un résultat douteux.',
  'errors.invalid_email.title': 'Adresse invalide',
  'errors.invalid_email.body': 'Vérifiez le format de l’adresse e-mail.',
  'errors.crash.title': 'Une erreur inattendue est survenue',
  'errors.crash.body':
    'Cette page n’a pas pu s’afficher. Vos données de recherche ne sont conservées nulle part, il suffit donc de recharger. Aucune information n’a été envoyée.',
  'errors.crash.reload': 'Recharger la page',
  'errors.generic.title': 'Échec de la vérification',
  'errors.generic.body': 'La vérification n’a pas pu aboutir. Réessayez dans un instant.',

  /* ---------------------------------------------------------- validation */
  'validation.email.required': 'Saisissez une adresse e-mail.',
  'validation.email.invalid': 'Cette adresse e-mail n’est pas valide (exemple : nom@domaine.fr).',
  'validation.email.tooLong': 'Cette adresse dépasse la longueur maximale autorisée.',
  'validation.username.required': 'Saisissez un nom d’utilisateur.',
  'validation.username.invalid':
    'Le pseudo doit contenir 3 à 64 caractères : lettres, chiffres, point, tiret ou tiret bas.',
  'validation.phone.required': 'Saisissez un numéro de téléphone.',
  'validation.phone.invalid': 'Ce numéro n’est pas valide pour le pays sélectionné.',
  'validation.phone.unrecognized': 'Numéro non reconnu. Vérifiez l’indicatif ou changez de pays.',
  'validation.password.required': 'Saisissez un mot de passe.',
  'validation.consent.required': 'Cochez la case de consentement pour continuer.',

  /* --------------------------------------------------------------- about */
  'about.title': 'À propos',
  'about.lede':
    'i have been leaked est un outil de vérification de fuites construit autour d’une idée simple : mieux vaut un résultat incomplet annoncé comme tel qu’un « tout va bien » rassurant et faux.',
  'about.why.title': 'Pourquoi cet outil',
  'about.why.body':
    'La plupart des vérificateurs affichent un résultat binaire et donnent l’impression qu’une absence de correspondance vaut garantie de sécurité. Ce n’est pas le cas : les index publics sont partiels et changent chaque jour. Nous affichons donc séparément ce que les sources ont répondu, et ce qu’elles n’ont pas pu dire.',
  'about.arch.title': 'Architecture',
  'about.arch.body':
    'Une application React/TypeScript, des fonctions Netlify côté serveur, et un adaptateur par fournisseur. Les clés d’API restent sur le serveur ; le navigateur ne dialogue qu’avec notre propre API, sauf pour la vérification de mot de passe où l’appel part directement vers l’API de plages.',
  'about.limits.title': 'Limites assumées',
  'about.limits.body':
    'Les recherches par pseudo et par numéro ne sont pas disponibles en V1 faute de source fiable et licite. La vérification d’adresse dépend de la disponibilité de XposedOrNot et d’Orelys. Les mots de passe ne sont jamais transmis, mais l’API de plages voit l’empreinte partielle et votre adresse IP.',
  'about.stack.title': 'Technique',
  'about.stack.body':
    'React 19, TypeScript, Vite, Tailwind CSS, icônes Lucide, fonctions Netlify. Aucune base de données, aucun compte, aucun traqueur.',
  'about.contact.title': 'Contact',
  'about.contact.body':
    'Signaler un bug, proposer une source ou demander une correction : ouvrez une issue sur le dépôt du projet.',

  /* ------------------------------------------------------------- privacy */
  'privacy.title': 'Politique de confidentialité',
  'privacy.updated': 'Dernière mise à jour : {date}',
  'privacy.lede':
    'Cette page décrit exactement ce qui est envoyé, ce qui est conservé et ce qui ne l’est pas. Elle est écrite pour être lue, pas pour couvrir juridiquement une collecte cachée.',
  'privacy.summary.title': 'En résumé',
  'privacy.summary.item1': 'Aucun compte, aucune base de données d’utilisateurs.',
  'privacy.summary.item2': 'Aucun historique de recherche, aucun cache de résultats personnels.',
  'privacy.summary.item3': 'Aucun traqueur publicitaire ni outil d’analytique tiers.',
  'privacy.summary.item4': 'Aucun mot de passe ni empreinte complète ne quitte votre navigateur.',
  'privacy.s1.title': 'Ce que nous ne collectons pas',
  'privacy.s1.body':
    'Nous ne créons pas de compte, ne posons pas de cookie de mesure d’audience, n’utilisons ni Google Analytics ni équivalent, et ne conservons pas les adresses recherchées. Il n’existe donc aucune base à laquelle nous pourrions vous rattacher.',
  'privacy.s2.title': 'Ce qui est transmis aux fournisseurs',
  'privacy.s2.body':
    'Lorsque vous lancez une vérification d’adresse et que vous y consentez, votre adresse est envoyée à XposedOrNot puis à Orelys (si configuré), depuis notre fonction serveur. Ces fournisseurs sont des tiers indépendants : ils voient l’adresse, l’adresse IP de notre fonction, et appliquent leur propre politique de conservation. Nous ne pouvons pas garantir l’anonymat de cette transmission.',
  'privacy.s2.xon': 'XposedOrNot — politique de confidentialité',
  'privacy.s2.orelys': 'Orelys — conditions et confidentialité',
  'privacy.s3.title': 'Mots de passe',
  'privacy.s3.body':
    'Le mot de passe est haché en SHA-1 dans votre navigateur. Seuls les cinq premiers caractères de l’empreinte sont envoyés à l’API de plages de Have I Been Pwned, qui renvoie plusieurs centaines d’empreintes. La comparaison finale a lieu localement. Le mot de passe et l’empreinte complète ne sont ni stockés, ni journalisés, ni transmis. Le champ est vidé après la vérification.',
  'privacy.s4.title': 'Journaux serveur',
  'privacy.s4.body':
    'La protection anti-abus compte les requêtes par adresse IP, sous forme d’un hachage salé qui change à chaque instance : l’IP brute n’est jamais écrite. Les journaux techniques ne contiennent aucun identifiant recherché ; toute erreur journalisée est filtrée pour retirer adresses e-mail et valeurs numériques longues.',
  'privacy.s5.title': 'Stockage local',
  'privacy.s5.body':
    'Un seul élément est conservé dans votre navigateur : votre préférence de langue (clé « ihl.language »). Aucun résultat de recherche, aucune adresse, aucun mot de passe n’y est écrit, ni dans localStorage, ni dans sessionStorage, ni dans un cookie.',
  'privacy.s6.title': 'Sécurité',
  'privacy.s6.body':
    'HTTPS exclusivement, en-têtes de sécurité stricts (CSP, HSTS, nosniff, Referrer-Policy), délais d’expiration sur tous les appels sortants, validation des entrées côté navigateur et côté serveur, limitation du débit pour prévenir l’abus, et aucune clé d’API exposée au client.',
  'privacy.s7.title': 'Vos droits',
  'privacy.s7.body':
    'Puisque nous ne conservons aucune donnée personnelle, il n’y a rien à consulter, exporter ou supprimer de notre côté. Pour les transmissions aux fournisseurs, les demandes doivent leur être adressées. Vous pouvez nous contacter via le dépôt du projet pour toute question.',
  'privacy.s8.title': 'Absence de garantie',
  'privacy.s8.body':
    'Un résultat négatif ne garantit pas qu’une donnée n’a pas fuité. Cet outil fournit une indication issue de sources publiques, à un instant donné.',

  /* ---------------------------------------------------------------- docs */
  'docs.title': 'Documentation',
  'docs.lede':
    'Architecture, API interne, variables d’environnement et procédure de déploiement. Tout ce qui est nécessaire pour faire tourner ce projet soi-même.',
  'docs.arch.title': 'Architecture',
  'docs.arch.body':
    'Le front (React + TypeScript + Vite) ne connaît aucun secret. Les fonctions Netlify orchestrent les fournisseurs, normalisent, fusionnent et calculent un état. Un adaptateur par fournisseur implémente la même interface, ce qui rend l’ajout d’une source isolé et testable.',
  'docs.api.title': 'API interne',
  'docs.api.checkEmail':
    'POST — { email: string, consent: true }. Renvoie un état (clean / breached / incomplete / error), les fuites fusionnées et l’état de chaque fournisseur. Jamais mis en cache.',
  'docs.api.passwordRange':
    'GET ?prefix=ABCDE — relais de l’API de plages HIBP. Reçoit uniquement 5 caractères d’empreinte.',
  'docs.api.providers':
    'GET — matrice des sources : capacités, disponibilité, configuration.',
  'docs.api.breachStats':
    'GET — agrégats publics (nombre de fuites, comptes exposés) issus de l’index XposedOrNot.',
  'docs.env.title': 'Variables d’environnement',
  'docs.env.orelys': 'ORELYS_API_KEY — active le fournisseur Orelys. Sans elle, la source est signalée « non configurée » et les résultats sont incomplets.',
  'docs.env.orelysHeader': 'ORELYS_API_KEY_HEADER / ORELYS_API_KEY_PREFIX — facultatif, si votre plan documente un autre en-tête d’authentification.',
  'docs.env.none': 'Aucune autre variable n’est requise. XposedOrNot et HIBP Pwned Passwords sont accessibles sans clé.',
  'docs.deploy.title': 'Déploiement',
  'docs.deploy.body':
    'Reliez le dépôt à Netlify : la configuration de netlify.toml (build, dossier de publication, fonctions, redirections, en-têtes) s’applique automatiquement. Ajoutez ORELYS_API_KEY dans les variables d’environnement du site, puis redéployez.',
  'docs.limits.title': 'Limites et abus',
  'docs.limits.body':
    'La limitation de débit est en mémoire, par instance de fonction. Pour une protection à l’échelle du parc, ajoutez une règle de limitation Netlify ou un compteur partagé (Netlify Blobs, Upstash) devant la fonction de vérification.',
  'docs.extend.title': 'Ajouter un fournisseur',
  'docs.extend.body':
    'Déclarer l’entrée dans netlify/lib/config.ts (endpoints, délai, clé, capacités), implémenter queryX dans netlify/lib/providers/, puis l’enregistrer dans la carte PROVIDER_QUERIES de checkEmail.ts. La normalisation, la fusion, l’affichage des états et la traduction sont déjà pris en charge.',

  /* -------------------------------------------------------------- footer */
  'footer.tagline':
    'Vérification de fuites, sans compte et sans conservation de vos données.',
  'footer.product': 'Vérifications',
  'footer.resources': 'Ressources',
  'footer.legal': 'Informations',
  'footer.sources': 'Sources de données',
  'footer.disclaimer':
    'Un résultat négatif ne garantit pas l’absence de fuite. Les sources publiques sont incomplètes.',
  'footer.rights': 'Projet open source. Aucune donnée personnelle collectée.',
  'footer.status': 'État des sources',

  /* ----------------------------------------------------------- not found */
  'notFound.title': 'Page introuvable',
  'notFound.body': 'Cette page n’existe pas ou a été déplacée.',
  'notFound.action': 'Retour à l’accueil',

  /* ----------------------------------------------------------- a11y only */
  'a11y.primaryNav': 'Navigation principale',
  'a11y.externalLink': 'ouvre un nouvel onglet',
  'a11y.results': 'Résultats de la vérification',
  'a11y.copyHash': 'Copier',
} satisfies Record<string, string>

export type TranslationKey = keyof typeof fr
export type Dictionary = Record<TranslationKey, string>
