import rarityData from "../data/Rarity.json" with { type: "json" }
import skillGroupsData from "../data/SkillGroups.json" with { type: "json" }
import { DEFAULT_LANGUAGE } from "../i18n/languages.js"
import { getTranslationResource } from "../i18n/resources.js"

const MAX_WIKI_DB_ROWS = 100000
export const WIKI_DB_TEXT_WARNING_BYTES = 120 * 1024
export const WIKI_DB_ALL_SLOTS = "__all__"
export const WIKI_DB_NO_SLOT = "__none__"

export const getWikiDbSkillTranslations = (locale) => getTranslationResource(locale).skillTranslations || {}

const getSkillBaseName = (skillKey) => String(skillKey || "").split(" Lv.")[0]

export const parseWikiDbSkillKey = (skillKey) => {
  const value = String(skillKey || "").trim()
  const match = value.match(/^(.*) Lv\.(\d+)$/)

  if (!match) {
    return { name: value, level: 0 }
  }

  return { name: match[1], level: Number(match[2]) }
}

const getGroupSkills = (groupNumber) => {
  const group = skillGroupsData.SkillGroups?.[String(groupNumber)]
  return Array.isArray(group?.data) ? group.data.map((skill) => `${skill.SkillName} Lv.${skill.SkillLevel}`) : []
}

const skillBelongsToGroup = (skillKey, groupNumber) => {
  const skillName = parseWikiDbSkillKey(skillKey).name
  return getGroupSkills(groupNumber).some((candidate) => parseWikiDbSkillKey(candidate).name === skillName && candidate === skillKey)
}

const hasUsedSkillName = (usedNamesByGroup, groupNumber, skillKey) => {
  const names = usedNamesByGroup.get(String(groupNumber))
  return names ? names.has(getSkillBaseName(skillKey)) : false
}

const addUsedSkillName = (usedNamesByGroup, groupNumber, skillKey) => {
  const key = String(groupNumber)
  if (!usedNamesByGroup.has(key)) usedNamesByGroup.set(key, new Set())
  usedNamesByGroup.get(key).add(getSkillBaseName(skillKey))
}

const removeUsedSkillName = (usedNamesByGroup, groupNumber, skillKey) => {
  const key = String(groupNumber)
  const names = usedNamesByGroup.get(key)
  if (!names) return
  names.delete(getSkillBaseName(skillKey))
  if (names.size === 0) usedNamesByGroup.delete(key)
}

const getSkillVariants = (charm) => {
  const groups = Array.isArray(charm?.groups) ? charm.groups.filter((group) => group !== null && group !== undefined) : []
  const selectedSkills = Array.isArray(charm?.matchingSkills) ? charm.matchingSkills.filter(Boolean) : []

  if (groups.length === 0 || selectedSkills.length >= groups.length) {
    return [selectedSkills.slice(0, 3)]
  }

  const variants = []
  const assigned = Array(groups.length).fill(null)
  const usedPositions = new Set()
  const usedNamesByGroup = new Map()

  const fillUnselectedPositions = (position) => {
    while (position < groups.length && assigned[position]) position += 1

    if (position >= groups.length) {
      const canonicalSkills = assigned.filter(Boolean).slice().sort()
      const key = JSON.stringify(canonicalSkills)
      if (!variants.some((variant) => variant.key === key)) variants.push({ key, skills: canonicalSkills })
      return
    }

    const groupNumber = groups[position]
    getGroupSkills(groupNumber).forEach((skillKey) => {
      if (hasUsedSkillName(usedNamesByGroup, groupNumber, skillKey)) return

      assigned[position] = skillKey
      addUsedSkillName(usedNamesByGroup, groupNumber, skillKey)
      fillUnselectedPositions(position + 1)
      removeUsedSkillName(usedNamesByGroup, groupNumber, skillKey)
      assigned[position] = null
    })
  }

  const assignSelectedSkills = (skillIndex) => {
    if (skillIndex >= selectedSkills.length) {
      fillUnselectedPositions(0)
      return
    }

    const skillKey = selectedSkills[skillIndex]
    groups.forEach((groupNumber, position) => {
      if (usedPositions.has(position) || !skillBelongsToGroup(skillKey, groupNumber)) return
      if (hasUsedSkillName(usedNamesByGroup, groupNumber, skillKey)) return

      usedPositions.add(position)
      assigned[position] = skillKey
      addUsedSkillName(usedNamesByGroup, groupNumber, skillKey)
      assignSelectedSkills(skillIndex + 1)
      removeUsedSkillName(usedNamesByGroup, groupNumber, skillKey)
      assigned[position] = null
      usedPositions.delete(position)
    })
  }

  assignSelectedSkills(0)

  return variants.length > 0 ? variants.map((variant) => variant.skills) : [selectedSkills.slice(0, 3)]
}

export const getSelectableSkillCounts = (charm) => {
  const groups = Array.isArray(charm?.groups) ? charm.groups : []
  const selectedSkills = Array.isArray(charm?.matchingSkills) ? charm.matchingSkills.filter(Boolean) : []
  const selectedSkillNames = new Set(selectedSkills.map(getSkillBaseName))

  return groups.slice(selectedSkills.length).map((groupNumber) => {
    const selectableSkills = getGroupSkills(groupNumber).filter((skillKey) => !selectedSkillNames.has(getSkillBaseName(skillKey)))
    return new Set(selectableSkills).size
  })
}

export const getSelectableSkillCount = (charm) => getSelectableSkillCounts(charm).reduce((total, count) => total + count, 0)

const parseSlotKey = (slotKey) => {
  if (!slotKey) return []
  if (Array.isArray(slotKey)) return slotKey

  try {
    const parsed = JSON.parse(slotKey)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const convertSlotKeyToWikiDbFields = (slotKey) => {
  const armorSlots = []
  const weaponSlots = []

  parseSlotKey(slotKey).forEach((slot) => {
    if (typeof slot === "string" && slot.toUpperCase().startsWith("W")) {
      const level = Number(slot.slice(1))
      if (Number.isFinite(level) && weaponSlots.length < 3) weaponSlots.push(level)
      return
    }

    const level = Number(slot)
    if (Number.isFinite(level) && armorSlots.length < 3) armorSlots.push(level)
  })

  return [...armorSlots, ...Array(3 - armorSlots.length).fill(0), ...weaponSlots, ...Array(3 - weaponSlots.length).fill(0)]
}

export const getWikiDbSlotKeys = (charm) => {
  const directKeys = Array.isArray(charm?.slotKeys) ? charm.slotKeys.filter(Boolean) : []
  if (directKeys.length > 0) return directKeys

  const allKeys = Array.isArray(charm?.AllslotKey) ? charm.AllslotKey.filter(Boolean) : []
  if (allKeys.length > 0) return allKeys

  const rarity = rarityData[charm?.rarity]
  const group = rarity?.Group?.find((entry) => JSON.stringify(entry.skills) === JSON.stringify(charm?.groups || []))
  const groupKeys = group?.slot ? Object.keys(group.slot) : []
  return groupKeys.length > 0 ? groupKeys : [null]
}

export const formatWikiDbSlotKey = (slotKey, noSlotLabel = "No slots") => {
  if (slotKey === null || slotKey === undefined) return noSlotLabel

  try {
    const parsed = typeof slotKey === "string" ? JSON.parse(slotKey) : slotKey
    if (Array.isArray(parsed)) return `[${parsed.join(", ")}]`
  } catch {
    // Keep the original value when it is not a JSON array.
  }

  return String(slotKey)
}

const getSelectedSlotKeys = (charm, slotSelection) => {
  const slotKeys = getWikiDbSlotKeys(charm)
  if (!slotSelection || slotSelection === WIKI_DB_ALL_SLOTS) return slotKeys

  const selections = Array.isArray(slotSelection) ? slotSelection : [slotSelection]
  if (selections.includes(WIKI_DB_ALL_SLOTS)) return slotKeys

  return slotKeys.filter((slotKey) => {
    const value = slotKey === null || slotKey === undefined ? WIKI_DB_NO_SLOT : String(slotKey)
    return selections.includes(value)
  })
}

const getUtf8ByteLength = (value, encoder) => (encoder ? encoder.encode(value).length : value.length)

export const getWikiDbExportSummary = (
  favoriteCharms,
  { expandUnspecifiedSkills = true, maxRows = MAX_WIKI_DB_ROWS, slotSelections = [], locale = DEFAULT_LANGUAGE, skillTranslations } = {}
) => {
  let rowCount = 0
  let textByteLength = 0
  let truncated = false
  const encoder = typeof globalThis?.TextEncoder === "function" ? new globalThis.TextEncoder() : null
  const translations = skillTranslations || getWikiDbSkillTranslations(locale)
  const charms = Array.isArray(favoriteCharms) ? favoriteCharms : []

  for (const [charmIndex, charm] of charms.entries()) {
    const skills = expandUnspecifiedSkills ? getSkillVariants(charm) : [Array.isArray(charm?.matchingSkills) ? charm.matchingSkills.slice(0, 3) : []]
    const slotKeys = getSelectedSlotKeys(charm, slotSelections[charmIndex])

    for (const skillVariant of skills) {
      for (const slotKey of slotKeys) {
        if (rowCount >= maxRows) {
          truncated = true
          break
        }

        const row = serializeWikiDbCharm(skillVariant, slotKey, translations)
        textByteLength += getUtf8ByteLength(row, encoder) + (rowCount > 0 ? 1 : 0)
        rowCount += 1
      }
      if (truncated) break
    }
    if (truncated) break
  }

  return { rowCount, textByteLength, truncated }
}

export const getWikiDbExportRowCount = (favoriteCharms, options = {}) => {
  const { rowCount, truncated } = getWikiDbExportSummary(favoriteCharms, options)
  return { rowCount, truncated }
}

const translateSkillName = (skillName, skillTranslations) => skillTranslations?.[skillName] || skillName

export const serializeWikiDbCharm = (skills, slotKey, skillTranslations = getWikiDbSkillTranslations()) => {
  const skillFields = Array.from({ length: 3 }, (_, index) => {
    const skill = skills[index]
    if (!skill) return ["", 0]

    const parsedSkill = parseWikiDbSkillKey(skill)
    return [translateSkillName(parsedSkill.name, skillTranslations), parsedSkill.level]
  }).flat()

  return [...skillFields, ...convertSlotKeyToWikiDbFields(slotKey)].join(",")
}

export const buildWikiDbExport = (
  favoriteCharms,
  { expandUnspecifiedSkills = true, maxRows = MAX_WIKI_DB_ROWS, slotSelections = [], locale = DEFAULT_LANGUAGE, skillTranslations } = {}
) => {
  let text = ""
  let rowCount = 0
  let truncated = false
  const translations = skillTranslations || getWikiDbSkillTranslations(locale)

  const charms = Array.isArray(favoriteCharms) ? favoriteCharms : []
  for (const [charmIndex, charm] of charms.entries()) {
    const skills = expandUnspecifiedSkills ? getSkillVariants(charm) : [Array.isArray(charm?.matchingSkills) ? charm.matchingSkills.slice(0, 3) : []]
    const slotKeys = getSelectedSlotKeys(charm, slotSelections[charmIndex])

    for (const skillVariant of skills) {
      for (const slotKey of slotKeys) {
        if (rowCount >= maxRows) {
          truncated = true
          break
        }
        const row = serializeWikiDbCharm(skillVariant, slotKey, translations)
        text += `${rowCount > 0 ? "\n" : ""}${row}`
        rowCount += 1
      }
      if (truncated) break
    }
    if (truncated) break
  }

  return {
    text,
    rowCount,
    truncated,
  }
}

export const MAX_EXPORT_ROWS = MAX_WIKI_DB_ROWS
