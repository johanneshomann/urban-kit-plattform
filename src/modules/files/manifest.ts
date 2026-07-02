import type { ModuleManifest } from '../registry'

export const filesManifest: ModuleManifest = {
  id: 'files',
  name: 'Dateien',
  icon: 'folder',
  // file-uploads/folders have a PUBLIC visibility tier and the public project
  // page renders them (FilesBrowse tier="public")
  hasPublicContent: true,
}
