const lexicalText = (text: string) => ({
  detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1,
})

const lexicalParagraph = (text: string) => ({
  children: [lexicalText(text)],
  direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
})

const lexicalHeading = (text: string, tag: 'h2' | 'h3' = 'h2') => ({
  children: [lexicalText(text)],
  direction: 'ltr', format: '', indent: 0, type: 'heading', tag, version: 1,
})

const lexicalDocument = (...nodes: object[]) => ({
  root: {
    children: nodes,
    direction: 'ltr', format: '', indent: 0, type: 'root', version: 1,
  },
})

export const projectDefaults = {
  colorScheme: 'Sandstein',
  coverImage: '/defaults/project-cover.jpg',
  gallery: [
    { image: '/defaults/default-1.jpg', caption: '' },
    { image: '/defaults/default-2.jpg', caption: '' },
    { image: '/defaults/default-3.jpg', caption: '' },
    { image: '/defaults/default-4.jpg', caption: '' },
    { image: '/defaults/default-5.jpg', caption: '' },
  ],
  status: 'planning',
  altersgruppe: ['erwachsene'],
  gender: ['alle'],
  isPublic: true,
  joinRequestsEnabled: true,

  shortDescription:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dieses Projekt widmet sich der aktiven Gestaltung des städtischen Lebensraums durch bürgerschaftliches Engagement und gemeinsame Planung.',

  projektbeschreibung: lexicalDocument(
    lexicalHeading('Hintergrund'),
    lexicalParagraph(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Das Projekt entstand aus dem Wunsch der Bürgerinnen und Bürger, aktiv an der Gestaltung ihres Stadtteils teilzunehmen und nachhaltige Veränderungen anzustoßen.',
    ),
    lexicalHeading('Ziele'),
    lexicalParagraph(
      'Ziel des Projekts ist es, gemeinsam mit allen Beteiligten konkrete Maßnahmen zu entwickeln und umzusetzen. Dabei stehen Transparenz, Offenheit und die Einbeziehung verschiedener Perspektiven im Mittelpunkt.',
    ),
    lexicalHeading('Vorgehen'),
    lexicalParagraph(
      'In mehreren Phasen werden Ideen gesammelt, bewertet und schließlich realisiert. Workshops, digitale Beteiligung und öffentliche Veranstaltungen ermöglichen eine breite Teilhabe aller Interessierten.',
    ),
  ),
}
