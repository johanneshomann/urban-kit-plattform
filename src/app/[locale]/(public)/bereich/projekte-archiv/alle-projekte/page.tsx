import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { getCitySettings } from '@/lib/instance'
import { AlleProjekteClient } from './AlleProjekteClient'
import type { Project } from './ProjectLibrary'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'alleProjekte' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
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
      <PublicNavServer locale={locale} />
      <AlleProjekteClient projects={projects} locale={locale} cityName={cityName} />
      <PublicFooter locale={locale} />
    </div>
  )
}
