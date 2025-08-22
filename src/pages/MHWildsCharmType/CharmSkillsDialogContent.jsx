import React from "react"
import skillGroupsData from "../../data/SkillGroups.json"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CharmSkillsDialogContent = ({ charm, getSkillTranslation, getGroupTranslation, t }) => {
  const rawGroups = [charm.Skill1Group, charm.Skill2Group, charm.Skill3Group].filter((g) => g !== null)
  const groups = rawGroups.map((g) => (typeof g === "number" ? `Group${g}` : `${g}`))
  const defaultTab = groups.length > 0 ? groups[0] : "none"

  return (
    <div className='max-h-[60vh] overflow-y-auto'>
      {groups.length === 0 && <div className='text-sm text-gray-600'>{t("charmTypes.dialog.noSkillGroups")}</div>}

      <Tabs defaultValue={defaultTab}>
        <div className='overflow-x-auto'>
          <TabsList className='flex justify-start w-full gap-2 px-1'>
            {groups.map((groupKey) => (
              <TabsTrigger key={groupKey} value={groupKey} className='flex-shrink-0'>
                {getGroupTranslation(groupKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {groups.map((groupKey, idx) => {
          const groupData = skillGroupsData.SkillGroups[groupKey]
          if (!groupData)
            return (
              <div key={idx} className='p-2 text-sm text-gray-600'>
                {t("charmTypes.dialog.unknownGroup", { group: groupKey })}
              </div>
            )

          return (
            <TabsContent key={groupKey} value={groupKey} className='p-2 border rounded'>
              <div className='flex items-center justify-between mb-2 text-sm font-medium' style={{ color: groupData.color }}>
                <span className='truncate'>{getGroupTranslation(groupKey)}</span>
                <span className='text-xs text-gray-500'> {groupData.data.length} </span>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                {groupData.data.map((skill, i) => (
                  <button
                    key={i}
                    className='px-2 py-1 overflow-hidden text-xs text-left truncate bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap'>
                    <span className='inline-block align-middle'>{getSkillTranslation(skill.SkillName)}</span>
                    <span className='ml-1 text-[10px] text-gray-500'>Lv.{skill.SkillLevel}</span>
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
