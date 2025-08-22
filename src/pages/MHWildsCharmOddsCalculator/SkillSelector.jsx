import React from "react"
import { useTranslation } from "react-i18next"

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SkillSelector({ selectedSkills, onSkillChange, getAvailableSkills, getSkillGroupInfo }) {
  const { t, i18n } = useTranslation()
  const [search1, setSearch1] = React.useState("")
  const [search2, setSearch2] = React.useState("")
  const [search3, setSearch3] = React.useState("")

  return (
    <section className='w-full p-10 mb-8 bg-white rounded-xl'>
      <h2 className='mb-4 text-xl font-semibold'>
        {t("skillSelector.title")} {t("skillSelector.maxSkills")}
      </h2>

      <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
        {/* 技能1 */}
        {getAvailableSkills(0).length > 0 && (
          <div className='flex flex-col'>
            <label className='mb-2 text-sm font-medium'>{t("skillSelector.skill1")}</label>
            <Select
              value={selectedSkills[0] || undefined}
              onValueChange={(value) => {
                onSkillChange(0, value)
                setSearch1("")
              }}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={t("skillSelector.selectSkill")} />
              </SelectTrigger>
              <SelectContent>
                <input
                  type='text'
                  value={search1}
                  onChange={(e) => setSearch1(e.target.value)}
                  placeholder={t("skillSelector.searchSkill")}
                  className='w-full px-2 py-1 mb-2 text-sm border rounded'
                />
                {getAvailableSkills(0)
                  .filter((skillKey) => {
                    const skillName = skillKey.split(" Lv.")[0]
                    const translatedName = t(`skillTranslations.${skillName}`, skillName)
                    return skillKey.toLowerCase().includes(search1.toLowerCase()) || translatedName.toLowerCase().includes(search1.toLowerCase())
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
            {selectedSkills[0] && (
              <p className='mt-1 text-xs text-gray-600'>
                {t("skillSelector.groupInfo")}: {getSkillGroupInfo(selectedSkills[0])}
              </p>
            )}
          </div>
        )}
        {/* 技能2 */}
        {selectedSkills[0] && getAvailableSkills(1).length > 0 && (
          <div className='flex flex-col'>
            <label className='mb-2 text-sm font-medium'>{t("skillSelector.skill2")}</label>
            <Select
              value={selectedSkills[1] || undefined}
              onValueChange={(value) => {
                onSkillChange(1, value)
                setSearch2("")
              }}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={t("skillSelector.selectSkill")} />
              </SelectTrigger>
              <SelectContent>
                <input
                  type='text'
                  value={search2}
                  onChange={(e) => setSearch2(e.target.value)}
                  placeholder={t("skillSelector.searchSkill")}
                  className='w-full px-2 py-1 mb-2 text-sm border rounded'
                />
                {getAvailableSkills(1)
                  .filter((skillKey) => {
                    const skillName = skillKey.split(" Lv.")[0]
                    const translatedName = t(`skillTranslations.${skillName}`, skillName)
                    return skillKey.toLowerCase().includes(search2.toLowerCase()) || translatedName.toLowerCase().includes(search2.toLowerCase())
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
            {selectedSkills[1] && (
              <p className='mt-1 text-xs text-gray-600'>
                {t("skillSelector.groupInfo")}: {getSkillGroupInfo(selectedSkills[1])}
              </p>
            )}
          </div>
        )}
        {/* 技能3 */}
        {selectedSkills[1] && getAvailableSkills(2).length > 0 && (
          <div className='flex flex-col'>
            <label className='mb-2 text-sm font-medium'>{t("skillSelector.skill3")}</label>
            <Select
              value={selectedSkills[2] || undefined}
              onValueChange={(value) => {
                onSkillChange(2, value)
                setSearch3("")
              }}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={t("skillSelector.selectSkill")} />
              </SelectTrigger>
              <SelectContent>
                <input
                  type='text'
                  value={search3}
                  onChange={(e) => setSearch3(e.target.value)}
                  placeholder={t("skillSelector.searchSkill")}
                  className='w-full px-2 py-1 mb-2 text-sm border rounded'
                />
                {getAvailableSkills(2)
                  .filter((skillKey) => {
                    const skillName = skillKey.split(" Lv.")[0]
                    const translatedName = t(`skillTranslations.${skillName}`, skillName)
                    return skillKey.toLowerCase().includes(search3.toLowerCase()) || translatedName.toLowerCase().includes(search3.toLowerCase())
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
            {selectedSkills[2] && (
              <p className='mt-1 text-xs text-gray-600'>
                {t("skillSelector.groupInfo")}: {getSkillGroupInfo(selectedSkills[2])}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
