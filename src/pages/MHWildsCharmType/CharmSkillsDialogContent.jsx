import React from "react"
import skillGroupsData from "../../data/SkillGroups.json"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CharmSkillsDialogContent = ({ charm, getSkillTranslation, getGroupTranslation, t }) => {
  // inline placeholder SVG used when skill icon fails to load
  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
        "<rect fill='%23efefef' width='100%' height='100%'/>" +
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23999'>?" +
        "</text></svg>"
    )

  const rawGroups = [charm.Skill1Group, charm.Skill2Group, charm.Skill3Group].filter((g) => g !== null)
  const groups = rawGroups.map((g) => (typeof g === "number" ? `Group${g}` : `${g}`))
  const defaultTab = groups.length > 0 ? groups[0] : "none"

  return (
    // 只讓技能列表 grid 顯示捲軸；外層不再全區滾動
    <div className='text-base lg:text-lg'>
      {groups.length === 0 && <div className='text-sm text-gray-600'>{t("charmTypes.dialog.noSkillGroups")}</div>}

      <Tabs defaultValue={defaultTab}>
        <div className='overflow-x-auto'>
          <TabsList className='flex justify-start w-full gap-2 px-3 py-7'>
            {groups.map((groupKey) => {
              const g = skillGroupsData.SkillGroups[groupKey] || {}
              return (
                <TabsTrigger
                  key={groupKey}
                  value={groupKey}
                  className='flex-shrink-0 px-3 py-1 text-base font-bold rounded lg:text-lg'
                  style={{ backgroundColor: g.bgColor || undefined, color: g.color }}>
                  {getGroupTranslation(groupKey)}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {groups.map((groupKey, idx) => {
          const groupData = skillGroupsData.SkillGroups[groupKey]
          if (!groupData)
            return (
              <div key={idx} className='p-2 text-sm text-gray-600 '>
                {t("charmTypes.dialog.unknownGroup", { group: groupKey })}
              </div>
            )

          return (
            <TabsContent key={groupKey} value={groupKey} className='p-2 border rounded'>
              <div
                className='flex items-center justify-between px-2 py-1 mb-2 text-base font-bold rounded'
                style={{ backgroundColor: groupData.bgColor, color: groupData.color }}>
                <span className='truncate'>{getGroupTranslation(groupKey)}</span>
                <span className='text-xs text-white/90'> {groupData.data.length} </span>
              </div>
              {/* 大螢幕顯示更多欄位；此區域限制高度並啟用捲軸 */}
              <div className='grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto'>
                {groupData.data.map((skill, i) => (
                  <button key={i} className='flex items-center gap-2 px-3 py-2 text-sm text-left bg-gray-100 rounded lg:text-base hover:bg-gray-200'>
                    <img
                      src={`${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skill.SkillName.replace(/\//g, "-"))}.png`}
                      alt={skill.SkillName}
                      className='flex-shrink-0 object-contain w-5 h-5 lg:w-6 lg:h-6'
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
                    <div className='flex-1 min-w-0'>
                      <span className='inline-block truncate align-middle'>{getSkillTranslation(skill.SkillName)}</span>
                      <span className='ml-1 text-[10px] text-gray-500'>Lv.{skill.SkillLevel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

export default CharmSkillsDialogContent
