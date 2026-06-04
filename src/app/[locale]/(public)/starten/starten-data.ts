import { UserRound, Building2, Trash2, Search, FileText, UserPlus, Layers, Library, CheckCircle, type LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  body: string
}

export const STEP_FEATURES: Feature[][] = [
  [
    { icon: UserRound, title: 'Anonym oder mit Name', body: 'Du kannst einen Nutzernamen wählen, der nichts mit deinem echten Namen zu tun hat. Nur eine gültige E-Mail-Adresse ist nötig — sie wird nicht öffentlich angezeigt.' },
    { icon: Building2, title: 'Auch mit AppmoId-Konto', body: 'Du hast bereits ein Konto bei AppmoId, dem Bürger:innenportal der Stadt? Damit kannst du dich direkt bei UrbanKIT anmelden — kein zweites Konto nötig.' },
    { icon: Trash2, title: 'Jederzeit löschbar', body: 'Du kannst dein Konto jederzeit vollständig löschen. Alle personenbezogenen Daten werden dann unwiderruflich entfernt.' },
  ],
  [
    { icon: Search, title: 'Projekte durchsuchen', body: 'Filter nach Thema, Phase oder Stadtteil — so findest du schnell, was dich betrifft: eine Straße, dein Viertel, deine Themen.' },
    { icon: FileText, title: 'Hintergründe verstehen', body: 'Jedes Projekt erklärt den Kontext: Worum wird hier geplant? Was wurde bisher entschieden? Welche Optionen stehen zur Auswahl?' },
    { icon: UserPlus, title: 'Projekt beitreten', body: 'Du kannst einem Projekt auf verschiedenen Wegen beitreten: direkt auf der Plattform, bei einer öffentlichen Veranstaltung oder über einen Einladungscode.' },
  ],
  [
    { icon: Layers, title: 'Urban KIT Module', body: 'Jedes Projekt nutzt Bausteine aus dem Urban KIT — strukturierte Methoden und Werkzeuge, die Beteiligung greifbar machen: von Abstimmungen bis hin zu kollaborativen Karten.' },
    { icon: Library, title: 'Grundlagen & Methoden', body: 'UrbanKIT macht Planungswissen zugänglich. Du findest Hintergrundinformationen zu städtebaulichen Methoden und kannst das Wissen aus abgeschlossenen Projekten nutzen.' },
    { icon: CheckCircle, title: 'Gemeinsam ein Ergebnis', body: 'Am Ende steht ein konkretes Ergebnis — getragen von Stadt, Fachleuten und Bürger:innen gemeinsam. Dein Beitrag ist dokumentiert und fließt direkt in die Planung ein.' },
  ],
]
