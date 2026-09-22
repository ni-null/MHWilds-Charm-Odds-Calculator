import React from "react"
import { useTranslation } from "react-i18next"
import { resolveLanguageCode, SUPPORTED_LANGUAGES } from "../i18n/languages.js"

const LanguageSwitcher = ({ className = "" }) => {
  const { i18n } = useTranslation()
  const languageCode = resolveLanguageCode(i18n.resolvedLanguage || i18n.language)

  const changeLanguage = (newLang) => {
    i18n.changeLanguage(newLang)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language.code}
          onClick={() => changeLanguage(language.code)}
          className={`px-3  py-1 text-sm font-medium rounded-md transition-colors ${
            languageCode === language.code ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}>
          {language.nativeName}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
