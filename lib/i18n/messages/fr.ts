import type { Messages } from "./en";

/** Le type `Messages` impose la même liste de clés que le catalogue anglais. */
export const fr: Messages = {
  // Chrome
  "nav.home": "Accueil",
  "nav.movies": "Films",
  "nav.series": "Séries",
  "nav.catalog": "Catalogue",
  "nav.new": "Nouveautés",
  "nav.search": "Recherche",
  "nav.label": "Navigation principale",
  "nav.searchLabel": "Recherche",
  "footer.tmdb":
    "Ce produit utilise l’API TMDB sans être approuvé ni certifié par TMDB.",

  // Session menu
  "session.account": "Compte de {name}",
  "session.favorites": "Favoris",
  "session.watchlist": "À voir plus tard",
  "session.history": "Historique",
  "session.lists": "Mes listes",
  "session.library": "Bibliothèque",
  "session.settings": "Paramètres",
  "session.myAccount": "Mon compte",
  "session.admin": "Administration",
  "session.linkDiscord": "Lier Discord",
  "session.signOut": "Se déconnecter",
  "session.signIn": "Connexion",
  "session.signUp": "S’inscrire gratuitement",
  "session.language": "Langue",

  // Command menu
  "command.placeholder": "Rechercher un film, une série, une personne…",
  "command.trigger": "Rechercher…",
  "command.dialogLabel": "Rechercher un film, une série ou une personne",
  "command.people": "Personnes",
  "command.titles": "Films & séries",
  "command.recent": "Recherches récentes",
  "command.suggestions": "Suggestions",
  "command.forget": "Retirer « {term} » de l’historique",
  "command.hint": "Tapez le titre d’un film, d’une série ou un nom.",
  "command.searching": "Recherche…",
  "command.noResults": "Aucun résultat pour « {term} »",

  // Media
  "media.movie": "Film",
  "media.tv": "Série",
  "media.person": "Personne",
  "media.seasonCount": "{count} saison",
  "media.seasonCount.plural": "{count} saisons",
  "media.episodeCount": "{count} épisode",
  "media.episodeCount.plural": "{count} épisodes",
  "media.runtime": "{hours} h {minutes}",
  "media.runtimeMinutes": "{minutes} min",

  // Home
  "home.continue": "Reprendre",
  "home.top10": "Top 10 de la semaine",
  "home.becauseYouWatched": "Parce que vous avez regardé {title}",
  "home.forYou": "Pour vous",
  "home.fromPeopleYouFollow": "Des personnes que vous suivez",
  "home.viewersLikeYou": "Ceux qui regardent comme vous ont aussi vu",
  "home.newReleases": "Nouveautés",
  "home.popularMovies": "Films populaires",
  "home.popularSeries": "Séries populaires",
  "home.topRated": "Les mieux notés",
  "home.seeAll": "Voir tout",
  "home.scrollLeft": "Faire défiler vers la gauche",
  "home.scrollRight": "Faire défiler vers la droite",
  "home.rank": "N°{rank} : {title}",

  // Foundation notice
  "notice.title": "Site en cours de fondation",
  "notice.body":
    "JUST est encore en construction : il se peut qu’il n’y ait pas toutes les séries et tous les films au catalogue.",
  "notice.dismiss": "J’ai compris",

  // Detail page
  "detail.watch": "Regarder",
  "detail.rewatch": "Revoir",
  "detail.resume": "Reprendre S{season} E{episode}",
  "detail.playNext": "Lire S{season} E{episode}",
  "detail.adsWarning":
    "Le lecteur vient d’un tiers : vos deux premiers clics ouvriront chacun un onglet de publicité. Fermez-les et revenez, la lecture continue ici.",
  "detail.adsWarningDismiss": "Masquer l’avertissement",
  "detail.nextEpisode": "Épisode suivant",
  "detail.upNext": "À suivre : {label}",
  "detail.releaseOn": "Sortie le {date}",
  "detail.releaseUnknown": "Date de sortie inconnue",
  "detail.synopsis": "Synopsis",
  "detail.noSynopsis": "Aucun synopsis disponible.",
  "detail.trailer": "Bande-annonce",
  "detail.cast": "Distribution",
  "detail.recommendations": "Recommandations",
  "detail.episodes": "Épisodes",
  "detail.noEpisodes": "Aucun épisode pour cette saison.",
  "detail.episodesShort": "{count} ép.",
  "detail.seasonFallback": "Saison {number}",
  "detail.unreleasedEpisode": "À venir",
  "detail.markWatched": "Marquer comme vu",
  "detail.markWatchedLabel":
    "Marquer « {title} » comme vu et le retirer de Reprendre",
  "detail.favoriteAdd": "Ajouter aux favoris",
  "detail.favoriteRemove": "Dans mes favoris",
  "detail.favoriteAddLabel": "Ajouter « {title} » aux favoris",
  "detail.favoriteRemoveLabel": "Retirer « {title} » des favoris",
  "detail.watchlistAdd": "À voir plus tard",
  "detail.watchlistRemove": "Dans ma liste",
  "detail.watchlistAddLabel": "Ajouter « {title} » à la liste à voir plus tard",
  "detail.watchlistRemoveLabel": "Retirer « {title} » de la liste à voir plus tard",
  "detail.trailerPlay": "Lire la bande-annonce de {title}",

  // Where to watch
  "watch.title": "Où regarder",
  "watch.flatrate": "Compris dans l’abonnement",
  "watch.free": "Gratuit",
  "watch.ads": "Gratuit avec publicité",
  "watch.rent": "Location",
  "watch.buy": "Achat",
  "watch.allOffers": "Voir toutes les offres",
  "watch.region":
    "Disponibilités pour la France ({region}) · données JustWatch via TMDB",

  // Person page
  "person.biography": "Biographie",
  "person.knownFor": "Connu pour",
  "person.filmography": "Filmographie",
  "person.crew": "Derrière la caméra",
  "person.notFound": "Personne introuvable",
  "person.portrait": "Portrait : {name}",
  "person.follow": "Suivre",
  "person.following": "Suivi",
  "person.followLabel": "Suivre {name}",
  "person.unfollowLabel": "Ne plus suivre {name}",
  "person.department.Acting": "Interprétation",
  "person.department.Directing": "Réalisation",
  "person.department.Writing": "Scénario",
  "person.department.Production": "Production",
  "person.department.Sound": "Son",
  "person.department.Camera": "Image",
  "person.department.Editing": "Montage",
  "person.department.Art": "Décors",
  "person.department.CostumeMakeUp": "Costumes & maquillage",
  "person.department.VisualEffects": "Effets visuels",
  "person.department.Crew": "Équipe technique",

  // Catalogue
  "catalog.movies.title": "Films",
  "catalog.movies.description": "Parcourez le catalogue de films.",
  "catalog.series.title": "Séries",
  "catalog.series.description": "Parcourez le catalogue de séries.",
  "catalog.filters": "Filtres",
  "catalog.genres": "Genres",
  "catalog.sort": "Trier par",
  "catalog.sort.popularity": "Popularité",
  "catalog.sort.rating": "Note",
  "catalog.sort.year": "Année de sortie",
  "catalog.sort.title": "Titre",
  "catalog.reset": "Réinitialiser les filtres",
  "catalog.empty": "Aucun résultat",
  "catalog.emptyHint": "Aucun titre ne correspond à cette combinaison de filtres.",
  "catalog.previous": "Précédent",
  "catalog.next": "Suivant",
  "catalog.page": "Page {page} sur {total}",
  "catalog.pagination": "Pagination",

  // New releases
  "new.title": "Nouveautés",
  "new.description":
    "Ce qui sort, ce qui passe, et les épisodes attendus de vos séries.",
  "new.upcomingEpisodes": "Vos prochains épisodes",
  "new.nowPlaying": "À l’affiche",
  "new.upcomingMovies": "Bientôt au cinéma",
  "new.airingToday": "Diffusées aujourd’hui",
  "new.onTheAir": "Séries en cours",

  // Search
  "search.title": "Recherche",
  "search.placeholder": "Titre d’un film, d’une série ou un nom…",
  "search.label": "Rechercher un film, une série ou une personne",
  "search.submit": "Rechercher",
  "search.prompt": "Que cherchez-vous ?",
  "search.promptHint":
    "Tapez le titre d’un film, d’une série ou un nom pour lancer la recherche.",
  "search.noResults": "Aucun résultat pour « {query} »",
  "search.noResultsHint": "Vérifiez l’orthographe, ou essayez le titre original.",
  "search.people": "Personnes",
  "search.moviesAndSeries": "Films & séries",
  "search.seeAll": "Voir plus",
  "search.backToResults": "Retour aux résultats",
  "search.allTitles": "Tous les films et séries pour « {query} »",
  "search.allPeople": "Toutes les personnes pour « {query} »",
  "search.titles": "{count} film ou série pour « {query} »",
  "search.titles.plural": "{count} films ou séries pour « {query} »",
  "search.results": "{count} résultat pour « {query} »",
  "search.results.plural": "{count} résultats pour « {query} »",
  "search.corrected": "Rien pour « {query} » — voici « {corrected} »",
  "search.filterTitles": "Titres seuls",
  "search.filterPeople": "Personnes seules",

  // Favorites
  "favorites.title": "Favoris",
  "favorites.description": "Vos films et séries enregistrés.",
  "favorites.descriptionLong":
    "Vos films et séries enregistrés, liés à votre compte.",
  "favorites.signInRequired": "Connexion requise",
  "favorites.signInHint":
    "Connectez-vous pour retrouver vos favoris sur tous vos appareils.",
  "favorites.empty": "Aucun favori",
  "favorites.emptyHint":
    "Touchez le cœur sur une affiche ou une fiche pour l’ajouter ici.",
  "favorites.browse": "Parcourir les films",
  "favorites.missing": "Favoris introuvables",
  "favorites.missingHint":
    "Les titres enregistrés ne sont plus disponibles sur TMDB.",
  "favorites.configRequired": "Configuration requise",
  "favorites.configHint":
    "Les favoris ont besoin de SUPABASE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL et TMDB_API_KEY dans .env.local.",

  // Watchlist
  "watchlist.title": "À voir plus tard",
  "watchlist.description": "Les titres que vous avez mis de côté.",
  "watchlist.descriptionLong":
    "Les titres que vous avez mis de côté, liés à votre compte.",
  "watchlist.signInRequired": "Connexion requise",
  "watchlist.signInHint":
    "Connectez-vous pour retrouver votre liste sur tous vos appareils.",
  "watchlist.empty": "Rien de mis de côté",
  "watchlist.emptyHint":
    "Touchez le marque-page sur une affiche ou une fiche pour le garder pour plus tard.",
  "watchlist.browse": "Parcourir les films",
  "watchlist.missing": "Liste introuvable",
  "watchlist.missingHint":
    "Les titres enregistrés ne sont plus disponibles sur TMDB.",
  "watchlist.configRequired": "Configuration requise",
  "watchlist.configHint":
    "La liste à voir plus tard a besoin de SUPABASE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL et TMDB_API_KEY dans .env.local.",

  // History
  "history.title": "Historique",
  "history.description": "Tout ce que vous avez lancé.",
  "history.descriptionLong":
    "Tout ce que vous avez lancé, du plus récent au plus ancien.",
  "history.signInRequired": "Connexion requise",
  "history.signInHint":
    "Connectez-vous pour retrouver votre historique sur tous vos appareils.",
  "history.empty": "Rien de visionné",
  "history.emptyHint": "Les titres que vous lancez apparaissent ici.",
  "history.browse": "Parcourir les films",
  "history.configRequired": "Configuration requise",
  "history.configHint":
    "L’historique a besoin de SUPABASE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL et TMDB_API_KEY dans .env.local.",
  "history.previous": "Plus récent",
  "history.next": "Plus ancien",
  "history.clearAll": "Vider l’historique",
  "history.clearTitle": "Vider tout votre historique ?",
  "history.clearHint":
    "Toutes vos reprises de lecture sont supprimées, sur tous vos appareils. C’est irréversible.",
  "history.clearCancel": "Annuler",
  "history.clearConfirm": "Tout effacer",

  // Lists
  "lists.title": "Mes listes",
  "lists.descriptionLong":
    "Regroupez des titres à votre façon, et partagez une liste quand vous le souhaitez.",
  "lists.titleLabel": "Nom de la liste",
  "lists.titlePlaceholder": "Nommez votre liste",
  "lists.descriptionLabel": "Description de la liste",
  "lists.descriptionPlaceholder": "Décrivez-la en une ligne (facultatif)",
  "lists.create": "Créer la liste",
  "lists.count": "{count} titre",
  "lists.count.plural": "{count} titres",
  "lists.public": "Publique",
  "lists.private": "Privée",
  "lists.copyLink": "Copier le lien",
  "lists.copied": "Lien copié",
  "lists.delete": "Supprimer",
  "lists.deleteLabel": "Supprimer la liste « {title} »",
  "lists.empty": "Aucune liste. Créez-en une ci-dessus.",
  "lists.signInRequired": "Connexion requise",
  "lists.signInHint": "Connectez-vous pour composer et partager vos listes.",
  "lists.configRequired": "Configuration requise",
  "lists.configHint":
    "Les listes ont besoin de SUPABASE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL et TMDB_API_KEY dans .env.local.",
  "lists.by": "Une liste de {name}",
  "lists.emptyList": "Cette liste est encore vide.",
  "lists.notFound": "Liste introuvable",
  "lists.notFoundHint":
    "Elle a peut-être été supprimée, ou n’est plus publique.",
  "lists.addTo": "Ajouter à une liste",
  "lists.noLists": "Aucune liste",
  "lists.manage": "Gérer mes listes",

  // Account
  "account.title": "Mon compte",
  "account.description": "Mot de passe, comptes liés et préférences.",
  "account.signInRequired": "Connexion requise",
  "account.signInHint": "Connectez-vous pour gérer votre compte.",
  "account.signIn": "Se connecter",
  "account.noDatabase": "Base de données non configurée",
  "account.noDatabaseHint":
    "Les réglages de compte ont besoin des variables Supabase dans .env.local.",
  "account.notFound": "Compte introuvable",
  "account.notFoundHint":
    "Votre session ne correspond à aucun compte. Déconnectez-vous puis reconnectez-vous.",
  "account.signInAgain": "Se reconnecter",
  "account.noEmail": "Aucune adresse e-mail",
  "account.plan": "Mon offre",
  "account.usageFree":
    "{movies} / {limit} films · {series} / {seriesLimit} série",
  "account.usageGold":
    "{movies} / {limit} films ce mois-ci · séries illimitées",
  "account.password": "Mot de passe",
  "account.addPassword": "Ajouter un mot de passe",
  "account.passwordHint":
    "Changez le mot de passe utilisé pour la connexion par e-mail.",
  "account.addPasswordHint":
    "Définissez un mot de passe pour vous connecter sans passer par Discord.",
  "account.discord": "Discord",
  "account.discordLinked": "Votre compte Discord est rattaché.",
  "account.discordLink": "Rattachez Discord pour vous connecter en un clic.",
  "account.discordLinkedShort": "Compte lié",
  "account.discordUnavailable":
    "Connexion Discord non configurée sur ce serveur.",
  "account.language": "Langue",
  "account.languageHint": "Langue de l’interface et des contenus TMDB.",
  "account.searchHistory": "Historique de recherche",
  "account.searchHistoryHint":
    "Vos recherches récentes sont conservées dans ce navigateur uniquement.",
  "account.searchHistoryCount": "{count} recherche enregistrée",
  "account.searchHistoryCount.plural": "{count} recherches enregistrées",
  "account.searchHistoryEmpty": "Aucune recherche enregistrée.",
  "account.clearSearchHistory": "Effacer l’historique de recherche",
  "account.searchHistoryCleared": "Historique de recherche effacé.",
  "account.error.linked":
    "Ce compte Discord est déjà rattaché à un autre compte JUST.",
  "account.error.database": "Base de données injoignable. Réessayez plus tard.",
  "account.error.denied": "Liaison annulée sur Discord.",
  "account.error.state":
    "Lien de liaison expiré ou invalide. Relancez l’opération.",

  // Roles
  "role.user": "Gratuit",
  "role.gold": "Gold",
  "role.platinum": "Platine",
  "role.admin": "Administrateur",
  "role.summary.user":
    "3 visionnages de films et 1 série complète. Prends l’abonnement non ?",
  "role.summary.gold":
    "Toutes les séries, 5 films par mois. Merci pour le coup de main !",
  "role.summary.platinum": "Tout le catalogue, sans limite. Merci pour votre soutien !",
  "role.summary.admin": "Tout le catalogue, plus l’administration.",

  // Playback denials
  "playback.anonymous": "Connectez-vous pour lancer la lecture.",
  "playback.movieQuota":
    "Vos films gratuits sont épuisés. Passez à Gold ou Platine pour continuer.",
  "playback.seriesQuota":
    "L’offre gratuite couvre une seule série. Passez à Gold pour toutes les séries.",
  "playback.monthlyQuota":
    "Vos films du mois sont épuisés. Passez à Platine pour un accès illimité.",
  "playback.unavailable":
    "Aucune source de lecture n’est configurée sur ce serveur.",
  "playback.database": "Base de données injoignable. Réessayez plus tard.",
  "playback.accessTitle": "Lecture indisponible",
  "playback.close": "Fermer",

  // Authentication
  "auth.title": "Connexion",
  "auth.subtitle":
    "E-mail et mot de passe, ou Discord. Votre liste de favoris suit votre compte.",
  "auth.signedIn": "Déjà connecté",
  "auth.signedInAs": "Connecté en tant que",
  "auth.continue": "Continuer",
  "auth.or": "ou",
  "auth.forgotPassword": "Mot de passe oublié ?",
  "auth.passwordChanged":
    "Mot de passe modifié. Connectez-vous avec le nouveau.",
  "auth.email": "Adresse e-mail",
  "auth.password": "Mot de passe",
  "auth.name": "Pseudo",
  "auth.signInTab": "Connexion",
  "auth.signUpTab": "Inscription",
  "auth.submitSignIn": "Se connecter",
  "auth.submitSignUp": "Créer mon compte",
  "auth.pending": "Un instant…",
  "auth.discord": "Continuer avec Discord",
  "auth.discordLink": "Lier mon compte Discord",
  "auth.notConfigured": "Connexion non configurée",
  "auth.notConfiguredIntro":
    "Générez une clé de signature de session :",
  "auth.notConfiguredEnv":
    "Ajoutez-la dans .env.local, avec les identifiants Discord si vous voulez aussi ce mode de connexion :",
  "auth.notConfiguredRestart": "Relancez ensuite",
  "auth.configRequired": "Configuration requise",
  "auth.error.denied": "Connexion annulée sur Discord.",
  "auth.error.state": "Lien de connexion expiré ou invalide. Relancez la connexion.",
  "auth.error.discord": "Discord n’a pas pu confirmer votre identité. Réessayez.",
  "auth.error.config": "La connexion Discord n’est pas configurée sur ce serveur.",
  "auth.error.database":
    "Compte impossible à enregistrer : base de données injoignable ou schéma manquant.",

  // Password reset
  "reset.requestTitle": "Mot de passe oublié",
  "reset.requestSubtitle":
    "Indiquez l’adresse de votre compte : nous vous enverrons un lien pour en choisir un nouveau.",
  "reset.requestSubmit": "Envoyer le lien",
  "reset.requestPending": "Envoi…",
  "reset.sent":
    "Si un compte existe avec cette adresse, un lien de réinitialisation vient d’être envoyé. Il est valable une heure.",
  "reset.backToSignIn": "Retour à la connexion",
  "reset.title": "Nouveau mot de passe",
  "reset.subtitle": "Choisissez un mot de passe, puis reconnectez-vous.",
  "reset.newPassword": "Nouveau mot de passe",
  "reset.confirm": "Confirmation",
  "reset.submit": "Changer le mot de passe",
  "reset.pending": "Un instant…",
  "reset.askNewLink": "Demander un nouveau lien",
  "reset.incompleteLink":
    "Ce lien est incomplet. Refaites une demande pour en recevoir un nouveau.",
  "reset.requestLink": "Demander un lien",
  "reset.mailSubject": "Réinitialiser votre mot de passe JUST",
  "reset.mailGreeting": "Bonjour {name},",
  "reset.mailBody":
    "Vous avez demandé à réinitialiser votre mot de passe JUST.",
  "reset.mailValidity": "Ce lien est valable {minutes} minutes :",
  "reset.mailIgnore":
    "Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.",

  // Form validation
  "form.currentPassword": "Mot de passe actuel",
  "form.newPassword": "Nouveau mot de passe",
  "form.passwordPlaceholder": "8 caractères minimum",
  "form.confirmPlaceholder": "Retapez le mot de passe",
  "form.emailPlaceholder": "vous@exemple.com",
  "form.setPassword": "Définir le mot de passe",
  "form.changePassword": "Changer le mot de passe",
  "form.passwordSet":
    "Mot de passe défini. Vous pouvez maintenant vous connecter avec votre e-mail.",
  "form.passwordChanged": "Mot de passe modifié.",
  "error.invalidEmail": "Adresse e-mail invalide.",
  "error.invalidCredentials": "Adresse e-mail ou mot de passe invalide.",
  "error.wrongCredentials": "Adresse e-mail ou mot de passe incorrect.",
  "error.wrongCurrentPassword": "Mot de passe actuel incorrect.",
  "error.passwordTooShort":
    "Le mot de passe doit faire au moins {min} caractères.",
  "error.passwordMismatch": "Les deux mots de passe ne correspondent pas.",
  "error.nameTooShort": "Le pseudo doit faire au moins 2 caractères.",
  "error.emailTaken": "Un compte existe déjà avec cette adresse.",
  "error.signInNotConfigured":
    "La connexion par mot de passe n’est pas configurée.",
  "error.signUpNotConfigured": "La création de compte n’est pas configurée.",
  "error.noDatabase": "Base de données non configurée.",
  "error.sessionExpired": "Session expirée. Reconnectez-vous.",
  "error.accountNotFound": "Compte introuvable.",
  "error.databaseUnreachable": "Base de données injoignable. Réessayez.",
  "error.resetInvalid": "Lien de réinitialisation invalide.",
  "error.resetExpired": "Lien expiré ou déjà utilisé. Refaites une demande.",
  "error.tooManyAttempts":
    "Trop de tentatives. Réessayez dans quelques minutes.",
  "error.resetNotConfigured":
    "Réinitialisation indisponible : NEXT_PUBLIC_APP_URL n'est pas définie.",

  // Administration
  "admin.title": "Administration",
  "admin.description": "Index des comptes et modification des informations.",
  "admin.search": "Rechercher",
  "admin.searchPlaceholder": "Pseudo ou e-mail",
  "admin.newUser": "Nouveau compte",
  "admin.new": "Nouveau",
  "admin.name": "Pseudo",
  "admin.namePlaceholder": "Pseudo affiché",
  "admin.email": "Adresse e-mail",
  "admin.emailNone": "Aucune adresse",
  "admin.role": "Offre",
  "admin.discord": "Discord",
  "admin.linkedAccount": "Compte lié",
  "admin.actions": "Actions",
  "admin.edit": "Modifier",
  "admin.empty": "Aucun compte ne correspond à cette recherche.",
  "admin.accountCount": "{count} compte",
  "admin.accountCount.plural": "{count} comptes",
  "admin.newPasswordPlaceholder": "Laisser vide pour ne pas changer",
  "admin.saving": "Enregistrement…",
  "admin.creating": "Création…",
  "admin.page": "Page {page} sur {total}",
  "admin.editTitle": "Modifier le compte",
  "admin.editDescription": "Nom, adresse e-mail et rôle.",
  "admin.createTitle": "Nouveau compte",
  "admin.createDescription": "Créez un compte avec un mot de passe.",
  "admin.save": "Enregistrer",
  "admin.create": "Créer le compte",
  "admin.saved": "Compte mis à jour.",
  "admin.created": "Compte créé.",
  "admin.back": "Retour à l’index",

  // Errors and empty states
  "error.title": "Une erreur est survenue",
  "error.body": "Cette page n’a pas pu s’afficher. Réessayez.",
  "error.retry": "Réessayer",
  "notFound.title": "Page introuvable",
  "notFound.body": "Ce lien ne mène à rien sur JUST.",
  "notFound.home": "Retour à l’accueil",

  // Setup notice
  "setup.title": "Configuration requise",
  "setup.body":
    "Ajoutez votre clé TMDB dans .env.local, puis relancez le serveur de développement.",

  "setup.tmdbMissing": "Clé API TMDB manquante",
  "setup.step1": "Créez un compte gratuit sur",
  "setup.step2": "Récupérez une clé dans Paramètres → API",
  "setup.step3": "Créez un fichier .env.local à la racine du projet :",
  "setup.restart": "Relancez ensuite",
  "hero.moreInfo": "Plus d’infos",
  "playback.myPlan": "Voir mon offre",
  "detail.trailerTitle": "Bande-annonce : {title}",

  "error.digest": "digest : {digest}",
  "error.hint":
    "Le contenu n’a pas pu être chargé. Réessayez — si le problème persiste, il vient probablement de l’API TMDB.",
  "notFound.code": "Erreur 404",
  "notFound.hint": "Le contenu que vous cherchez n’existe pas ou a été déplacé.",
  "notFound.search": "Rechercher un titre",
  "admin.allAccounts": "Tous les comptes",
  "admin.discordLinked": "Discord lié",
  "admin.discordMissing": "Sans Discord",
  "admin.passwordSet": "Mot de passe défini",
  "admin.passwordMissing": "Sans mot de passe",
  "admin.createHint":
    "Le compte est créé avec un mot de passe, connectable immédiatement.",

  "auth.namePlaceholder": "Votre pseudo",
  "auth.noAccount": "Pas encore de compte ?",
  "auth.createAccount": "Créer un compte",
  "auth.haveAccount": "Déjà un compte ?",

  // Theme
  "theme.toggle": "Changer de thème",
  "theme.light": "Clair",
  "theme.dark": "Sombre",
};
