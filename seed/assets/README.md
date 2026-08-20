<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# Seed-Assets — Prototyp-Projekte

Quellbilder für die 7 seedbaren Prototyp-Projekte. Diese Dateien werden vom
Seed-Skript (`npm run seed`) als ECHTE Media-Dokumente hochgeladen (via
Payload Local API / `uploadProjectMedia`) — sie werden NICHT statisch
ausgeliefert. Laufzeit-Fallbacks bleiben unter `public/defaults/`.

## Struktur & Namenskonvention

Ein Ordner pro Projekt, benannt nach dem Projekt-Slug (das Seed-Skript liest
die Ordnernamen ein).

```
seed/assets/
  push-statt-pull/
    cover.webp       ← Titelbild des Projekts (Pflicht)
    galerie-1.webp   ← weitere Bilder (Galerie / News-Titelbilder)
    galerie-2.webp
    galerie-3.webp
  stadtdaten/
    …
```

Aktuelle Projekte: kultur-trifft-digital, mitmach-werkstatt,
mobilitaet-x-multi, nudging, push-statt-pull, stadtdaten, stadtkontakt-mobil.

- **`cover.*`** wird das `coverImage` des Projekts.
- **`galerie-*`** landen in der Projekt-Galerie und stehen als
  News-Titelbilder zur Verfügung (4 Bilder pro Projekt: 1 Cover + 3 weitere).
- Optional später: `dateien/` pro Projekt für das Dateien-Modul (PDFs etc.).

## Bild-Anforderungen

- JPEG (oder WebP), ca. 1600 px Breite, Zielgröße 100–300 KB.
- Nur lizenzrechtlich unbedenkliches Material (eigene Fotos, generiert, CC0) —
  Nachweise in `ATTRIBUTION.md` eintragen.
