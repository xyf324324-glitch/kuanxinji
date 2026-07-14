import meridianCatalog from './catalog.json'

export const meridianItems = [...meridianCatalog.items].sort((a, b) => a.sequence - b.sequence)
export const meridianMeta = {
  version: meridianCatalog.version,
  editorialNote: meridianCatalog.editorialNote,
  classic: meridianCatalog.classic,
  sources: meridianCatalog.sources,
}

export function getMeridian(id) {
  return meridianItems.find((item) => item.id === id) || meridianItems[0]
}
