// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/lib/access'

/**
 * Settings for the Urban Agent (project AI assistant). `read` is restricted to
 * admins too — unlike `platform-settings` (public read), so the stored API key
 * can never leak through the mounted REST/GraphQL API. Server code reads this
 * global via the local API with `overrideAccess: true`
 * (src/lib/urban-agent/settings.ts).
 *
 * Every field falls back to a server environment variable when left empty, so
 * the key can stay out of the database (the more secure option) while the
 * toggle, provider and tuning live in the admin UI.
 */
export const UrbanAgentSettings: GlobalConfig = {
  slug: 'urban-agent-settings',
  label: { en: 'Urban Agent', de: 'Urban Agent' },
  access: { read: isAdmin, update: isAdmin },
  admin: { group: 'Einstellungen' },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: { en: 'Enable Urban Agent', de: 'Urban Agent aktivieren' },
      admin: {
        description: {
          en: 'Master switch for the whole platform. Projects additionally enable the module individually (project settings → modules).',
          de: 'Hauptschalter für die gesamte Plattform. Projekte aktivieren das Modul zusätzlich einzeln (Projekt-Einstellungen → Module).',
        },
      },
    },
    {
      name: 'provider',
      type: 'select',
      label: { en: 'Provider', de: 'Anbieter' },
      options: [
        { label: 'Mistral (EU)', value: 'mistral' },
        { label: 'Anthropic (Claude)', value: 'anthropic' },
        { label: 'OpenAI', value: 'openai' },
        { label: 'Ollama (selbst gehostet)', value: 'ollama' },
      ],
      admin: {
        description: {
          en: 'Which LLM provider answers. Mistral processes within the EU; a US provider requires a privacy-policy update (third-country transfer). Ollama runs on your own server (no data leaves it). Empty = auto-detect from the server environment.',
          de: 'Welcher LLM-Anbieter antwortet. Mistral verarbeitet in der EU; bei einem US-Anbieter muss die Datenschutzerklärung angepasst werden (Drittlandübermittlung). Ollama läuft auf dem eigenen Server (keine Daten verlassen ihn). Leer = automatische Erkennung aus der Server-Umgebung.',
        },
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      label: { en: 'API key', de: 'API-Schlüssel' },
      admin: {
        autoComplete: 'off',
        description: {
          en: 'API key of the selected provider (Mistral: console.mistral.ai; Anthropic: console.anthropic.com; OpenAI: platform.openai.com; not needed for Ollama). Stored in the database. Leave empty to use the server environment variable (MISTRAL_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY) — the more secure option. Tip: set a monthly spend limit in the provider console.',
          de: 'API-Schlüssel des gewählten Anbieters (Mistral: console.mistral.ai; Anthropic: console.anthropic.com; OpenAI: platform.openai.com; für Ollama nicht nötig). Wird in der Datenbank gespeichert. Leer lassen, um die Server-Umgebungsvariable zu nutzen (MISTRAL_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY) — die sicherere Variante. Tipp: In der Anbieter-Konsole ein monatliches Kostenlimit setzen.',
        },
      },
    },
    {
      name: 'model',
      type: 'text',
      label: { en: 'Model (optional)', de: 'Modell (optional)' },
      admin: {
        placeholder: 'mistral-small-latest',
        description: {
          en: 'Model id for the provider. Leave empty for a sensible cheap default (Mistral: mistral-small-latest, Anthropic: claude-haiku-4-5, OpenAI: gpt-4o-mini, Ollama: llama3).',
          de: 'Modell-ID des Anbieters. Leer lassen für einen günstigen Standard (Mistral: mistral-small-latest, Anthropic: claude-haiku-4-5, OpenAI: gpt-4o-mini, Ollama: llama3).',
        },
      },
    },
    {
      name: 'instructions',
      type: 'textarea',
      localized: true,
      label: { en: 'Extra instructions', de: 'Zusätzliche Anweisungen' },
      admin: {
        description: {
          en: 'Optional. Appended to the system prompt — e.g. tone or extra rules. Subordinated: can never override the built-in safety rules. Keep it short.',
          de: 'Optional. Wird an den System-Prompt angehängt — z. B. Tonalität oder Zusatzregeln. Untergeordnet: kann die eingebauten Schutzregeln nie außer Kraft setzen. Kurz halten.',
        },
      },
    },
    {
      name: 'rateLimit',
      type: 'number',
      defaultValue: 20,
      min: 1,
      label: { en: 'Rate limit (requests / 5 min / user)', de: 'Anfrage-Limit (pro 5 Min / Nutzer)' },
      admin: {
        description: {
          en: 'Abuse / cost guard: max agent requests per logged-in user in a 5-minute window.',
          de: 'Schutz vor Missbrauch / Kosten: maximale Agent-Anfragen pro angemeldetem Nutzer in 5 Minuten.',
        },
      },
    },
  ],
}
