import React, { useMemo, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import useMhwStore from "../../store/mhwStore"
import AmuletData from "../../data/Amulet.json"
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
  const { selectedSkills, setSelectedSkills } = useMhwStore()

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

        // 找出包含第一個技能組別的所有護石
        AmuletData.forEach((amulet) => {
          const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)

          // 檢查護石是否包含第一個技能的組別
          const hasFirstSkillGroup = firstSkillGroups.some((group) => amuletGroups.includes(group))

          if (hasFirstSkillGroup) {
            // 為第一個技能分配一個槽位
            let assignedSlotIndex = -1
            for (let i = 0; i < amuletGroups.length; i++) {
              if (firstSkillGroups.includes(amuletGroups[i])) {
                assignedSlotIndex = i
                break
              }
            }

            // 收集剩餘槽位的技能
            amuletGroups.forEach((groupNumber, slotIndex) => {
              if (slotIndex !== assignedSlotIndex) {
                const groupKey = `Group${groupNumber}`
                if (SkillGroupsData.SkillGroups[groupKey]) {
                  SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
                    const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
                    const skillBaseName = skill.SkillName

                    // 排除與第一個技能相同基礎名稱的技能
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

        // 找出同時包含第一個技能和（可選）第二個技能組別的護石
        AmuletData.forEach((amulet) => {
          const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)

          // 嘗試為已選技能分配槽位
          const usedSlotIndexes = []

          // 為第一個技能分配槽位
          let firstAssigned = false
          for (let i = 0; i < amuletGroups.length; i++) {
            if (!usedSlotIndexes.includes(i) && firstSkillGroups.includes(amuletGroups[i])) {
              usedSlotIndexes.push(i)
              firstAssigned = true
              break
            }
          }

          if (!firstAssigned) return // 無法分配第一個技能，跳過此護石

          // 如果有第二個技能，嘗試分配槽位
          if (selectedSkills[1]) {
            let secondAssigned = false
            for (let i = 0; i < amuletGroups.length; i++) {
              if (!usedSlotIndexes.includes(i) && secondSkillGroups.includes(amuletGroups[i])) {
                usedSlotIndexes.push(i)
                secondAssigned = true
                break
              }
            }
            if (!secondAssigned) return // 無法分配第二個技能，跳過此護石
          }

          // 收集剩餘槽位的技能
          amuletGroups.forEach((groupNumber, slotIndex) => {
            if (!usedSlotIndexes.includes(slotIndex)) {
              const groupKey = `Group${groupNumber}`
              if (SkillGroupsData.SkillGroups[groupKey]) {
                SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
                  const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
                  const skillBaseName = skill.SkillName

                  // 排除與已選技能相同基礎名稱的技能
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
    [selectedSkills, skillToGroupMap, getAllUniqueSkills]
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

      <div className='grid grid-cols-1 gap-4 mb-6 xl:grid-cols-3'>
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
                    style={{ width: 28, height: 28, objectFit: "contain" }}
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
                    <SelectTrigger className='w-full px-4 text-lg h-14'>
                      <SelectValue placeholder={t("skillSelector.selectSkill")}>{selectedDisplay || undefined}</SelectValue>
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
                                    style={{ width: 24, height: 24, objectFit: "contain", marginRight: 8 }}
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
                    className='px-4 py-3 text-lg rounded h-14 bg-gray-50 hover:bg-gray-100'
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
