import type { Plugin } from 'payload'

// Module manifests declare: id, name, icon, hasPublicContent
export interface ModuleManifest {
  id: string
  name: string
  icon: string
  hasPublicContent: boolean
}

class ModuleRegistry {
  private _plugins: Plugin[] = []
  private _manifests: ModuleManifest[] = []

  register(manifest: ModuleManifest, plugin: Plugin) {
    this._manifests.push(manifest)
    this._plugins.push(plugin)
  }

  plugins(): Plugin[] {
    return this._plugins
  }

  manifests(): ModuleManifest[] {
    return this._manifests
  }
}

export const moduleRegistry = new ModuleRegistry()
