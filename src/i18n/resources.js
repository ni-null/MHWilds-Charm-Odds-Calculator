import { getLanguage, SUPPORTED_LANGUAGES } from "./languages.js"

export const I18N_RESOURCES = Object.freeze(
  Object.fromEntries(SUPPORTED_LANGUAGES.map((language) => [language.code, { translation: language.translation }]))
)

export const getTranslationResource = (languageCode) => getLanguage(languageCode).translation
