import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import skillGroupsData from "../src/data/SkillGroups.json" with { type: "json" }
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "../src/i18n/languages.js"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const localesDirectory = path.resolve(scriptDirectory, "../src/i18n/locales")

const flattenKeys = (value, prefix = "") =>
  Object.entries(value).flatMap(([key, child]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return child && typeof child === "object" && !Array.isArray(child) ? flattenKeys(child, fullKey) : [fullKey]
  })

const readLocale = (language) => {
  const filePath = path.join(localesDirectory, `${language.locale}.json`)
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

const errors = []
const codes = new Set()
const locales = new Set()
const expectedFiles = new Set(SUPPORTED_LANGUAGES.map((language) => `${language.locale}.json`))

SUPPORTED_LANGUAGES.forEach((language) => {
  if (codes.has(language.code)) errors.push(`Duplicate language code: ${language.code}`)
  if (locales.has(language.locale)) errors.push(`Duplicate Intl locale: ${language.locale}`)
  codes.add(language.code)
  locales.add(language.locale)

  try {
    Intl.getCanonicalLocales(language.locale)
  } catch {
    errors.push(`Invalid BCP 47 locale for ${language.code}: ${language.locale}`)
  }

  if (!language.nativeName) errors.push(`Missing nativeName for ${language.code}`)
  if (!language.translation) errors.push(`Missing translation resource for ${language.code}`)
})

if (!codes.has(DEFAULT_LANGUAGE)) errors.push(`DEFAULT_LANGUAGE is not registered: ${DEFAULT_LANGUAGE}`)

const localeFiles = fs.readdirSync(localesDirectory).filter((file) => file.endsWith(".json"))
localeFiles.filter((file) => !expectedFiles.has(file)).forEach((file) => errors.push(`Locale file is not registered: ${file}`))
Array.from(expectedFiles).filter((file) => !localeFiles.includes(file)).forEach((file) => errors.push(`Registered locale file is missing: ${file}`))

const defaultLanguage = SUPPORTED_LANGUAGES.find((language) => language.code === DEFAULT_LANGUAGE)
const defaultKeys = new Set(flattenKeys(readLocale(defaultLanguage)))
const skillNames = [...new Set(Object.values(skillGroupsData.SkillGroups).flatMap((group) => group.data.map((skill) => skill.SkillName)))]

SUPPORTED_LANGUAGES.forEach((language) => {
  const locale = readLocale(language)
  const keys = new Set(flattenKeys(locale))
  const missing = [...defaultKeys].filter((key) => !keys.has(key))
  const extra = [...keys].filter((key) => !defaultKeys.has(key))

  if (missing.length) errors.push(`${language.code} is missing keys: ${missing.join(", ")}`)
  if (extra.length) errors.push(`${language.code} has unexpected keys: ${extra.join(", ")}`)

  const missingSkillTranslations = skillNames.filter((skillName) => !locale.skillTranslations?.[skillName])
  if (missingSkillTranslations.length) {
    errors.push(`${language.code} is missing skill translations: ${missingSkillTranslations.join(", ")}`)
  }
})

if (errors.length) {
  console.error("i18n validation failed:\n" + errors.map((error) => `- ${error}`).join("\n"))
  process.exitCode = 1
} else {
  console.log(`i18n validation passed for ${SUPPORTED_LANGUAGES.length} languages and ${skillNames.length} skills.`)
}
