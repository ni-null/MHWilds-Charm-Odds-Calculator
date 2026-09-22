import { getIntlLocale } from "./languages.js"

export const translateSkillName = (t, skillName) =>
  t(`skillTranslations.${skillName}`, {
    defaultValue: skillName,
  })

export const formatSkillLabel = (t, skillKey) => {
  const [skillName, skillLevel = ""] = String(skillKey || "").split(" Lv.")
  const translatedName = translateSkillName(t, skillName)
  const levelLabel = t("common.level", { defaultValue: "Lv." })
  return skillLevel ? `${translatedName} ${levelLabel}${skillLevel}` : translatedName
}

export const formatNumber = (value, languageCode, options) => new Intl.NumberFormat(getIntlLocale(languageCode), options).format(value)

export const formatDate = (value, languageCode, options) => new Intl.DateTimeFormat(getIntlLocale(languageCode), options).format(new Date(value))
