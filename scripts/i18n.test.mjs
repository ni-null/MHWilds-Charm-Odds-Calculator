import assert from "node:assert/strict"
import test from "node:test"
import { formatDate, formatNumber, formatSkillLabel } from "../src/i18n/formatters.js"
import { DEFAULT_LANGUAGE, getIntlLocale, resolveLanguageCode, SUPPORTED_LANGUAGES } from "../src/i18n/languages.js"
import { getWikiDbSkillTranslations, serializeWikiDbCharm } from "../src/lib/wikiDbCharmExport.js"

test("resolveLanguageCode recognizes persisted codes, aliases, and browser variants", () => {
  const cases = {
    zhTW: "zhTW",
    "zh-TW": "zhTW",
    "zh-Hant": "zhTW",
    "zh-HK": "zhTW",
    zhCN: "zhCN",
    "zh-CN": "zhCN",
    "zh-Hans": "zhCN",
    enUS: "enUS",
    "en-GB": "enUS",
    ja: "jaJP",
    "ja-JP": "jaJP",
    ko: "koKR",
    "ko-KR": "koKR",
    "": DEFAULT_LANGUAGE,
    "de-DE": DEFAULT_LANGUAGE,
  }

  Object.entries(cases).forEach(([input, expected]) => assert.equal(resolveLanguageCode(input), expected))
})

test("every supported language has a valid Intl locale", () => {
  SUPPORTED_LANGUAGES.forEach((language) => {
    assert.equal(getIntlLocale(language.code), language.locale)
    assert.deepEqual(Intl.getCanonicalLocales(language.locale), [language.locale])
  })
})

test("formatters localize numbers, dates, and skill labels with a source-name fallback", () => {
  assert.equal(formatNumber(1234567, "jaJP"), new Intl.NumberFormat("ja-JP").format(1234567))
  assert.equal(
    formatDate("2025-01-02T03:04:05Z", "koKR", { dateStyle: "short" }),
    new Intl.DateTimeFormat("ko-KR", { dateStyle: "short" }).format(new Date("2025-01-02T03:04:05Z"))
  )

  const koreanT = (key, options = {}) => (key === "skillTranslations.Attack Boost" ? "공격" : options.defaultValue || key)
  const fallbackT = (key, options = {}) => options.defaultValue || key

  assert.equal(formatSkillLabel(koreanT, "Attack Boost Lv.3"), "공격 Lv.3")
  assert.equal(formatSkillLabel(fallbackT, "Unknown Skill Lv.1"), "Unknown Skill Lv.1")
})

test("wiki-db translations use the shared language registry and English fallback", () => {
  assert.equal(getWikiDbSkillTranslations("ko-KR")["Attack Boost"], "공격")
  assert.equal(getWikiDbSkillTranslations("unsupported")["Attack Boost"], "Attack Boost")

  const row = serializeWikiDbCharm(["Attack Boost Lv.1"], null, getWikiDbSkillTranslations("koKR"))
  assert.ok(row.startsWith("공격,1,"))
})
