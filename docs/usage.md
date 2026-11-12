<!--
SPDX-FileCopyrightText: 2026 Johannes Homann

SPDX-License-Identifier: EUPL-1.2
-->

# Using UrbanKIT

What the platform is for, who uses it in which role, and how the typical tasks
work. Technical setup is in [`operations.md`](./operations.md).

## 1. Purpose

UrbanKIT is a civic-participation platform for one municipality. It has two
faces:

- a **public portal** where anyone can see which participation projects exist,
  what happened in them and how to take part, and
- a **workspace** where registered participants and project teams collaborate
  inside a project through a set of modules.

The municipality runs one instance under its own name, logo and colours. No
account is needed for the portal; the workspace requires a login.

## 2. Who uses it

| Role | Where | What they can do |
|---|---|---|
| Visitor | Portal | Browse projects and topic areas, read public news, events, poll results and files, vote in public polls |
| Participant (Bürger:in) | Workspace | Join projects, read and comment, vote, attend events, take tasks, use chat, bookmark content |
| Team member | Workspace | Everything a participant can, plus team-restricted content of their teams and the task board |
| Team lead (Teamleitung) | Workspace, team page | Manage their team's roster, create team-scoped news, events, polls, files and forum topics |
| Project manager (Projektleitung) | Workspace, manage area | Configure the project, its modules, teams and members; author all content; moderate |
| Administrator | `/admin` | Platform identity, legal texts, AI settings, user accounts, topic-area content, creating projects |

Rights are enforced on the server for every action; the interface only shows
what the role allows. Details: [`access-control.md`](./access-control.md).

## 3. The public portal

- **Frontpage** with current projects and the topic areas.
- **Topic areas**: _Projekte & Archiv_ (all projects, filter by status, topic,
  district, year), _Zusammenarbeit_ (how the workspace works, the modules),
  _Grundlagen_ (participation basics and legal background; method teasers from
  the Urban Kit Methodensammlung if connected).
- **Starten**: the step-by-step guide for people who want to take part.
- **Project page**: description, phase, contact, gallery, and the public parts of
  the enabled modules (news, upcoming events, public polls, public files).
  Join requests start here.
- **Über UrbanKIT**, **Kontakt** (e-mail address) and the legal pages
  (imprint, privacy policy, cookie policy, accessibility statement).

Every page is available in German and English; content falls back to German.
The accessibility panel (bottom corner) lets visitors enlarge text, switch to
high contrast, underline links and reduce motion. Settings stay in the browser.

## 4. Accounts

**Registration** needs first name, last name, e-mail and password. If mail is
configured, an activation link confirms the address before the first login.
Operators can switch registration off (Platform Settings → Prototyp-Hinweis →
Registrierung erlauben); the form then stays visible but disabled with a notice.

**Prototype mode** adds a dismissible notice on every first visit and can show
public **demo accounts** on the login page: one click logs in as a citizen or a
project lead. Demo accounts are read-only; nothing they do is saved.

**Profile** (dashboard → profile): optional picture, description, gender, birth
year, district, affiliation; for staff also organisation, department and
function. Users control whether their profile is visible to other members and
whether they appear in people search. The profile page also offers a data
export (machine-readable) and account deletion. Project managers cannot delete
their account while they lead a project.

## 5. The dashboard

After login the dashboard lists **my projects** (as manager or member),
projects open for joining, recent activity, upcoming deadlines and the
notification bell. The chat launcher is available everywhere in the workspace:
direct messages, project rooms and self-created groups, with images and
reactions. Language can be switched at any time (DE/EN).

## 6. Inside a project

The project workspace has a sidebar with the enabled modules, a bookmark list,
the member list, the team page (for team leads) and the project information.
Project managers additionally see **Verwalten** (manage).

| Module | What it does |
|---|---|
| News | Posts with cover image and rich text; drafts, scheduled and published; comments by members |
| Calendar | Events with time, place, category; attendance; list and month view; ICS download |
| Polls | Single choice, multiple choice, free text and scale questions; draft → active → closed; results after voting or after close; optional anonymous public polls |
| Forum | Topics with votes and replies; pinning and locking by managers |
| Tasks | Kanban board (open, in progress, done) with priority, due date, labels, assignees; team-only by default |
| Board | Collaborative whiteboard (Excalidraw) with live cursors; several canvases per project |
| Files | Folders and uploads with per-file visibility; public files appear on the project page |
| Urban Agent | Optional AI assistant answering questions about the project's content; members only; disabled unless an operator configures a provider |

**Visibility.** Every content item has one of three levels: _public_ (portal
and workspace), _project_ (all members) or _team_ (one or more named teams).
Team-restricted items show a chip with the team names; filters let members
view one team at a time.

**Bookmarks (Merkliste).** The ⋯ menu on every item offers copy link, ask the
Urban Agent, share in chat, report, and bookmark. Bookmarks are personal and
listed in the sidebar.

## 7. Managing a project (project managers)

The manage area mirrors the module list and adds project settings:

- **Allgemein**: title, description, phase, dates, contact, gallery, cover image.
- **Teams**: the team catalogue of the project; renaming propagates to members
  and content, deleting removes the tag everywhere (confirmation required).
- **Darstellung**: one of the platform's project colour schemes.
- **Module**: switch modules on and off; disabled modules disappear for
  everyone, including managers.
- **Mitglieder**: roles (manager, participant), team tags, team-lead flag,
  removal, invitation codes.
- **Anfragen**: accept or reject join requests.
- **Einstellungen**: public listing, allow join requests, allow chat groups to
  attach to the project, delete the project (type the name to confirm).
- **Inhalte**: content management per module, including drafts and scheduling
  for news and moderation for the forum.

Team leads get a reduced version on their **Team** page: roster management and
quick actions to create team-scoped events, polls and files.

## 8. Administration (`/admin`)

The Payload admin is for operators and editors, not for citizens.

- **Platform Settings**: city name and logos, public contact, prototype notice
  with demo accounts and the registration switch, "Über" page text, partner
  logos, project colour schemes, all colour tokens of the portal and workspace.
- **Legal Settings**: imprint, privacy policy, cookie policy, accessibility
  statement (German and English, rich text).
- **Urban Agent**: provider, model, per-user rate limit, enable/disable.
- **Grundlagen**: the editorial sections of the basics area.
- **Projects**, **Users** (roles `admin` / `user`, demo flag), memberships and
  all module collections for support cases.

## 9. Typical workflows

**Set up a new participation project**

1. Admin creates the project in `/admin` (or a manager is given an existing one)
   and assigns at least one project manager.
2. Manager fills _Allgemein_, picks a colour scheme, enables the modules the
   project needs, defines teams.
3. Manager sets _Einstellungen_: public yes/no, join requests yes/no.
4. Manager publishes a first news post and the kick-off event; the project
   appears on the portal.

**Bring people in**

- Open projects: visitors click "Mitmachen" on the project page, register or
  log in, and send a join request; the manager accepts it under _Anfragen_.
- Closed groups: the manager generates an invitation code under _Mitglieder_;
  the invitee redeems it on the portal frontpage after logging in.
- Teams: the manager tags members with teams and marks team leads; leads add
  further members from the project on their team page.

**Run a poll**

1. Manager or team lead creates a poll (draft) with questions and visibility.
2. Activate it; members vote once; anonymous public polls use a cookie to
   prevent double votes.
3. Close it; results become visible to voters, or immediately if "live results"
   is enabled.

**Pilot operation with test accounts**

1. Enable the prototype notice and switch registration off.
2. Seed or create demo users flagged "Demo account (read-only)" and list them in
   Platform Settings.
3. Visitors use the one-click logins; nothing they do is persisted.

## 10. Help inside the application

- **Workspace**: the question mark in the top bar opens a short, role-aware
  guide (`/dashboard/hilfe`); the “?” in a project's breadcrumb bar jumps to
  the section for the current module or area.
- **Admin**: “Dokumentation” at the bottom of the admin sidebar
  (`/admin/dokumentation`) explains platform settings, legal texts, accounts,
  projects and the Urban Agent for operators.

## 11. Prerequisites and tips

- A current browser; no installation. Mobile layouts exist for the portal and
  the workspace, the whiteboard works best on a desktop.
- Editors should know the basics of the Payload admin (collections, globals,
  localisation toggle DE/EN) and of rich-text editing.
- Keep German as the primary content language; English fields fall back to
  German when empty.
- The whiteboard is not accessible to screen readers; publish results as news or
  files as well.
