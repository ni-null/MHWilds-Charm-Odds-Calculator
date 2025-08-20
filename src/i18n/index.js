import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import zhTW from "./locales/zh-TW.json"
import enUS from "./locales/en-US.json"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zhTW: {
        translation: zhTW,
      },
      enUS: {
        translation: enUS,
      },
    },
    fallbackLng: "enUS", // 預設回退語言為英文

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
      // 將瀏覽器語言映射到我們的語言代碼
      convertDetectedLanguage: (lng) => {
        // 處理瀏覽器語言代碼到我們的語言代碼的映射
        if (lng.startsWith("zh")) {
          // zh, zh-TW, zh-CN, zh-HK 等都映射到 zhTW
          return "zhTW"
        }
        if (lng.startsWith("en")) {
          // en, en-US, en-GB 等都映射到 enUS
          return "enUS"
        }
        // 其他語言回退到英文
        return "enUS"
      },
    },

    interpolation: {
      escapeValue: false, // React 已經預設防止 XSS
    },

    // 調試模式
    debug: false,
  })

export default i18n
