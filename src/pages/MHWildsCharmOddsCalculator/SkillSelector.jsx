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

  const getSkillsByGroup = (groupField) => {
    const groupNumbers = Array.from(new Set(AmuletData.map((a) => a[groupField]).filter((g) => g !== null)))
    const skills = []
    groupNumbers.forEach((groupNumber) => {
      const groupKey = `Group${groupNumber}`
      if (SkillGroupsData.SkillGroups[groupKey]) {
        SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
          skills.push(`${skill.SkillName} Lv.${skill.SkillLevel}`)
        })
      }
    })
    return Array.from(new Set(skills)).sort()
  }

  const getAvailableSkills = useCallback(
    (slotIndex) => {
      if (slotIndex === 0) return getSkillsByGroup("Skill1Group")

      if (slotIndex === 1) {
        if (!selectedSkills[0]) return []
        const firstSkillGroups = skillToGroupMap[selectedSkills[0]] || []
        const amulets = AmuletData.filter((a) => firstSkillGroups.includes(a.Skill1Group))
        const groupNumbers = Array.from(new Set(amulets.map((a) => a.Skill2Group).filter((g) => g !== null)))
        const skills = []
        groupNumbers.forEach((groupNumber) => {
          const groupKey = `Group${groupNumber}`
          if (SkillGroupsData.SkillGroups[groupKey]) {
            SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => skills.push(`${skill.SkillName} Lv.${skill.SkillLevel}`))
          }
        })
        return Array.from(new Set(skills))
          .filter((skill) => {
            const skillBaseName = skill.split(" Lv.")[0]
            if (selectedSkills[0]) {
              const skill1BaseName = selectedSkills[0].split(" Lv.")[0]
              return skillBaseName !== skill1BaseName
            }
            return true
          })
          .sort()
      }

      if (slotIndex === 2) {
        if (!selectedSkills[0]) return []
        let amulets = []
        const firstSkillGroups = skillToGroupMap[selectedSkills[0]] || []
        if (selectedSkills[1]) {
          const secondSkillGroups = skillToGroupMap[selectedSkills[1]] || []
          amulets = AmuletData.filter((a) => firstSkillGroups.includes(a.Skill1Group) && secondSkillGroups.includes(a.Skill2Group))
        } else {
          amulets = AmuletData.filter((a) => firstSkillGroups.includes(a.Skill1Group))
        }

        const groupNumbers = Array.from(new Set(amulets.map((a) => a.Skill3Group).filter((g) => g !== null)))
        const skills = []
        groupNumbers.forEach((groupNumber) => {
          const groupKey = `Group${groupNumber}`
          if (SkillGroupsData.SkillGroups[groupKey]) {
            SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => skills.push(`${skill.SkillName} Lv.${skill.SkillLevel}`))
          }
        })
        return Array.from(new Set(skills))
          .filter((skill) => {
            const skillBaseName = skill.split(" Lv.")[0]
            if (selectedSkills[0]) {
              const skill1BaseName = selectedSkills[0].split(" Lv.")[0]
              if (skillBaseName === skill1BaseName) return false
            }
            if (selectedSkills[1]) {
              const skill2BaseName = selectedSkills[1].split(" Lv.")[0]
              if (skillBaseName === skill2BaseName) return false
            }
            return true
          })
          .sort()
      }

      return []
    },
    [selectedSkills, skillToGroupMap]
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

      <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
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
              const groupText = i18n.language === "zhTW" ? `（${groupInfo}）` : ` (${groupInfo})`
              selectedDisplay =
                i18n.language === "zhTW" ? `${translatedSel} ${t("common.level")}${selLevel}${groupText}` : `${selectedValue}${groupText}`
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
                    <SelectTrigger className='w-full'>
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
                            const displayName = i18n.language === "zhTW" ? `${translatedName} ${t("common.level")}${skillLevel}` : skillKey
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
                                <div>
                                  {displayName}
                                  <span style={{ color: "#888", fontSize: "0.8em", marginLeft: "0.5em" }}>（{groupInfo}）</span>
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
                    className='px-3 py-2 rounded bg-gray-50 hover:bg-gray-100'
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
