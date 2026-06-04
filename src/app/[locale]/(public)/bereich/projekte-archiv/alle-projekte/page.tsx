import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { getCitySettings } from '@/lib/instance'
import { AlleProjekteClient } from './AlleProjekteClient'
import type { Project } from './ProjectLibrary'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Alle Projekte – Urban KIT',
    description: 'Alle öffentlichen Stadtentwicklungsprojekte in der Übersicht.',
  }
}

async function getAllProjects(): Promise<Project[]> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { isPublic: { equals: true } },
      sort: '-createdAt',
      limit: 200,
      overrideAccess: true,
    })
    return result.docs as unknown as Project[]
  } catch {
    return []
  }
}

export default async function AlleProjektePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()
  const projects = await getAllProjects()

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav locale={locale} cityName={cityName} cityLogoUrl={cityLogoUrl} />
      <AlleProjekteClient projects={projects} locale={locale} cityName={cityName} />
      <PublicFooter locale={locale} />
    </div>
  )
}
