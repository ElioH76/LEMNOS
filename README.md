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

## À compléter

- Le contenu de la landing (réalisations, textes, `bonjour@lemnos.fr`) est du
  placeholder cohérent avec la DA — à remplacer par les vraies données.
- Les données de l'espace client sont mockées dans `lib/mock-data.ts`, typées
  pour brancher une API : remplacer les imports par des `fetch` dans les Server
  Components.
