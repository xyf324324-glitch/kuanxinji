import wellnessCatalog from './catalog.json'

export const solarTermWellnessItems = [...wellnessCatalog.items].sort((a, b) => a.sequence - b.sequence)

export function getSolarTermWellness(termOrId) {
  return solarTermWellnessItems.find((item) => item.term === termOrId || item.id === termOrId)
}

export function hasSolarTermWellness(term) {
  return solarTermWellnessItems.some((item) => item.term === term)
}

export const solarTermWellnessMeta = {
  version: wellnessCatalog.version,
  editorialNote: wellnessCatalog.editorialNote,
}
