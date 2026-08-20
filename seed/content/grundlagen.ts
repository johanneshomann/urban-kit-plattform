// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Seed content for the Grundlagen global (public Grundlagen page).
 * - recht: transcribed from the provided concept screenshots (Rechtliche
 *   Rahmenbedingungen der Beteiligung in Detmold; the Rahmenmodell diagram is
 *   captured as a text section — the graphic can be added later as an asset).
 * - partizipation: the current catalog texts, carried over 1:1 (incl. the
 *   "[Inhalt folgt]" placeholders — they mark sections still to be written).
 * - projektplanung: intentionally EMPTY — the page keeps its structured
 *   step-by-step journey until sections are entered in the CMS.
 */

export interface GrundlagenSeedSection {
  title: string
  /** Markdown — converted to Lexical at seed time. */
  body: string
}

export interface GrundlagenSeedLocale {
  projektplanung: GrundlagenSeedSection[]
  partizipation: GrundlagenSeedSection[]
  recht: GrundlagenSeedSection[]
}

const DE: GrundlagenSeedLocale = {
  projektplanung: [],

  partizipation: [
    {
      title: 'Was wir unter Partizipation verstehen',
      body: `Partizipation bedeutet für uns, Interessen und Bedürfnisse der Betroffenen frühzeitig und nachvollziehbar in Entscheidungsprozesse einzubeziehen. Menschen wirken aktiv an Prozessen, Entscheidungen, Systemen und Entwicklungen mit, die sie betreffen.

Sie ist kein Mittel, um bereits getroffene Entscheidungen nachträglich zu legitimieren. Sie ist nicht nur ein demokratisches Prinzip, sondern ein bewusst gestalteter Prozess und gelebte Praxis.

> Wer einbezogen wird, erlebt bei gelungener Partizipation, dass die eigene Stimme zählt, Entscheidungen nachvollziehbar werden, Vertrauen entsteht und ein Gefühl von Zusammenhalt entstehen kann.

Projekte gewinnen dadurch an Qualität, weil sie näher an den tatsächlichen Bedürfnissen der Menschen liegen und weniger anfällig für Konflikte oder Blockaden sind.

Entscheidend ist, dass Rollen, Spielräume, Ziele und Entscheidungen transparent benannt werden. **Beteiligung wirkt nur dann, wenn sie ernst genommen, strukturiert umgesetzt und sichtbar in Entscheidungsprozesse eingebunden wird.** Beteiligung wirkt nur dann glaubwürdig, wenn klar ist, welchen Einfluss Beiträge tatsächlich haben.`,
    },
    {
      title: 'Warum Partizipation wichtig ist',
      body: `Beteiligung erhöht die Akzeptanz von Planungsentscheidungen, bringt lokales Wissen in den Prozess und stärkt das Vertrauen zwischen Verwaltung und Bevölkerung. [Inhalt folgt]`,
    },
    {
      title: 'Rechtlicher Rahmen in Kürze',
      body: `Formelle Beteiligungsverfahren sind in Deutschland gesetzlich verankert — unter anderem im Baugesetzbuch (BauGB) und in den Gemeindeordnungen der Länder. [Inhalt folgt]`,
    },
    { title: 'Unsere Haltung zu guter Partizipation', body: '[Inhalt folgt]' },
    { title: 'Partizipationsmodell', body: '[Inhalt folgt]' },
    { title: 'Die Leitfragen für jedes Beteiligungsprojekt', body: '[Inhalt folgt]' },
    { title: 'Prozesskern und strukturelle Voraussetzungen', body: '[Inhalt folgt]' },
    { title: 'Konflikt- & Machtfragen', body: '[Inhalt folgt]' },
    { title: 'Transparenz, Repräsentativität & Nicht-Übernahme', body: '[Inhalt folgt]' },
    { title: 'Evaluation', body: '[Inhalt folgt]' },
    { title: 'Partizipation im Smart-City-Kontext', body: '[Inhalt folgt]' },
  ],

  recht: [
    {
      title: 'Rechtliche Rahmenbedingungen im Überblick',
      body: `- **Bürgerbeteiligungsgesetze** (z. B. Landesbeteiligungsgesetze, EU-Vorgaben)
- **Datenschutz & IT-Sicherheit** in (digitalen) Beteiligungsformaten
- **Rechte & Pflichten** von Beteiligten und Projektverantwortlichen
- **Lokale Vorgaben** (durch Kommune, Stadtverwaltung, Nachhaltigkeitsstrategie)`,
    },
    {
      title: 'Wo stehen wir rechtlich?',
      body: `Bürger:innenbeteiligung in der Stadt Detmold ist politisch gewollt, strategisch verankert und organisatorisch erwartet, jedoch nur teilweise rechtlich verpflichtend. Sie basiert auf einem mehrschichtigen Rahmen aus kommunalrechtlichen Vorgaben, Ratsbeschlüssen sowie strategischen Selbstverpflichtungen der Stadt. Während formelle Beteiligungsverfahren gesetzlich vorgeschrieben sind, erfolgen viele Beteiligungsformate freiwillig und im Rahmen politischer Leitlinien.

**Für Projektverantwortliche** bedeutet das, dass Beteiligung teilweise Pflicht ist, darüber hinaus jedoch eine bewusste Selbstbindung mit Verantwortung.

**Für Beteiligte** bedeutet es, dass nicht jedes Thema frei verhandelbar ist, aber wo Beteiligung stattfindet, gelten verbindliche Transparenz- und Rückmeldeansprüche.

Die Wirksamkeit von Beteiligung hängt daher weniger von neuen Regeln als von transparenter Umsetzung, klaren Verantwortlichkeiten und dokumentierten und begleiteten Prozessen ab. Die Smart City Participation & Usability Toolbox ist in diesem Spannungsfeld verortet und unterstützt Mitarbeitende dabei, organisatorisch tragfähige Beteiligung systematisch umzusetzen.`,
    },
    {
      title: 'Rahmenmodell: Form der (rechtlichen) Verbindlichkeit',
      body: `Beteiligung bewegt sich zwischen strategischer Rahmung, politischer Bindung und rechtlicher Verpflichtung. Ihre Wirksamkeit entsteht in der Umsetzung.

Das Rahmenmodell ordnet drei Ebenen:

- **Strategisch gerahmt** — strategische Programme: Smart City, Nachhaltigkeit, OGP Local
- **Politisch verbindlich** — Ratsbeschlüsse & Leitlinien
- **Rechtlich verpflichtend** — gesetzliche Mindestanforderungen, z. B. Bau- & Planungsrecht, Gemeindeordnung NRW

Quer über alle Ebenen liegen zwei Bedeutungsachsen: **für Projektverantwortliche** Pflicht & Verantwortung, **für Beteiligte** Transparenz & Rückmeldung. Entscheidend für die Wirksamkeit ist die Ebene **Umsetzung & Prozessqualität** — hier setzt die Toolbox an.`,
    },
    {
      title: 'Rechtlicher und politischer Rahmen (Einordnung & Erklärung)',
      body: `*Aka: Was gilt eigentlich und warum ist das nicht trivial?*

Bürger:innenbeteiligung in Detmold beruht nicht auf einem einzelnen Beteiligungsgesetz, sondern auf einem Zusammenspiel aus gesetzlichen Mindestanforderungen und kommunalen Selbstverpflichtungen. Rechtlich verbindlich sind vor allem formelle Beteiligungsverfahren, die sich aus der Gemeindeordnung Nordrhein-Westfalen sowie aus spezialgesetzlichen Regelungen, insbesondere im Bau- und Planungsrecht, ergeben. Diese Verfahren definieren Mindeststandards für Information, Anhörung und öffentliche Auslegung für Beteiligung der Öffentlichkeit. Sie sichern Rechte ab und sind gerichtlich überprüfbar.

Darüber hinaus hat sich die Stadt Detmold bewusst dafür entschieden, Beteiligung über diese gesetzlichen Anforderungen hinaus strukturell zu stärken. Mit den vom Rat beschlossenen Leitlinien für Bürger:innenbeteiligung existiert ein politisch verbindlicher Orientierungsrahmen für informelle Beteiligung. Die Leitlinien formulieren Grundprinzipien wie frühzeitige Einbindung, Transparenz, Nachvollziehbarkeit von Entscheidungen und die Verpflichtung zur Rückmeldung über den Umgang mit Beteiligungsergebnissen. Beteiligung wird dabei ausdrücklich als beratend verstanden. Die Entscheidungsverantwortung verbleibt bei Politik und Verwaltung. Für Beteiligte bedeutet das, dass Beiträge einfließen, aber keine demokratisch legitimierten Entscheidungen ersetzen.

Ergänzend dazu verankern sowohl die Nachhaltigkeitsstrategie als auch das Smart-City-Konzept der Stadt Detmold Beteiligung als Querschnittsaufgabe kommunaler Entwicklung. Beteiligung wird hier als Voraussetzung für Akzeptanz, Lernfähigkeit und langfristige Wirksamkeit verstanden — insbesondere im Kontext digitaler und hybrider Transformation. Die Orientierung an der Smart City Charta des Bundes unterstreicht den Anspruch, Beteiligung transparent, barrierearm, strukturell und verbindlich in Verwaltungsprozesse zu integrieren.`,
    },
    {
      title: 'Gesetzliche Mindestanforderungen',
      body: `Rechtlich verbindlich sind vor allem formelle Beteiligungsverfahren, die sich aus der Gemeindeordnung Nordrhein-Westfalen sowie aus spezialgesetzlichen Regelungen, insbesondere im Bau- und Planungsrecht, ergeben. Diese Verfahren definieren Mindeststandards für Information, Beteiligung und öffentliche Auslegung und bilden den rechtlichen Unterbau kommunaler Beteiligung. Konkret regeln sie etwa, wann beteiligt werden muss, wie informiert wird und welche Fristen und Vorgaben gelten. Mindestanforderungen garantieren Verfahren, aber nicht automatisch Dialogqualität.

**Für Beteiligte bedeutet das:** In diesen Verfahren besteht ein rechtlich gesicherter Anspruch auf Information und Stellungnahme.`,
    },
    {
      title: 'Kommunale Selbstverpflichtungen',
      body: `Über diese Mindestanforderungen hinaus hat sich die Stadt Detmold bewusst dafür entschieden — und politisch verpflichtet —, Beteiligung strukturell zu stärken. Mit den vom Rat beschlossenen Leitlinien für Bürger:innenbeteiligung existiert ein politisch verbindlicher Orientierungsrahmen für informelle Beteiligung. Die Leitlinien formulieren Grundprinzipien wie frühzeitige Einbindung, Transparenz, Nachvollziehbarkeit von Entscheidungen und die Verpflichtung zur Rückmeldung über den Umgang mit Beteiligungsergebnissen. Beteiligung wird dabei ausdrücklich als beratend verstanden; die Entscheidungsverantwortung verbleibt bei Politik und Verwaltung.

Ergänzend dazu verankern sowohl die Nachhaltigkeitsstrategie als auch das Smart-City-Konzept der Stadt Detmold Beteiligung als Querschnittsaufgabe kommunaler Entwicklung. Diese Ebene ist kein Gesetz, aber politisch verbindlich. Sie schafft Erwartungen an die Art und Weise, wie Beteiligung gestaltet wird.

**Für Beteiligte entsteht hier kein einklagbarer Rechtsanspruch, wohl aber ein klar formulierter Qualitätsanspruch.** Beteiligung wird hier als Voraussetzung für Akzeptanz, Lernfähigkeit und langfristige Wirksamkeit verstanden, insbesondere im Kontext digitaler und hybrider Transformationsprozesse.`,
    },
    {
      title: 'Strategische Verankerung (Nachhaltigkeit & Smart City)',
      body: `Die Nachhaltigkeitsstrategie und das Smart-City-Konzept verankern Beteiligung als Querschnittsaufgabe kommunaler Entwicklung.

Beteiligung wird hier nicht juristisch begründet, sondern funktional: Sie erhöht Akzeptanz, verbessert Entscheidungsqualität und stärkt Lernprozesse — insbesondere bei komplexen Transformationsprozessen wie z. B. digitalen und hybriden Projekten.

Diese Ebene schafft keinen Rechtsanspruch, aber einen klar formulierten politischen Erwartungsrahmen und einen strategischen Handlungsauftrag.`,
    },
    {
      title: 'OGP Local als zusätzlicher Rahmen',
      body: `Mit der Einbindung in OGP Local unterliegt Detmold darüber hinaus einem internationalen Open-Government-Rahmen, der Beteiligung nicht rechtlich, aber prozessual verbindlich strukturiert. OGP Local verpflichtet teilnehmende Kommunen zur ko-kreativen Entwicklung von Action Plans, zur transparenten Dokumentation von Fortschritten sowie zur regelmäßigen Evaluation von Beteiligungsprozessen.

Auch wenn OGP Local keine gesetzliche Grundlage darstellt, entsteht durch die Teilnahme ein formalisierter Erwartungs- und Rechenschaftsrahmen: Beteiligung muss planvoll, nachvollziehbar, offen dokumentiert und gemeinsam mit zivilgesellschaftlichen Akteur:innen gestaltet werden. Damit verstärkt OGP Local bestehende kommunale Leitlinien und verschiebt Beteiligung weiter von der freiwilligen Einzelmaßnahme hin zu einem dauerhaft überprüfbaren Prozess.`,
    },
    {
      title: 'Konsequenzen für die Praxis (Anwendungsebene)',
      body: `*Aka: Was heißt das für mein Projekt und wie hilft mir die Toolbox?*

**Das Entscheidende für Mitarbeitende** — Was bedeutet das konkret für Beteiligungsprojekte?

- Beteiligung ist **kein Selbstzweck**, sondern muss bewusst geplant, begründet, dokumentiert und begleitet werden
- Projektverantwortliche müssen frühzeitig klären, **welcher Beteiligungsspielraum besteht** und wie Beiträge in Entscheidungen einfließen können
- Transparenz ist keine Zusatzleistung, sondern Voraussetzung für Verbindlichkeit und Vertrauen
- Informelle Beteiligung ist rechtlich zulässig, aber **politisch verantwortet** und organisatorisch abzusichern
- Im OGP-Local-Kontext kommen zusätzliche Anforderungen an Dokumentation, Co-Kreation und öffentliche Rückmeldung hinzu
- Datenschutz, Rollen- und Zugriffskonzepte sind integraler Bestandteil digitaler Beteiligung

**Das Entscheidende für Beteiligte** — Was bedeutet das konkret für mein Mitwirken?

- Beteiligte haben Anspruch auf **Klarheit** darüber, worum es geht, was beeinflussbar ist und wer am Ende entscheidet
- Sie dürfen erwarten, dass ihre Beiträge ernsthaft geprüft, dokumentiert und sichtbar berücksichtigt werden. Aber: **Beteiligung bedeutet Mitwirkung — nicht automatische Mitentscheidung**
- Transparente **Rückmeldung** ist Teil des Prozesses. Wenn Vorschläge nicht übernommen werden, muss nachvollziehbar sein, warum
- Beteiligung muss **verständlich, barrierearm und datenschutzkonform** gestaltet sein, damit sie für möglichst viele zugänglich wird und bleibt`,
    },
    {
      title: 'Rolle der SC PUT im rechtlichen Rahmen',
      body: `Die Smart City Participation & Usability Toolbox trifft keine rechtlich bindenden Entscheidungen und ersetzt keine formellen Verfahren. Sie wirkt jedoch als strukturierende Infrastruktur zwischen Politik und Praxis.

Durch transparente Projektdarstellung, strukturierte Prozesslogik, dokumentierte Rückkopplung und gemeinschaftlichen Arbeitstools unterstützt sie Mitarbeitende dabei, formelle und informelle Beteiligung anschlussfähig zu gestalten, kommunale Leitlinien konsequent umzusetzen, OGP-Local-Anforderungen an Transparenz, Co-Creation und Monitoring zu erfüllen und Beteiligung als nachvollziehbaren, lernenden Prozess zu etablieren.

Für Beteiligte schafft die Toolbox Orientierung: Was ist offen? Wer entscheidet? Was wurde eingebracht? Wie wurde entschieden?

Damit schließt die Toolbox eine strukturelle Lücke zwischen politischer Erwartung und gelebter Beteiligungspraxis.`,
    },
    {
      title: 'Gesamtbild',
      body: `Insgesamt bewegt sich Beteiligung in Detmold damit in einem Spannungsfeld zwischen rechtlicher Zulässigkeit, politischer Selbstbindung, internationaler Programmlogik und organisatorischer Umsetzung. Die zentrale Herausforderung liegt weniger im Fehlen von Regeln als in ihrer konsistenten, transparenten und lernfähigen Anwendung im Verwaltungsalltag.`,
    },
  ],
}

const EN: GrundlagenSeedLocale = {
  projektplanung: [],

  partizipation: [
    {
      title: 'What we mean by participation',
      body: `For us, participation means involving the interests and needs of those affected in decision-making processes early and traceably. People actively shape the processes, decisions, systems and developments that concern them.

It is not a tool for retroactively legitimising decisions that have already been made. It is not merely a democratic principle but a consciously designed process and lived practice.

> When participation succeeds, those involved experience that their voice counts, decisions become traceable, trust grows and a sense of cohesion can emerge.

Projects gain in quality because they sit closer to people's actual needs and are less prone to conflict or blockades.

What matters is that roles, scope, goals and decisions are named transparently. **Participation only works when it is taken seriously, implemented in a structured way and visibly embedded in decision-making.** Participation is only credible when it is clear what influence contributions actually have.`,
    },
    {
      title: 'Why participation matters',
      body: `Participation increases the acceptance of planning decisions, brings local knowledge into the process and strengthens trust between administration and residents. [Content to follow]`,
    },
    {
      title: 'The legal framework in brief',
      body: `Formal participation procedures are anchored in German law — among others in the Federal Building Code (BauGB) and the municipal codes of the federal states. [Content to follow]`,
    },
    { title: 'Our understanding of good participation', body: '[Content to follow]' },
    { title: 'Participation model', body: '[Content to follow]' },
    { title: 'The guiding questions for every participation project', body: '[Content to follow]' },
    { title: 'Process core and structural prerequisites', body: '[Content to follow]' },
    { title: 'Conflict & power questions', body: '[Content to follow]' },
    { title: 'Transparency, representativeness & non-adoption', body: '[Content to follow]' },
    { title: 'Evaluation', body: '[Content to follow]' },
    { title: 'Participation in the smart-city context', body: '[Content to follow]' },
  ],

  recht: [
    {
      title: 'Legal framework at a glance',
      body: `- **Public-participation legislation** (e.g. state participation acts, EU requirements)
- **Data protection & IT security** in (digital) participation formats
- **Rights & duties** of participants and project leads
- **Local requirements** (municipality, city administration, sustainability strategy)`,
    },
    {
      title: 'Where do we stand legally?',
      body: `Public participation in the City of Detmold is politically intended, strategically anchored and organisationally expected — yet only partly legally mandatory. It rests on a multi-layered framework of municipal-law requirements, council resolutions and the city's strategic self-commitments. While formal participation procedures are prescribed by law, many participation formats happen voluntarily and within political guidelines.

**For project leads** this means participation is partly an obligation, and beyond that a deliberate self-commitment that carries responsibility.

**For participants** it means that not every topic is freely negotiable — but wherever participation takes place, binding transparency and feedback entitlements apply.

The effectiveness of participation therefore depends less on new rules than on transparent implementation, clear responsibilities and documented, well-supported processes. The Smart City Participation & Usability Toolbox is situated in this field of tension and helps staff implement organisationally sound participation systematically.`,
    },
    {
      title: 'Framework model: forms of (legal) bindingness',
      body: `Participation moves between strategic framing, political commitment and legal obligation. Its effectiveness emerges in implementation.

The framework model distinguishes three levels:

- **Strategically framed** — strategic programmes: Smart City, sustainability, OGP Local
- **Politically binding** — council resolutions & guidelines
- **Legally mandatory** — statutory minimum requirements, e.g. building and planning law, the NRW municipal code

Two axes of meaning cut across all levels: **for project leads** duty & responsibility, **for participants** transparency & feedback. Decisive for effectiveness is the level of **implementation & process quality** — this is where the toolbox comes in.`,
    },
    {
      title: 'Legal and political framework (context & explanation)',
      body: `*Aka: what actually applies, and why is that not trivial?*

Public participation in Detmold is not based on a single participation act but on an interplay of statutory minimum requirements and municipal self-commitments. Legally binding are above all formal participation procedures derived from the North Rhine-Westphalia municipal code and from special legislation, particularly building and planning law. These procedures define minimum standards for information, consultation and public display. They secure rights and are subject to judicial review.

Beyond that, the City of Detmold has deliberately chosen to strengthen participation structurally beyond these statutory requirements. With the council-adopted guidelines for public participation there is a politically binding frame of orientation for informal participation. The guidelines set out core principles such as early involvement, transparency, traceability of decisions and the obligation to report back on how participation results were handled. Participation is explicitly understood as advisory; decision-making responsibility remains with politics and administration. For participants this means contributions feed in but do not replace democratically legitimised decisions.

In addition, both the sustainability strategy and the city's smart-city concept anchor participation as a cross-cutting task of municipal development. Participation is understood here as a prerequisite for acceptance, capacity to learn and long-term effectiveness — especially in the context of digital and hybrid transformation. The orientation towards the federal Smart City Charter underlines the ambition to integrate participation into administrative processes in a transparent, low-barrier, structural and binding way.`,
    },
    {
      title: 'Statutory minimum requirements',
      body: `Legally binding are above all formal participation procedures derived from the North Rhine-Westphalia municipal code and special legislation, particularly building and planning law. These procedures define minimum standards for information, participation and public display and form the legal foundation of municipal participation. In concrete terms they regulate when participation is required, how information is provided and which deadlines and requirements apply. Minimum requirements guarantee procedures — but not automatically the quality of dialogue.

**For participants this means:** in these procedures there is a legally secured entitlement to information and to comment.`,
    },
    {
      title: 'Municipal self-commitments',
      body: `Beyond these minimum requirements, the City of Detmold has deliberately chosen — and politically committed itself — to strengthen participation structurally. With the council-adopted guidelines for public participation there is a politically binding frame of orientation for informal participation. The guidelines set out core principles such as early involvement, transparency, traceability of decisions and the obligation to report back on how participation results were handled. Participation is explicitly understood as advisory; decision-making responsibility remains with politics and administration.

In addition, both the sustainability strategy and the smart-city concept anchor participation as a cross-cutting task of municipal development. This level is not law, but it is politically binding. It creates expectations about how participation is designed.

**For participants no enforceable legal claim arises here — but a clearly formulated quality standard does.** Participation is understood as a prerequisite for acceptance, capacity to learn and long-term effectiveness, especially in the context of digital and hybrid transformation processes.`,
    },
    {
      title: 'Strategic anchoring (sustainability & smart city)',
      body: `The sustainability strategy and the smart-city concept anchor participation as a cross-cutting task of municipal development.

Participation is justified here not legally but functionally: it increases acceptance, improves the quality of decisions and strengthens learning processes — especially in complex transformation processes such as digital and hybrid projects.

This level creates no legal entitlement, but a clearly formulated political frame of expectation and a strategic mandate to act.`,
    },
    {
      title: 'OGP Local as an additional framework',
      body: `Through its involvement in OGP Local, Detmold is additionally subject to an international open-government framework that structures participation in a procedurally — though not legally — binding way. OGP Local obliges participating municipalities to co-create action plans, to document progress transparently and to evaluate participation processes regularly.

Even though OGP Local is not a statutory basis, taking part creates a formalised frame of expectation and accountability: participation must be planned, traceable, openly documented and designed together with civil-society actors. OGP Local thereby reinforces existing municipal guidelines and shifts participation further away from voluntary one-off measures towards a permanently verifiable process.`,
    },
    {
      title: 'Consequences for practice (application level)',
      body: `*Aka: what does this mean for my project, and how does the toolbox help?*

**What matters for staff** — what does this mean concretely for participation projects?

- Participation is **not an end in itself** — it must be consciously planned, justified, documented and supported
- Project leads must clarify early on **what scope for participation exists** and how contributions can feed into decisions
- Transparency is not an extra service but the precondition for bindingness and trust
- Informal participation is legally permissible, but **politically accountable** and must be secured organisationally
- In the OGP Local context, additional requirements for documentation, co-creation and public feedback apply
- Data protection, role and access concepts are an integral part of digital participation

**What matters for participants** — what does this mean concretely for my involvement?

- Participants are entitled to **clarity** about what is at stake, what can be influenced and who decides in the end
- They may expect their contributions to be seriously examined, documented and visibly considered. But: **participation means contributing — not automatic co-decision**
- Transparent **feedback** is part of the process. If proposals are not adopted, the reasons must be traceable
- Participation must be designed to be **understandable, low-barrier and data-protection compliant**, so that it becomes and remains accessible to as many people as possible`,
    },
    {
      title: 'The role of the SC PUT within the legal framework',
      body: `The Smart City Participation & Usability Toolbox takes no legally binding decisions and replaces no formal procedures. It does, however, act as structuring infrastructure between politics and practice.

Through transparent project presentation, structured process logic, documented feedback loops and collaborative working tools it supports staff in making formal and informal participation connectable, implementing municipal guidelines consistently, meeting OGP Local requirements for transparency, co-creation and monitoring, and establishing participation as a traceable, learning process.

For participants the toolbox creates orientation: What is open? Who decides? What was contributed? How was it decided?

The toolbox thereby closes a structural gap between political expectation and lived participation practice.`,
    },
    {
      title: 'The overall picture',
      body: `Overall, participation in Detmold moves within a field of tension between legal permissibility, political self-commitment, international programme logic and organisational implementation. The central challenge lies less in a lack of rules than in their consistent, transparent and adaptive application in everyday administration.`,
    },
  ],
}

export const GRUNDLAGEN_SEED: Record<'de' | 'en', GrundlagenSeedLocale> = { de: DE, en: EN }
