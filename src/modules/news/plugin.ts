import type { Plugin } from 'payload'
import { NewsPosts } from './collections/news-posts'
import { NewsComments } from './collections/news-comments'
import { newsManifest } from './manifest'
import { moduleRegistry } from '../registry'

const newsPlugin: Plugin = (incomingConfig) => {
  return {
    ...incomingConfig,
    collections: [...(incomingConfig.collections ?? []), NewsPosts, NewsComments],
  }
}

moduleRegistry.register(newsManifest, newsPlugin)

export { newsPlugin }
