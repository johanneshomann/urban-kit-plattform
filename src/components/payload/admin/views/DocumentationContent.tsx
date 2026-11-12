// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { Gutter } from '@payloadcms/ui'
import React, { useState } from 'react'

type Lang = 'de' | 'en'
type L = Record<Lang, string>
/** One entry → paragraph, several → numbered steps. */
type Item = { q: L; a: Record<Lang, string[]>; note?: L }
type Category = { key: string; label: L; intro: L; items: Item[] }

const HEAD: Record<Lang, { title: string; lead: string }> = {
  de: { title: 'Dokumentation', lead: 'Kurzanleitung für die Administration der Plattform. Oben einen Bereich auswählen.' },
  en: { title: 'Documentation', lead: 'A short guide to administering the platform. Pick a section above.' },
}

/**
 * Operator guide shown at /admin/dokumentation (bilingual, follows the admin
 * language). Editorial tasks only — installation and server operations live
 * in docs/operations.md in the repository. Keep entries short: what the
 * setting does, where it is, what to watch out for.
 */
const CATEGORIES: Category[] = [
  {
    key: 'start',
    label: { de: 'Überblick', en: 'Overview' },
    intro: { de: 'Was dieser Admin-Bereich ist und wie er aufgebaut ist.', en: 'What this admin area is and how it is organised.' },
    items: [
      {
        q: { de: 'Wofür ist der Admin-Bereich da?', en: 'What is the admin area for?' },
        a: {
          de: ['Hier verwalten Administrator:innen die Plattform als Ganzes: Erscheinungsbild, Rechtstexte, Konten, Projekte und den KI-Assistenten. Die tägliche Arbeit in einem Projekt – News, Termine, Umfragen, Mitglieder – erledigen Projektleitungen nicht hier, sondern im Arbeitsbereich unter „Verwalten“.'],
          en: ['Administrators manage the platform as a whole here: appearance, legal texts, accounts, projects and the AI assistant. Day-to-day work in a project – news, events, polls, members – is not done here but by project leads in the workspace under “Manage”.'],
        },
      },
      {
        q: { de: 'Wie ist die Seitenleiste aufgebaut?', en: 'How is the sidebar organised?' },
        a: {
          de: ['„Projekte“ (Projekte und Mitgliedschaften), „Konten & Medien“ (Benutzer:innen, hochgeladene Bilder), „Modul-Inhalte“ (News, Termine, Umfragen …), „Einstellungen“ (Plattform, Rechtliches, Urban Agent, Grundlagen). Die Gruppen „Modul-Details“, „Chat“ und „System“ enthalten Hilfsdaten für Support-Fälle und sind anfangs eingeklappt.'],
          en: ['“Projects” (projects and memberships), “Accounts & media” (users, uploaded images), “Module content” (news, events, polls …), “Settings” (platform, legal, Urban Agent, basics). The groups “Module details”, “Chat” and “System” hold supporting data for support cases and start collapsed.'],
        },
      },
      {
        q: { de: 'Erste Schritte nach der Installation', en: 'First steps after installation' },
        a: {
          de: ['Unter Einstellungen → Plattform den Ortsnamen, das Logo und die Kontakt-E-Mail eintragen.', 'Unter Einstellungen → Rechtliches Impressum, Datenschutz, Cookie-Richtlinie und Barrierefreiheit ausfüllen – die Vorlagen enthalten Platzhalter in eckigen Klammern.', 'Das erste Projekt anlegen und eine Projektleitung zuweisen (siehe „Projekte“).', 'Entscheiden, ob Registrierung offen ist oder die Plattform im Prototyp-Modus mit Testzugängen läuft.'],
          en: ['Under Settings → Platform enter the place name, logo and contact e-mail.', 'Under Settings → Legal complete imprint, privacy policy, cookie policy and accessibility statement – the templates contain placeholders in square brackets.', 'Create the first project and assign a project lead (see “Projects”).', 'Decide whether registration is open or the platform runs in prototype mode with test accounts.'],
        },
      },
      {
        q: { de: 'Sprache: Deutsch und Englisch', en: 'Language: German and English' },
        a: {
          de: ['Die Admin-Oberfläche folgt Ihrer Kontoeinstellung (oben rechts → Konto). Übersetzbare Felder, etwa die Rechtstexte, werden je Sprache gespeichert: oben über „Deutsch / English“ umschalten. Fehlt die englische Fassung, zeigt die Website die deutsche.'],
          en: ['The admin interface follows your account setting (top right → Account). Translatable fields such as the legal texts are stored per language: switch with “Deutsch / English” at the top. If the English version is missing, the website shows the German one.'],
        },
      },
    ],
  },
  {
    key: 'platform',
    label: { de: 'Plattform-Einstellungen', en: 'Platform settings' },
    intro: { de: 'Einstellungen → Plattform, Reiter für Reiter.', en: 'Settings → Platform, tab by tab.' },
    items: [
      {
        q: { de: 'Stadt und Allgemein', en: 'City and general' },
        a: {
          de: ['Ortsname ohne „Stadt“ (z. B. „Musterstadt“), Logos, die öffentliche Kontakt-E-Mail, die Startseiten-Bilder und optional die Adresse der Methodensammlung. Änderungen sind nach dem Speichern sofort sichtbar.'],
          en: ['Place name without “Stadt” (e.g. “Musterstadt”), logos, the public contact e-mail, the frontpage images and optionally the address of the Methodensammlung. Changes are visible immediately after saving.'],
        },
      },
      {
        q: { de: 'Prototyp-Hinweis, Testzugänge und Registrierung', en: 'Prototype notice, test accounts and registration' },
        a: {
          de: ['„Prototyp-Hinweis anzeigen“ blendet beim ersten Seitenaufruf einen Hinweis ein; der Text ist überschreibbar.', '„Testzugänge auf der Login-Seite“: Hier eingetragene Konten erscheinen als Ein-Klick-Anmeldung. Das Konto muss unter Benutzer:innen existieren und als „Demo-Zugang (nur lesen)“ markiert sein – solche Konten können nichts speichern.', '„Registrierung erlauben“ ausschalten, wenn niemand neue Konten anlegen soll. Das Formular bleibt sichtbar, ist aber gesperrt und verweist auf die Testzugänge.'],
          en: ['“Show prototype notice” displays a notice on the first page view; the text can be overridden.', '“Demo accounts on the login page”: accounts listed here appear as one-click logins. The account must exist under Users and be flagged “Demo account (read-only)” – such accounts cannot save anything.', 'Switch “Allow registration” off when nobody should create new accounts. The form stays visible but locked and points to the test accounts.'],
        },
      },
      {
        q: { de: 'Farben und Projektfarben', en: 'Colours and project colours' },
        a: {
          de: ['Unter „Farben“ stehen alle Farbwerte des Portals und des Arbeitsbereichs; jedes Feld hat einen Zurücksetzen-Knopf. „Projektfarben“ definiert die acht Farbschemata, aus denen Projektleitungen für ihr Projekt wählen. Auf ausreichenden Kontrast achten – Text muss auf den Flächen lesbar bleiben.'],
          en: ['“Colours” holds every colour value of the portal and the workspace; each field has a reset button. “Project colours” defines the eight schemes project leads choose from for their project. Mind sufficient contrast – text must stay readable on the surfaces.'],
        },
      },
      {
        q: { de: 'Über-Seite und Partner', en: 'About page and partners' },
        a: {
          de: ['„Über“ enthält den redaktionellen Text der Seite „Über UrbanKIT“. Unter „Partner“ pflegen Sie Logos mit Name, Link, Höhe und Abständen; sie erscheinen im Fußbereich des Portals.'],
          en: ['“About” holds the editorial text of the “Über UrbanKIT” page. Under “Partners” you maintain logos with name, link, height and spacing; they appear in the portal footer.'],
        },
      },
    ],
  },
  {
    key: 'legal',
    label: { de: 'Rechtstexte', en: 'Legal texts' },
    intro: { de: 'Einstellungen → Rechtliches: vier Texte, jeweils auf Deutsch und Englisch.', en: 'Settings → Legal: four texts, each in German and English.' },
    items: [
      {
        q: { de: 'Was muss ausgefüllt werden?', en: 'What has to be completed?' },
        a: {
          de: ['Impressum, Datenschutzerklärung, Cookie-Richtlinie und Erklärung zur Barrierefreiheit. Die mitgelieferten Texte sind Vorlagen mit Platzhaltern in eckigen Klammern – verantwortliche Stelle, Datenschutzbeauftragte:r, Hosting-Anbieter, Daten der Selbstbewertung. Die Vorlagen ersetzen keine Rechtsberatung.'],
          en: ['Imprint, privacy policy, cookie policy and accessibility statement. The supplied texts are templates with placeholders in square brackets – responsible body, data protection officer, hosting provider, self-assessment dates. The templates do not replace legal advice.'],
        },
      },
      {
        q: { de: 'Wann müssen die Texte angepasst werden?', en: 'When do the texts need updating?' },
        a: {
          de: ['Immer wenn sich ändert, welche Dienste Daten verarbeiten: E-Mail-Versand eingerichtet, KI-Assistent ein- oder ausgeschaltet, Anbieter gewechselt, ein vorgeschaltetes Auslieferungsnetzwerk genutzt. Dann den passenden Abschnitt in der Datenschutzerklärung und bei Bedarf in der Cookie-Richtlinie ergänzen oder streichen und das Stand-Datum setzen.'],
          en: ['Whenever the set of services processing data changes: mail delivery configured, AI assistant switched on or off, provider changed, a delivery network placed in front. Then add or remove the matching section in the privacy policy and, where needed, the cookie policy, and set the “as of” date.'],
        },
      },
      {
        q: { de: 'Englische Fassung', en: 'English version' },
        a: {
          de: ['Bleibt das englische Feld leer, zeigt die englische Website automatisch den deutschen Text. Eine veraltete englische Fassung ist schlechter als keine – im Zweifel leeren.'],
          en: ['If the English field stays empty, the English website automatically shows the German text. An outdated English version is worse than none – when in doubt, clear it.'],
        },
      },
    ],
  },
  {
    key: 'users',
    label: { de: 'Konten und Rollen', en: 'Accounts and roles' },
    intro: { de: 'Wer darf was – plattformweit und im Projekt.', en: 'Who may do what – platform-wide and within a project.' },
    items: [
      {
        q: { de: 'Welche Rollen gibt es?', en: 'Which roles exist?' },
        a: {
          de: ['Plattformweit gibt es zwei Rollen am Benutzerkonto: „Admin“ (Zugang zu diesem Bereich) und „User“. Im Projekt entscheidet die Mitgliedschaft: „Projektmanager:in“ leitet das Projekt, „Bürger:in“ nimmt teil. Zusätzlich können Mitglieder Teams angehören und ein Team leiten.'],
          en: ['Platform-wide there are two roles on the user account: “Admin” (access to this area) and “User”. Within a project the membership decides: “Project manager” leads the project, “Citizen” takes part. Members can additionally belong to teams and lead a team.'],
        },
      },
      {
        q: { de: 'Ein Konto anlegen oder sperren', en: 'Creating or blocking an account' },
        a: {
          de: ['Konten & Medien → Benutzer:innen → „Neu erstellen“: Name, E-Mail, Passwort, Rolle.', 'Ist E-Mail-Versand eingerichtet, erhält die Person eine Aktivierungsmail und muss ihre Adresse bestätigen. Ohne Versand ist das Konto sofort nutzbar.', 'Zum Sperren das Konto löschen oder das Passwort ändern. Projektleitungen können ihr Konto nicht selbst löschen, solange sie ein Projekt leiten.'],
          en: ['Accounts & media → Users → “Create new”: name, e-mail, password, role.', 'If mail delivery is configured, the person receives an activation mail and must confirm the address. Without it the account is usable immediately.', 'To block, delete the account or change the password. Project leads cannot delete their own account while they lead a project.'],
        },
      },
      {
        q: { de: 'Testzugänge (nur lesen)', en: 'Test accounts (read-only)' },
        a: {
          de: ['Ein Konto mit dem Häkchen „Demo-Zugang (nur lesen)“ kann sich anmelden und alles ansehen, aber nichts speichern oder hochladen – das gilt plattformweit. Solche Konten eignen sich für öffentliche Vorführungen; das Passwort darf öffentlich sein.'],
          en: ['An account flagged “Demo account (read-only)” can sign in and view everything but cannot save or upload anything – platform-wide. Such accounts suit public demonstrations; the password may be public.'],
        },
      },
    ],
  },
  {
    key: 'projects',
    label: { de: 'Projekte', en: 'Projects' },
    intro: { de: 'Projekte anlegen und an eine Projektleitung übergeben.', en: 'Creating projects and handing them to a project lead.' },
    items: [
      {
        q: { de: 'Ein neues Projekt anlegen', en: 'Creating a new project' },
        a: {
          de: ['Projekte → „Neu erstellen“: Titel, Kurzbeschreibung, Status und Phase eintragen; der Slug (Adresse) entsteht aus dem Titel.', 'Die gewünschten Module auswählen – die Projektleitung kann das später ändern.', 'Unter Projekte → Mitgliedschaften eine Mitgliedschaft anlegen: Person, Projekt, Rolle „PM“, Status „aktiv“.', 'Ab dann pflegt die Projektleitung alles Weitere im Arbeitsbereich unter „Verwalten“.'],
          en: ['Projects → “Create new”: enter title, summary, status and phase; the slug (address) is derived from the title.', 'Select the desired modules – the project lead can change this later.', 'Under Projects → Memberships create a membership: person, project, role “PM”, status “active”.', 'From then on the project lead maintains everything else in the workspace under “Manage”.'],
        },
      },
      {
        q: { de: 'Öffentlich oder intern?', en: 'Public or internal?' },
        a: {
          de: ['Ein öffentliches Projekt erscheint im Portal mit seinen öffentlich markierten Inhalten. Ein nicht öffentliches Projekt ist nur für Mitglieder erreichbar. Ob Beitrittsanfragen möglich sind, stellt die Projektleitung unter Verwalten → Einstellungen ein.'],
          en: ['A public project appears on the portal with its publicly marked content. A non-public project is reachable for members only. Whether join requests are possible is set by the project lead under Manage → Settings.'],
        },
      },
      {
        q: { de: 'Ein Projekt löschen', en: 'Deleting a project' },
        a: {
          de: ['Am sichersten über den Arbeitsbereich: Verwalten → Einstellungen → Projekt löschen. Dort werden alle zugehörigen Inhalte, Dateien und Mitgliedschaften mit entfernt. Löschen im Admin entfernt nur den Projekteintrag.'],
          en: ['Safest via the workspace: Manage → Settings → Delete project. That removes all related content, files and memberships as well. Deleting in the admin removes the project entry only.'],
        },
        note: { de: 'Löschen lässt sich nicht rückgängig machen – vorher ein Backup anlegen lassen.', en: 'Deletion cannot be undone – have a backup made first.' },
      },
    ],
  },
  {
    key: 'agent',
    label: { de: 'Urban Agent', en: 'Urban Agent' },
    intro: { de: 'Der optionale KI-Assistent für Projektmitglieder.', en: 'The optional AI assistant for project members.' },
    items: [
      {
        q: { de: 'Was macht der Urban Agent?', en: 'What does the Urban Agent do?' },
        a: {
          de: ['Er beantwortet Fragen von Mitgliedern zu den Inhalten ihres Projekts und greift dabei nur auf das zu, was die fragende Person ohnehin sehen darf. Er ist ein Modul und wird je Projekt zugeschaltet.'],
          en: ['It answers members’ questions about the content of their project and only accesses what the asking person may see anyway. It is a module and is enabled per project.'],
        },
      },
      {
        q: { de: 'Einrichten', en: 'Setting it up' },
        a: {
          de: ['Einstellungen → Urban Agent: Anbieter wählen und den API-Schlüssel aus dessen Konsole eintragen (oder serverseitig hinterlegen lassen).', 'Optional Modell und Anfragen-Limit je Person anpassen.', 'In der Anbieter-Konsole ein monatliches Kostenlimit setzen.', 'Den Abschnitt zum KI-Assistenten in die Datenschutzerklärung aufnehmen.', 'Das Modul im jeweiligen Projekt aktivieren.'],
          en: ['Settings → Urban Agent: choose the provider and enter the API key from its console (or have it stored server-side).', 'Optionally adjust the model and the per-person request limit.', 'Set a monthly spending cap in the provider console.', 'Add the AI assistant section to the privacy policy.', 'Enable the module in the respective project.'],
        },
      },
      {
        q: { de: 'Abschalten', en: 'Switching it off' },
        a: {
          de: ['Das Modul in den Projekten deaktivieren (Verwalten → Module). Ohne Schlüssel meldet der Assistent „nicht konfiguriert“. Danach den Abschnitt aus der Datenschutzerklärung und die beiden Einträge aus der Cookie-Richtlinie entfernen.'],
          en: ['Disable the module in the projects (Manage → Modules). Without a key the assistant reports “not configured”. Afterwards remove the section from the privacy policy and the two entries from the cookie policy.'],
        },
      },
    ],
  },
  {
    key: 'tech',
    label: { de: 'Technik', en: 'Technical' },
    intro: { de: 'Wo die technische Dokumentation liegt.', en: 'Where the technical documentation lives.' },
    items: [
      {
        q: { de: 'Installation, Updates, Backups', en: 'Installation, updates, backups' },
        a: {
          de: ['Diese Themen betreffen den Server und stehen im Quellcode-Repository: docs/operations.md (Installation, Reverse-Proxy, Updates, Backup), docs/env-reference.md (Umgebungsvariablen), docs/usage.md (Bedienung), docs/project-status.md (Stand und bekannte Einschränkungen).'],
          en: ['These topics concern the server and live in the source repository: docs/operations.md (installation, reverse proxy, updates, backup), docs/env-reference.md (environment variables), docs/usage.md (usage), docs/project-status.md (status and known limitations).'],
        },
      },
      {
        q: { de: 'Hilfe für Nutzer:innen', en: 'Help for users' },
        a: {
          de: ['Angemeldete Personen finden eine Kurzanleitung im Arbeitsbereich über das Fragezeichen in der oberen Leiste. Sie zeigt je nach Rolle zusätzliche Abschnitte für Team- und Projektleitungen.'],
          en: ['Signed-in people find a short guide in the workspace via the question mark in the top bar. Depending on the role it shows additional sections for team and project leads.'],
        },
      },
    ],
  },
]

export function DocumentationContent({ lang }: { lang: Lang }) {
  const [active, setActive] = useState(CATEGORIES[0].key)
  const current = CATEGORIES.find((c) => c.key === active) ?? CATEGORIES[0]

  return (
    <Gutter>
      <div className="uk-doc">
        <h1>{HEAD[lang].title}</h1>
        <p className="uk-doc__lead">{HEAD[lang].lead}</p>

        <div role="tablist" aria-label={HEAD[lang].title} className="uk-doc__tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={cat.key === active}
              className={`uk-doc__tab${cat.key === active ? ' uk-doc__tab--active' : ''}`}
              onClick={() => setActive(cat.key)}
            >
              {cat.label[lang]}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="uk-doc__panel">
          <p className="uk-doc__intro">{current.intro[lang]}</p>
          {current.items.map((item) => (
            <section key={item.q.en} className="uk-doc__card">
              <h3>{item.q[lang]}</h3>
              {item.a[lang].length === 1 ? (
                <p>{item.a[lang][0]}</p>
              ) : (
                <ol>{item.a[lang].map((line) => <li key={line}>{line}</li>)}</ol>
              )}
              {item.note && <p className="uk-doc__note">{item.note[lang]}</p>}
            </section>
          ))}
        </div>
      </div>
    </Gutter>
  )
}
