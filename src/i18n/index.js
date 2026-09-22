import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { DEFAULT_LANGUAGE, resolveLanguageCode } from "./languages.js"
import { I18N_RESOURCES } from "./resources.js"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: I18N_RESOURCES,
    fallbackLng: DEFAULT_LANGUAGE,

    // 語言檢測配置
    detection: {
      // 檢測順序：localStorage -> 瀏覽器語言 -> 預設語言
      order: ["localStorage", "navigator", "htmlTag"],
      // localStorage 中的 key 名稱
      lookupLocalStorage: "i18nextLng",
      // 緩存用戶語言選擇
      caches: ["localStorage"],
      // 語言對應映射
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      convertDetectedLanguage: resolveLanguageCode,
    },

    interpolation: {
      escapeValue: false, // React 已經預設防止 XSS
    },

    // 調試模式
    debug: false,
  })

export default i18n
