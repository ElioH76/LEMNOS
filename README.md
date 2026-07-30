# Lemnos

Site vitrine et espace client pour Lemnos — vêtements et équipements de sport
personnalisés. Nouvelle direction artistique : Vert Littoral, anthracite,
Montserrat + Cinzel, angles nets.

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 3** — tokens en variables CSS (triplets RVB) dans
  `app/globals.css`, exposés via `tailwind.config.ts`
- **lucide-react** pour les icônes · fonts via `next/font/google`

## Structure

```
app/
  page.tsx                 Landing (/)
  espace-client/page.tsx   Espace client (/espace-client)
  layout.tsx · fonts.ts · globals.css
components/
  brand/                   Mark (logo SVG) + LogoLockup
  site/                    Sections de la landing
  dashboard/               Blocs de l'espace client
  layout/ · ui/            Shell, sidebar, boutons…
lib/                       types, mock-data, site-content, stats, theme
public/images/             Visuels (direction photo de la DA)
```

## Développement local

```bash
npm install
npm run dev
```

Le site tourne sur http://localhost:3000 · l'espace client sur
http://localhost:3000/espace-client.

Autres scripts : `npm run build` (build de production), `npm run typecheck`
(vérification TypeScript).

## Déploiement sur Vercel

Le projet est prêt pour un déploiement **zéro-config** :

1. Sur [vercel.com](https://vercel.com), **Add New → Project** et importer le
   dépôt `ElioH76/LEMNOS`.
2. Vercel détecte automatiquement Next.js. Laisser les réglages par défaut —
   **Root Directory** = racine du dépôt, build `next build`, aucune variable
   d'environnement requise.
3. **Deploy.**

Les pages sont prérendues en statique et les images servies via
l'optimisation d'images intégrée de Vercel (`next/image`, fichiers locaux dans
`public/`). La version de Node est fixée à 18.18+ (`.nvmrc` : 22).

## Espace admin & demandes

Le formulaire « Démarrer un projet » enregistre chaque demande, consultable et
gérable sur **`/admin`** (liste, filtres par statut, changement de statut,
suppression). Voir `.env.example` pour les variables.

**1. Mot de passe admin (obligatoire pour accéder à `/admin`)**

```
ADMIN_PASSWORD=un-mot-de-passe-solide
```

En local, le mettre dans `.env.local`. Sur Vercel : *Project Settings →
Environment Variables*.

**2. Base de données (persistance des demandes)**

Sans base, les demandes sont conservées **en mémoire** et perdues au
redéploiement (un bandeau le signale dans l'admin). Pour activer la
persistance :

1. Dans le dashboard Vercel, onglet **Storage → Create Database → Postgres**
   (Neon), et le lier au projet.
2. Vercel injecte automatiquement `DATABASE_URL` / `POSTGRES_URL`. Le code les
   détecte et crée la table `demands` au premier appel — rien d'autre à faire.

**3. Stockage de fichiers (Vercel Blob)**

Pour téléverser des fichiers (logos clients aujourd'hui ; designs et médiathèque à
venir) plutôt que de coller des URL :

1. Dashboard Vercel → **Storage → Create Database → Blob**, lié au projet.
2. Vercel injecte automatiquement `BLOB_READ_WRITE_TOKEN`. En local, copier ce
   jeton dans `.env.local`.

Sans jeton, l'app reste pleinement fonctionnelle : les champs image retombent sur
une **saisie d'URL manuelle**.

Le store est en **accès privé** (les fichiers ne sont jamais publics — important
pour des designs clients confidentiels) :

- **Upload** : direct navigateur → Blob via `app/api/blob/upload/route.ts`, qui
  délivre un jeton court après contrôle de session admin (types + taille 10 Mo).
  Composant client `components/admin/LogoUpload.tsx` (`access: "private"`).
- **Lecture** : les URL Blob privées ne sont pas accessibles publiquement (403).
  L'affichage passe par le proxy authentifié `app/api/blob/file/route.ts` (vérifie
  la session admin, streame le fichier, restreint aux hôtes Blob Vercel contre le
  SSRF). Helper d'URL `lib/blob/url.ts` (`blobDisplaySrc`), helpers serveur
  `lib/blob/store.ts` (`isBlobConfigured`, `deleteBlob`).

## Admin — logiciel de gestion (en construction)

L'administration évolue vers un vrai outil de gestion, par modules successifs,
sans changer le design.

- **Tableau de bord** (`/admin`) : indicateurs (clients, devis en attente,
  factures impayées, commandes en cours), chiffre d'affaires mois/année/total,
  graphique de CA mensuel. Agrégats calculés dans `lib/billing/stats.ts` (pur,
  réutilisable), tuiles `StatTile` et `RevenueChart` réutilisables.
- Le logo officiel (`public/images/logo/LEMNOS.svg`) alimente l'emblème
  `components/brand/Mark.tsx` (currentColor), donc header admin, connexion,
  sidebar, PDF et favicon.

- **CRM clients** (`/admin/clients`) : fiche par client (coordonnées,
  couleurs principales, notes internes, logo par URL), historique des factures
  lié (par `clientId`, ou par nom en repli), liste avec recherche.
  Créer une facture pour un nouveau client crée sa fiche automatiquement ;
  le bouton « Nouvelle facture » d'une fiche pré-remplit le client.

Modules à venir (architecture prête) : designs + fichiers, médiathèque,
historique de versions, fournisseurs, statistiques. Le stockage de fichiers
(designs, logos clients, médiathèque) nécessitera Vercel Blob.

## Workflow de commande (admin)

Module intégré à l'admin (`/admin/commandes`) : chaque commande suit un pipeline
linéaire de **5 états** — Design → Validation client → Production → Expédition →
Livré. Chaque changement d'état est horodaté et forme la **timeline** visible sur
la fiche commande (avec note optionnelle par jalon : maquette envoyée, n° de
suivi…).

- **Liste** (`/admin/commandes`) : filtres par état (onglets + compteurs), cartes
  avec frise d'avancement et bouton « étape suivante » en un clic.
- **Fiche** (`/admin/commandes/[id]`) : frise complète (`OrderStepper`), détails,
  timeline (`OrderTimeline`), pilotage de l'avancement (`OrderStatusControls` —
  étape suivante ou saut direct, avec note), liens vers la fiche client et la
  facture éventuellement liées.
- **Création / édition** : lien optionnel vers une fiche client (snapshot du nom)
  et vers une facture ; le bouton « Nouvelle commande » d'une fiche client
  pré-remplit le client. Numérotation `CMD-AAAA-0001`.
- Persistance : table Postgres/Neon `orders` (objet complet en `jsonb`), créée
  automatiquement ; repli mémoire sans base. Store `lib/orders/store.ts`, types
  et helpers de pipeline dans `lib/orders/types.ts`, actions serveur
  `app/actions/orders.ts`.
- Le tableau de bord branche sa tuile « Commandes en cours » sur les commandes
  non livrées, et la fiche client affiche l'historique réel des commandes.

## Facturation (admin)

Module intégré à l'admin (`/admin/factures`) : liste (recherche, tri, filtres,
pagination), création/édition (client enregistré ou nouveau, lignes illimitées
avec calcul temps réel, remises, TVA, livraison, acompte), **PDF premium**
généré à la volée (`@react-pdf/renderer`), duplication, statuts, et **modèles
produits** réutilisables.

- Les coordonnées LEMNOS vivent dans `lib/settings/company.ts` (source unique).
  **À compléter** : `siret`, `tvaIntra`, `iban`, `bic` (laissés vides, omis
  proprement du PDF tant qu'ils le sont).
- Persistance : mêmes tables Postgres/Neon que les demandes (`billing_*`),
  créées automatiquement ; repli mémoire sans base.
- Architecture pensée pour la suite (devis, avoirs, paiements partiels,
  relances, export comptable) : `documentType` extensible, calculs isolés dans
  `lib/billing/calc.ts`, store modulaire.
- L'envoi par email est préparé (bouton présent) mais désactivé — nécessite un
  service type Resend, comme le stockage de fichiers.

## À compléter

- Le contenu de la landing (réalisations, textes, `bonjour@lemnos.fr`) est du
  placeholder cohérent avec la DA — à remplacer par les vraies données.
- Les données de l'espace client sont mockées dans `lib/mock-data.ts`, typées
  pour brancher une API : remplacer les imports par des `fetch` dans les Server
  Components.
