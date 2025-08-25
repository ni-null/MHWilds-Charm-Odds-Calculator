import React from "react"
import { useTranslation } from "react-i18next"

const LanguageSwitcher = ({ className = "" }) => {
  const { i18n } = useTranslation()

  const changeLanguage = (newLang) => {
    i18n.changeLanguage(newLang)
  }

  const languages = [
    { code: "zhTW", name: "中文" },
    { code: "zhCN", name: "简体中文" },
    { code: "enUS", name: "English" },
    { code: "jaJP", name: "日本語" },
  ]

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => changeLanguage(language.code)}
          className={`px-3  py-1 text-sm font-medium rounded-md transition-colors ${
            i18n.language === language.code ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}>
          {language.name}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
