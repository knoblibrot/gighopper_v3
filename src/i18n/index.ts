import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './de.json'

// German first. A new language is a new JSON file plus an entry here.
export const LOCALES = { de: 'de-DE' } as const

void i18n.use(initReactI18next).init({
  resources: { de: { translation: de } },
  lng: 'de',
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
})

export function locale(): string {
  return LOCALES[i18n.language as keyof typeof LOCALES] ?? 'de-DE'
}

export default i18n
