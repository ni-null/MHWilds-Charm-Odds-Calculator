import React from "react"
import { useTranslation } from "react-i18next"

export default function SkillSelector({ selectedSkills, onSkillChange, getAvailableSkills, getSkillGroupInfo }) {
  const { t, i18n } = useTranslation()

  return (
    <section className='w-full p-10 mb-8 bg-white rounded-xl'>
      <h2 className='mb-4 text-xl font-semibold'>
        {t("skillSelector.title")} {t("skillSelector.maxSkills")}
      </h2>
      <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
        {[0, 1, 2].map((slotIndex) => (
          <div key={slotIndex} className='flex flex-col'>
            <label className='mb-2 text-sm font-medium'>{t(`skillSelector.skill${slotIndex + 1}`)}</label>
            <select
              value={selectedSkills[slotIndex] || ""}
              onChange={(e) => onSkillChange(slotIndex, e.target.value)}
              className='p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={slotIndex > 0 && !selectedSkills[slotIndex - 1]}>
              <option value=''>{t("skillSelector.selectSkill")}</option>
              {getAvailableSkills(slotIndex).map((skillKey) => {
                // 解析技能名稱
                const skillName = skillKey.split(" Lv.")[0]
                const skillLevel = skillKey.split(" Lv.")[1]
                const translatedName = t(`skillTranslations.${skillName}`, skillName)
                const displayName = i18n.language === "zhTW" ? `${translatedName} ${t("common.level")}${skillLevel}` : skillKey
                return (
                  <option key={skillKey} value={skillKey}>
                    {displayName}
                  </option>
                )
              })}
            </select>
            {selectedSkills[slotIndex] && (
              <p className='mt-1 text-xs text-gray-600'>
                {t("skillSelector.groupInfo")}: {getSkillGroupInfo(selectedSkills[slotIndex])}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
