import enUS from "./locales/en-US.json" with { type: "json" }
import jaJP from "./locales/ja-JP.json" with { type: "json" }
import koKR from "./locales/ko-KR.json" with { type: "json" }
import zhCN from "./locales/zh-CN.json" with { type: "json" }
import zhTW from "./locales/zh-TW.json" with { type: "json" }

export const DEFAULT_LANGUAGE = "enUS"

export const SUPPORTED_LANGUAGES = Object.freeze([
  {
    code: "zhTW",
    locale: "zh-TW",
    nativeName: "繁體中文",
    aliases: ["zhTW", "zh-TW", "zh-Hant", "zh-HK", "zh"],
    translation: zhTW,
  },
  {
    code: "zhCN",
    locale: "zh-CN",
    nativeName: "简体中文",
    aliases: ["zhCN", "zh-CN", "zh-Hans"],
    translation: zhCN,
  },
  {
    code: "enUS",
    locale: "en-US",
    nativeName: "English",
    aliases: ["enUS", "en-US", "en"],
    translation: enUS,
  },
  {
    code: "jaJP",
    locale: "ja-JP",
    nativeName: "日本語",
    aliases: ["jaJP", "ja-JP", "ja"],
    translation: jaJP,
  },
  {
    code: "koKR",
    locale: "ko-KR",
    nativeName: "한국어",
    aliases: ["koKR", "ko-KR", "ko"],
    translation: koKR,
  },
])

const normalizeLanguageInput = (value) => String(value || "").trim().toLowerCase().replace(/[-_]/g, "")

export const resolveLanguageCode = (value) => {
  const normalized = normalizeLanguageInput(value)
  if (!normalized) return DEFAULT_LANGUAGE

  const language = SUPPORTED_LANGUAGES.find((entry) =>
    [entry.code, ...entry.aliases].some((alias) => normalizeLanguageInput(alias) === normalized)
  )

  if (language) return language.code
  if (normalized.startsWith("zh")) return normalized.includes("cn") || normalized.includes("hans") ? "zhCN" : "zhTW"
  if (normalized.startsWith("en")) return "enUS"
  if (normalized.startsWith("ja")) return "jaJP"
  if (normalized.startsWith("ko")) return "koKR"
  return DEFAULT_LANGUAGE
}

export const getLanguage = (value) => {
  const code = resolveLanguageCode(value)
  return SUPPORTED_LANGUAGES.find((entry) => entry.code === code)
}

export const getIntlLocale = (value) => getLanguage(value).locale
