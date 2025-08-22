import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import useMhwStore from "../../store/mhwStore"
import AmuletData from "../../data/Amulet.json"
import SkillGroupsData from "../../data/SkillGroups.json"

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function SkillSelector() {
  const { t, i18n } = useTranslation()
  const [searches, setSearches] = React.useState(["", "", ""])
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

  const getAvailableSkills = (slotIndex) => {
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
  }

  const getSkillGroupInfo = (skillKey) => {
    const groups = skillToGroupMap[skillKey]
    return groups ? groups.join(", ") : "Unknown"
  }

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

          return (
            <div className='flex flex-col' key={i}>
              <label className='mb-2 text-sm font-medium'>{t(`skillSelector.skill${i + 1}`)}</label>
              <Select
                value={selectedSkills[i] ?? ""}
                onValueChange={(value) => {
                  // update store
                  const copy = [...selectedSkills]
                  const isClear = value === "__clear__" || value === ""
                  // Set cleared value to empty string so Select shows placeholder (library expects "" to clear)
                  copy[i] = isClear ? "" : value
                  // clear subsequent slots if cleared
                  if (isClear) {
                    for (let j = i + 1; j < 3; j++) copy[j] = ""
                  }
                  setSelectedSkills(copy)
                  setSearches((prev) => {
                    const copy = [...prev]
                    copy[i] = ""
                    return copy
                  })
                }}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t("skillSelector.selectSkill")} />
                </SelectTrigger>
                <SelectContent>
                  <Input
                    type='text'
                    value={searches[i]}
                    onChange={(e) =>
                      setSearches((prev) => {
                        const copy = [...prev]
                        copy[i] = e.target.value
                        return copy
                      })
                    }
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder={t("skillSelector.searchSkill")}
                    className='w-full mb-2'
                  />
                  {/* Default option to clear the selection */}
                  <SelectItem key={`clear-${i}`} value='__clear__'>
                    {t("skillSelector.clearSelection", "Clear selection")}
                  </SelectItem>
                  {getAvailableSkills(i)
                    .filter((skillKey) => {
                      const skillName = skillKey.split(" Lv.")[0]
                      const translatedName = t(`skillTranslations.${skillName}`, skillName)
                      return (
                        skillKey.toLowerCase().includes(searches[i].toLowerCase()) || translatedName.toLowerCase().includes(searches[i].toLowerCase())
                      )
                    })
                    .map((skillKey) => {
                      const skillName = skillKey.split(" Lv.")[0]
                      const skillLevel = skillKey.split(" Lv.")[1]
                      const translatedName = t(`skillTranslations.${skillName}`, skillName)
                      const displayName = i18n.language === "zhTW" ? `${translatedName} ${t("common.level")}${skillLevel}` : skillKey
                      const groupInfo = getSkillGroupInfo(skillKey)
                      return (
                        <SelectItem key={skillKey} value={skillKey}>
                          {displayName}
                          <span style={{ color: "#888", fontSize: "0.8em", marginLeft: "0.5em" }}>（{groupInfo}）</span>
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
              {selectedSkills[i] && (
                <p className='mt-1 text-xs text-gray-600'>
                  {t("skillSelector.groupInfo")}: {getSkillGroupInfo(selectedSkills[i])}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
