import React, { useMemo, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import useMhwStore from "../../store/mhwStore"
import rarityBaseProbability from "../../data/Rarity.json"
import SkillGroupsData from "../../data/SkillGroups.json"

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SkillSelector() {
  const { t, i18n } = useTranslation()
  // inline placeholder SVG used when skill icon fails to load
  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
        "<rect fill='%23efefef' width='100%' height='100%'/>" +
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23999'>?" +
        "</text></svg>"
    )
  // Per-slot search inputs are local to each Select to avoid parent re-renders
  // remounting the Input in the SelectContent and causing focus loss.

  const { selectedSkills, setSelectedSkills, selectedSlot, setSelectedSlot } = useMhwStore()

  // build global list of slot options from rarity data
  const slotOptions = React.useMemo(() => {
    const setKeys = new Set()
    Object.values(rarityBaseProbability).forEach((r) => {
      const slotObj = r && r.slot ? r.slot : {}
      Object.keys(slotObj).forEach((k) => setKeys.add(k))
    })
    // custom sort:
    // - parse each key as JSON array when possible (e.g. "[1, 1]")
    // - compare segment-by-segment: numbers compare numerically, numbers come before strings
    // - strings that start with "W" are ordered after numeric/string slots
    // - if all segments equal, shorter array (parent) comes before longer (child)
    const parseKey = (k) => {
      try {
        const parsed = JSON.parse(k)
        if (Array.isArray(parsed)) return parsed
      } catch {
        /* ignore */
      }
      // fallback: strip brackets and split by comma
      const s = String(k).replace(/^\[|\]$/g, "")
      if (s.trim() === "") return []
      return s.split(/\s*,\s*/).map((p) => {
        // try convert to number
        const n = Number(p)
        if (!isNaN(n) && p !== "") return n
        // keep as string
        return p
      })
    }

    const typeOrder = (v) => {
      if (typeof v === "number") return 1
      if (typeof v === "string" && v.startsWith("W")) return 3
      return 2 // other strings
    }

    const cmp = (a, b) => {
      const pa = parseKey(a)
      const pb = parseKey(b)
      const len = Math.min(pa.length, pb.length)
      for (let i = 0; i < len; i++) {
        const va = pa[i]
        const vb = pb[i]
        if (va === vb) continue

        const ta = typeOrder(va)
        const tb = typeOrder(vb)
        if (ta !== tb) return ta - tb

        // same type
        if (typeof va === "number" && typeof vb === "number") return va - vb

        // both strings (non-W or both W)
        const sa = String(va).toLowerCase()
        const sb = String(vb).toLowerCase()
        if (sa < sb) return -1
        if (sa > sb) return 1
        return 0
      }

      // all compared segments equal -> shorter (parent) first
      if (pa.length !== pb.length) return pa.length - pb.length

      // final fallback: string compare of original key
      const sa = String(a).toLowerCase()
      const sb = String(b).toLowerCase()
      if (sa < sb) return -1
      if (sa > sb) return 1
      return 0
    }

    return Array.from(setKeys).sort(cmp)
  }, [])

  // 建立技能(含等級)到群組號的映射（只需在此組件內部）
  const skillToGroupMap = useMemo(() => {
    const map = {}
    Object.keys(SkillGroupsData.SkillGroups).forEach((groupKey) => {
      const groupNumber = parseInt(groupKey.replace("Group", ""))
      SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
        const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
        if (!map[skillKey]) map[skillKey] = []
        map[skillKey].push(groupNumber)
      })
    })
    return map
  }, [])

  // 獲取所有技能（過濾重複）
  const getAllUniqueSkills = useMemo(() => {
    const allSkills = new Set()
    Object.keys(SkillGroupsData.SkillGroups).forEach((groupKey) => {
      SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
        allSkills.add(`${skill.SkillName} Lv.${skill.SkillLevel}`)
      })
    })
    return Array.from(allSkills).sort()
  }, [])

  // helper: normalize slot/key string to a stable JSON string when possible
  const normalizeSlotKey = useCallback((k) => {
    if (!k && k !== 0) return String(k)
    try {
      const parsed = JSON.parse(k)
      return JSON.stringify(parsed)
    } catch {
      // fallback: collapse whitespace
      return String(k).replace(/\s+/g, "")
    }
  }, [])

  // build a virtual amulet list with parsed slotKey to reuse in both skills and slots filtering
  const virtualAmulets = useMemo(() => {
    const arr = []
    Object.entries(rarityBaseProbability).forEach(([rarity, data]) => {
      const groups = data.Group || []
      const slots = data.slot || {}
      // Each group entry corresponds to a possible amulet combination; use groups.skills for skill groups
      groups.forEach((gObj) => {
        // Find slot keys for this rarity - the original code treats each Group entry as an amulet
        // We'll iterate slot keys for that rarity and pair them with groups entries to form virtual amulets.
        Object.keys(slots).forEach((slotKey) => {
          const skills = gObj.skills || []
          arr.push({
            Rarity: rarity,
            slotKeyOriginal: slotKey,
            slotKeyNormalized: normalizeSlotKey(slotKey),
            Skill1Group: skills[0] || null,
            Skill2Group: skills[1] || null,
            Skill3Group: skills[2] || null,
          })
        })
      })
    })
    return arr
  }, [normalizeSlotKey])

  // compute slot options filtered by currently selected skills
  const filteredSlotOptions = useMemo(() => {
    // if no skills chosen at all, return all slotOptions
    const anySkillChosen = selectedSkills.some((s) => s && s !== "")
    if (!anySkillChosen) return slotOptions

    const validSet = new Set()

    const canAssignSelectedToAmulet = (amulet) => {
      // build amulet groups array (in order)
      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)
      const used = []
      for (let i = 0; i < 3; i++) {
        const sel = selectedSkills[i]
        if (!sel) continue
        const groups = skillToGroupMap[sel] || []
        let assigned = false
        for (let j = 0; j < amuletGroups.length; j++) {
          if (used.includes(j)) continue
          if (groups.includes(amuletGroups[j])) {
            used.push(j)
            assigned = true
            break
          }
        }
        if (!assigned) return false
      }
      return true
    }

    virtualAmulets.forEach((amulet) => {
      if (canAssignSelectedToAmulet(amulet)) validSet.add(amulet.slotKeyOriginal)
    })

    // preserve original order from slotOptions
    return slotOptions.filter((k) => validSet.has(k))
  }, [selectedSkills, skillToGroupMap, slotOptions, virtualAmulets])

  // when filteredSlotOptions changes, ensure selectedSlot is still valid
  // (moved below getAvailableSkills to avoid referencing it before initialization)

  const getAvailableSkills = useCallback(
    (slotIndex) => {
      if (slotIndex === 0) {
        // 第一個 select：列出所有技能（過濾重複）
        return getAllUniqueSkills
      }

      if (slotIndex === 1) {
        // 第二個 select：根據第一個技能找出可能的護石組合中的其他技能
        if (!selectedSkills[0]) return []

        const firstSkillGroups = skillToGroupMap[selectedSkills[0]] || []
        const firstSkillBaseName = selectedSkills[0].split(" Lv.")[0]
        const possibleSkills = new Set()

        // reuse virtualAmulets but filter by selectedSlot if present
        const matchingAmulets = virtualAmulets.filter((a) => {
          if (!selectedSlot) return true
          return normalizeSlotKey(selectedSlot) === a.slotKeyNormalized
        })

        matchingAmulets.forEach((amulet) => {
          const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)
          const hasFirstSkillGroup = firstSkillGroups.some((group) => amuletGroups.includes(group))
          if (hasFirstSkillGroup) {
            let assignedSlotIndex = -1
            for (let i = 0; i < amuletGroups.length; i++) {
              if (firstSkillGroups.includes(amuletGroups[i])) {
                assignedSlotIndex = i
                break
              }
            }
            amuletGroups.forEach((groupNumber, slotIndex) => {
              if (slotIndex !== assignedSlotIndex) {
                const groupKey = `Group${groupNumber}`
                if (SkillGroupsData.SkillGroups[groupKey]) {
                  SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
                    const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
                    const skillBaseName = skill.SkillName
                    if (skillBaseName !== firstSkillBaseName) {
                      possibleSkills.add(skillKey)
                    }
                  })
                }
              }
            })
          }
        })

        return Array.from(possibleSkills).sort()
      }

      if (slotIndex === 2) {
        // 第三個 select：同時考慮第一和第二個技能
        if (!selectedSkills[0]) return []

        const firstSkillGroups = skillToGroupMap[selectedSkills[0]] || []
        const secondSkillGroups = selectedSkills[1] ? skillToGroupMap[selectedSkills[1]] || [] : []
        const firstSkillBaseName = selectedSkills[0].split(" Lv.")[0]
        const secondSkillBaseName = selectedSkills[1] ? selectedSkills[1].split(" Lv.")[0] : null
        const possibleSkills = new Set()

        // reuse virtualAmulets but filter by selectedSlot if present
        const matchingAmulets2 = virtualAmulets.filter((a) => {
          if (!selectedSlot) return true
          return normalizeSlotKey(selectedSlot) === a.slotKeyNormalized
        })

        matchingAmulets2.forEach((amulet) => {
          const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)

          const usedSlotIndexes = []
          let firstAssigned = false
          for (let i = 0; i < amuletGroups.length; i++) {
            if (!usedSlotIndexes.includes(i) && firstSkillGroups.includes(amuletGroups[i])) {
              usedSlotIndexes.push(i)
              firstAssigned = true
              break
            }
          }
          if (!firstAssigned) return

          if (selectedSkills[1]) {
            let secondAssigned = false
            for (let i = 0; i < amuletGroups.length; i++) {
              if (!usedSlotIndexes.includes(i) && secondSkillGroups.includes(amuletGroups[i])) {
                usedSlotIndexes.push(i)
                secondAssigned = true
                break
              }
            }
            if (!secondAssigned) return
          }

          amuletGroups.forEach((groupNumber, slotIndex) => {
            if (!usedSlotIndexes.includes(slotIndex)) {
              const groupKey = `Group${groupNumber}`
              if (SkillGroupsData.SkillGroups[groupKey]) {
                SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
                  const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
                  const skillBaseName = skill.SkillName
                  if (skillBaseName !== firstSkillBaseName && skillBaseName !== secondSkillBaseName) {
                    possibleSkills.add(skillKey)
                  }
                })
              }
            }
          })
        })

        return Array.from(possibleSkills).sort()
      }

      return []
    },
    [selectedSkills, skillToGroupMap, getAllUniqueSkills, virtualAmulets, selectedSlot, normalizeSlotKey]
  )

  const getSkillGroupInfo = (skillKey) => {
    const groups = skillToGroupMap[skillKey]
    return groups ? groups.join(", ") : "Unknown"
  }

  const selected0 = selectedSkills[0]
  const selected1 = selectedSkills[1]

  // Ensure downstream selected skills remain valid when earlier selections change.
  useEffect(() => {
    // Validate slots 1 and 2 (indexes 1 and 2)
    {
      const copy = [...selectedSkills]
      let changed = false

      for (let i = 1; i < 3; i++) {
        if (copy[i]) {
          const available = getAvailableSkills(i)
          if (!available.includes(copy[i])) {
            // clear this and any subsequent selections
            for (let j = i; j < 3; j++) {
              if (copy[j] !== "") {
                copy[j] = ""
                changed = true
              }
            }
            break
          }
        }
      }

      if (changed) setSelectedSkills(copy)
    }
  }, [getAvailableSkills, setSelectedSkills, selected0, selected1, selectedSkills])

  return (
    <section className='w-full p-10 mb-8 bg-white rounded-xl'>
      <h2 className='mb-4 text-xl font-semibold'>
        {t("skillSelector.title")} {t("skillSelector.maxSkills")}
      </h2>

      <div className='grid grid-cols-1 gap-4 mb-4 xl:grid-cols-3'>
        {[0, 1, 2].map((i) => {
          const available = getAvailableSkills(i).length > 0
          const shouldShow = i === 0 ? available : selectedSkills[i - 1] && available
          if (!shouldShow) return null

          const SkillSelectSlot = () => {
            const [localSearch, setLocalSearch] = React.useState("")

            const selectedValue = selectedSkills[i]
            let selectedDisplay = ""
            if (selectedValue) {
              const selName = selectedValue.split(" Lv.")[0]
              const selLevel = selectedValue.split(" Lv.")[1] || ""
              const translatedSel = t(`skillTranslations.${selName}`, selName)
              const groupInfo = getSkillGroupInfo(selectedValue)
              // show fullwidth parentheses for zh and jaJP locales
              const useFullwidthParens = i18n.language && (i18n.language.startsWith("zh") || i18n.language === "jaJP")
              const groupText = useFullwidthParens ? `（${groupInfo}）` : ` (${groupInfo})`

              // Render a small icon (if available) plus the name
              const imgSrc = `${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(selName.replace(/\//g, "-"))}.png`
              const nameNode = useFullwidthParens ? `${translatedSel} ${t("common.level")}${selLevel}` : selectedValue

              selectedDisplay = (
                <div className='flex items-center gap-2'>
                  <img
                    src={imgSrc}
                    alt={selName}
                    className='object-contain w-5 h-5 md:w-7 md:h-7'
                    onError={(e) => {
                      try {
                        if (!e || !e.currentTarget) return
                        const el = e.currentTarget
                        // avoid replacing if already placeholder
                        if (el.src && el.src.indexOf("data:image/svg+xml") === -1) {
                          el.src = SKILL_PLACEHOLDER_SVG
                        }
                      } catch {
                        /* swallow */
                      }
                    }}
                  />
                  <span>{nameNode}</span>
                  <span style={{ color: "#888", fontSize: "0.8em", marginLeft: "0.5em" }}>{groupText}</span>
                </div>
              )
            }

            return (
              <div className='flex flex-col' key={i}>
                <label className='mb-2 text-sm font-medium'>{t(`skillSelector.skill${i + 1}`)}</label>
                <div className='flex items-center gap-2'>
                  <Select
                    value={selectedSkills[i] ?? ""}
                    onValueChange={(value) => {
                      const copy = [...selectedSkills]
                      const isClear = value === "__clear__" || value === ""
                      copy[i] = isClear ? "" : value
                      if (isClear) {
                        for (let j = i + 1; j < 3; j++) copy[j] = ""
                      }
                      setSelectedSkills(copy)
                      // clear local search when selection changes
                      setLocalSearch("")
                    }}>
                    <SelectTrigger className='w-full h-10 px-3 text-base md:h-14 md:px-4 md:text-lg'>
                      {/* keep an empty SelectValue so Radix can show the placeholder when no value is selected */}
                      <SelectValue placeholder={t("skillSelector.selectSkill")} />
                      {/* render the richer selectedDisplay directly in the trigger so the icon + group text appear immediately after first selection */}
                      {selectedDisplay ? <div className='flex items-center justify-start w-full'>{selectedDisplay}</div> : null}
                    </SelectTrigger>
                    <SelectContent side='bottom' position='popper'>
                      {/* search input with inline clear icon */}
                      <div className='flex items-center gap-2 mb-2'>
                        <Input
                          ref={React.createRef()}
                          type='text'
                          value={localSearch}
                          onChange={(e) => setLocalSearch(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={t("skillSelector.searchSkill")}
                          className='flex-1'
                        />
                        <button
                          type='button'
                          aria-label={t("skillSelector.clearSelection", "Clear selection")}
                          className='p-1 text-sm rounded hover:bg-gray-100'
                          onMouseDown={(e) => e.preventDefault()} /* prevent blur */
                          onClick={(e) => {
                            e.stopPropagation()
                            const copy = [...selectedSkills]
                            copy[i] = ""
                            for (let j = i + 1; j < 3; j++) copy[j] = ""
                            setSelectedSkills(copy)
                            setLocalSearch("")
                          }}>
                          ×
                        </button>
                      </div>

                      {/* Custom-rendered search results to avoid interaction conflicts with Radix SelectItem */}
                      <div className='flex flex-col gap-1 p-1 overflow-auto max-h-48 md:max-h-96'>
                        {getAvailableSkills(i)
                          .filter((skillKey) => {
                            const skillName = skillKey.split(" Lv.")[0]
                            const translatedName = t(`skillTranslations.${skillName}`, skillName)
                            return (
                              skillKey.toLowerCase().includes(localSearch.toLowerCase()) ||
                              translatedName.toLowerCase().includes(localSearch.toLowerCase())
                            )
                          })
                          .map((skillKey) => {
                            const skillName = skillKey.split(" Lv.")[0]
                            const skillLevel = skillKey.split(" Lv.")[1]
                            const translatedName = t(`skillTranslations.${skillName}`, skillName)
                            const useFullwidth = i18n.language && (i18n.language.startsWith("zh") || i18n.language === "jaJP")
                            const displayName = useFullwidth ? `${translatedName} ${t("common.level")}${skillLevel}` : skillKey
                            const groupInfo = getSkillGroupInfo(skillKey)
                            return (
                              <button
                                key={`custom-${skillKey}`}
                                type='button'
                                className='px-2 py-1 text-left rounded hover:bg-gray-100'
                                onPointerDown={(e) => e.preventDefault()} /* prevent blur */
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const copy = [...selectedSkills]
                                  copy[i] = skillKey
                                  for (let j = i + 1; j < 3; j++) copy[j] = ""
                                  setSelectedSkills(copy)
                                  setLocalSearch("")
                                  // blur active element to close keyboard/focus (safe check)
                                  if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
                                    document.activeElement.blur()
                                  }
                                }}>
                                <div className='flex items-center gap-2'>
                                  <img
                                    src={`${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skillName.replace(/\//g, "-"))}.png`}
                                    alt={skillName}
                                    className='object-contain w-5 h-5 mr-2 md:w-6 md:h-6'
                                    onError={(e) => {
                                      try {
                                        if (!e || !e.currentTarget) return
                                        const el = e.currentTarget
                                        if (el.src && el.src.indexOf("data:image/svg+xml") === -1) {
                                          el.src = SKILL_PLACEHOLDER_SVG
                                        }
                                      } catch {
                                        /* swallow */
                                      }
                                    }}
                                  />
                                  <div>
                                    {displayName}
                                    <span style={{ color: "#888", fontSize: "0.8em", marginLeft: "0.5em" }}>（{groupInfo}）</span>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    </SelectContent>
                  </Select>

                  {/* clear button placed to the right of each Select */}
                  <button
                    type='button'
                    aria-label={t("skillSelector.clearSelection", "Clear selection")}
                    className='h-10 px-4 py-2 text-base rounded md:h-14 md:px-5 md:py-3 md:text-lg bg-gray-50 hover:bg-gray-100'
                    onMouseDown={(e) => e.preventDefault()} /* prevent focus loss */
                    onClick={(e) => {
                      e.stopPropagation()
                      const copy = [...selectedSkills]
                      copy[i] = ""
                      for (let j = i + 1; j < 3; j++) copy[j] = ""
                      setSelectedSkills(copy)
                      setLocalSearch("")
                    }}>
                    ×
                  </button>
                </div>
                {/* group info now shown inline in the SelectValue */}
              </div>
            )
          }

          return <SkillSelectSlot key={`${i}-${selectedSkills[i]}`} />
        })}
      </div>

      {/* Slot selector row placed below skills, single full-width row */}
      <div className='mt-2 mb-6'>
        <label className='block mb-2 text-sm font-medium'>{t("skillSelector.slotFilter")}</label>
        <div className='flex items-center gap-2'>
          {/* Use sentinel '__any__' because Radix SelectItem requires non-empty value */}
          {(() => {
            const selectValueProp = selectedSlot && selectedSlot !== "" ? selectedSlot : "__any__"
            return (
              <Select
                value={selectValueProp}
                onValueChange={(value) => {
                  const v = value === "__any__" ? "" : value
                  setSelectedSlot(v)
                }}>
                <SelectTrigger className='w-56 h-10 px-3 text-base md:w-72 md:h-14 md:px-4 md:text-lg'>
                  {selectedSlot ? (
                    (() => {
                      let slotImgSrcs = []
                      let slotAlt = selectedSlot
                      try {
                        const arr = JSON.parse(selectedSlot)
                        if (Array.isArray(arr)) {
                          arr.forEach((v) => {
                            if (typeof v === "string" && v.startsWith("W")) {
                              slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                            } else if (typeof v === "number") {
                              const idx = Math.min(Math.max(1, v), 3)
                              slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${idx}.png`)
                            }
                          })
                        }
                      } catch {
                        if (typeof selectedSlot === "string" && selectedSlot.indexOf("W") !== -1) {
                          slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                        } else if (!isNaN(Number(selectedSlot))) {
                          const idx = Math.min(Math.max(1, Number(selectedSlot)), 3)
                          slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${idx}.png`)
                        }
                      }

                      return (
                        <div className='flex items-center justify-start w-full gap-2'>
                          {slotImgSrcs.length ? (
                            slotImgSrcs.map((s, idx) => (
                              <img
                                key={s + idx}
                                src={s}
                                alt={slotAlt}
                                className='object-contain w-7 h-7 md:w-9 md:h-9'
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            ))
                          ) : (
                            <span>{selectedSlot}</span>
                          )}
                        </div>
                      )
                    })()
                  ) : (
                    /* show placeholder when no slot is selected */
                    <SelectValue placeholder={t("skillSelector.slotAny")} />
                  )}
                </SelectTrigger>
                <SelectContent side='bottom' position='popper'>
                  <SelectItem value='__any__'>{t("skillSelector.slotAny")}</SelectItem>
                  {filteredSlotOptions.map((k) => {
                    // determine display text and image(s) for each slot option
                    let display = k
                    const slotImgSrcs = []
                    try {
                      const arr = JSON.parse(k)
                      if (Array.isArray(arr)) display = `[${arr.join(", ")}]`
                      if (Array.isArray(arr)) {
                        arr.forEach((v) => {
                          if (typeof v === "string" && v.startsWith("W")) {
                            slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                          } else if (typeof v === "number") {
                            const idx = Math.min(Math.max(1, v), 3)
                            slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${idx}.png`)
                          }
                        })
                      }
                    } catch {
                      if (typeof k === "string" && k.indexOf("W") !== -1) {
                        slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                      } else if (!isNaN(Number(k))) {
                        const idx = Math.min(Math.max(1, Number(k)), 3)
                        slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${idx}.png`)
                      }
                    }

                    return (
                      <SelectItem key={k} value={k}>
                        <div className='flex items-center gap-2'>
                          {slotImgSrcs.length ? (
                            <div className='flex items-center gap-1'>
                              {slotImgSrcs.map((s, idx) => (
                                <img
                                  key={s + idx}
                                  src={s}
                                  alt={k}
                                  className='object-contain w-6 h-6 md:w-8 md:h-8'
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              ))}
                            </div>
                          ) : null}
                          <span>{display}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )
          })()}
          <button
            type='button'
            aria-label={t("skillSelector.clearSlot", "Clear slot")}
            className='h-10 px-4 py-2 text-base rounded md:h-14 md:px-5 md:py-3 md:text-lg bg-gray-50 hover:bg-gray-100'
            onMouseDown={(e) => e.preventDefault()} /* prevent focus loss */
            onClick={(e) => {
              e.stopPropagation()
              setSelectedSlot("")
            }}>
            ×
          </button>
        </div>
      </div>
      <div className='flex justify-end'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setSelectedSkills(["", "", ""])
            // local searches are per-slot; resetting selectedSkills will remount slots
            // which clears their internal localSearch state.
          }}>
          {t("skillSelector.reset", "Reset")}
        </Button>
      </div>
    </section>
  )
}
