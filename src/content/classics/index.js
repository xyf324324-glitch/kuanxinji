import classicsCatalog from './catalog.json'

export const classicsItems = [...classicsCatalog.items].sort((a, b) => a.sequence - b.sequence)

export const classicsMeta = {
  title: classicsCatalog.title,
  subtitle: classicsCatalog.subtitle,
  version: classicsCatalog.version,
  editorialNote: classicsCatalog.editorialNote,
  sources: classicsCatalog.sources,
}

export function getClassic(id) {
  return classicsItems.find((item) => item.id === id) || classicsItems[0]
}
