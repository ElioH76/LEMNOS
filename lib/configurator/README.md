# Configurateur 3D — architecture

Page : **`/configurateur`** (lien « Configurateur 3D » dans la navigation du site).
Stack : React Three Fiber 9 + drei 10 + three 0.186. Le code 3D n'est chargé que
sur cette page (import dynamique, rendu client uniquement).

```
lib/configurator/              ← logique pure, partagée client + serveur
  types.ts                     DesignConfig (ce que le client peut modifier)
  models/                      définitions produit (géométrie, zones, logos Lemnos verrouillés)
  brand.ts                     logo officiel (public/images/logo/LEMNOS.svg) + cadrages
  layout.ts                    rectangles d'impression, bornage, contrôle d'intégrité
  validate.ts                  sanitizeDesign : liste blanche + bornes (imports, liens, serveur)
  options.ts · defaults.ts · pricing.ts · share.ts · summary.ts
components/configurator/       ← interface
  Configurator.tsx             état, mise en page 3 zones / mobile, sauvegarde, export
  steps.tsx · Summary.tsx · QuoteDialog.tsx · ExportDialog.tsx · ui.tsx
  upload.ts                    import sécurisé des logos (rastérisation PNG, SVG jamais injecté)
  three/                       moteur 3D (géométrie procédurale, peinture des textures,
                               projection des décalcomanies, caméra, capture)
app/actions/configurator.ts    demande de devis (revalidation serveur, Blob, email)
```

## Logos Lemnos (obligatoires)

Les trois emplacements `lemnos_front_chest`, `lemnos_back_neck`, `lemnos_back_hem`
sont définis dans `models/jersey-ss.ts` (positions, hauteurs, ressource) et gelés
(`deepFreeze`). Ils **ne font pas partie de `DesignConfig`** : seule
`lemnosLogoColor` y figure. Aucune action de l'interface (`components/configurator/state.ts`)
ne les concerne, et `sanitizeDesign` ignore toute clé inconnue → un JSON importé ou un
lien partagé ne peut ni les déplacer, ni les masquer. `layout.ts → modelConflicts`
vérifie qu'aucune zone client ou de flocage ne les chevauche.

## Modèle 3D : démonstration → production

Le maillot actuel est **procédural** (`three/jerseyGeometry.ts`) : volumes et
placements corrects, mais pas un patron textile. Pour passer en production, il faut
fournir **un fichier GLB** (à déposer dans `public/models/`) :

- maillages nommés `torso`, `sleeveLeft`, `sleeveRight`, `collar` ;
- UV du corps : u = 0 et 0.5 aux flancs, 0.25 milieu devant, 0.75 milieu dos ;
  v = 0 à l'ourlet, 1 aux épaules (manches : u autour, v de l'épaule au poignet) ;
- échelle en mètres, y vers le haut, face avant vers +z ; < 3 Mo, textures ≤ 2048 px ;
- idéalement une carte de normales de maille et une d'occlusion.

Il suffira alors d'ajouter la variante `{ kind: "gltf", url }` dans le rendu
(`three/Jersey.tsx`) ; les emplacements (logos, flocage, zones client) se projettent
par lancer de rayon et fonctionnent sur n'importe quel maillage.

## Variables d'environnement

- `BLOB_READ_WRITE_TOKEN` : aperçus et logos des demandes stockés en privé dans Blob
  (sinon gardés en data URL dans la demande).
- `DATABASE_URL` : persistance des demandes (sinon mémoire).
- `RESEND_API_KEY` + `EMAIL_FROM` : email de notification à chaque demande.
- `CONFIGURATOR_NOTIFY_EMAIL` (facultatif) : destinataire de cette notification
  (défaut : email de l'entreprise dans les paramètres admin).

## Tarifs

`pricing.ts` : tant que `unitPriceHT` vaut `null`, l'interface affiche « Sur devis ».
