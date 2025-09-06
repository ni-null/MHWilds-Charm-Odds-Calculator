import React, { useState, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import skillGroupsData from "../../data/SkillGroups.json"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import { useLanguageSync } from "../../hooks/useLanguageSync"

const SkillGroupsPage = () => {
  const { t } = useTranslation()
  useLanguageSync() // 同步語言設置
  const [searchTerm, setSearchTerm] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // inline placeholder SVG used when skill icon fails to load
  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
        "<rect fill='%23efefef' width='100%' height='100%'/>" +
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23999'>?" +
        "</text></svg>"
    )

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const skillGroups = skillGroupsData.SkillGroups

  // 翻譯技能名稱的函數
  const getSkillTranslation = useCallback(
    (skillName) => {
      const translation = t(`skillTranslations.${skillName}`)
      // 如果翻譯存在且不等於鍵值，返回翻譯；否則返回原始名稱
      return translation !== `skillTranslations.${skillName}` ? translation : skillName
    },
    [t]
  )

  // 翻譯群組名稱的函數
  const getGroupTranslation = useCallback(
    (groupKey) => {
      const groupNumber = groupKey.toLowerCase()
      const translation = t(`skillGroups.${groupNumber}`)
      return translation !== `skillGroups.${groupNumber}` ? translation : groupKey
    },
    [t]
  )

  // 搜索和篩選功能
  const filteredGroups = useMemo(() => {
    const groups = Object.entries(skillGroups)

    if (!searchTerm) return groups

    return groups.filter(([groupKey, groupData]) => {
      // 搜索群組名稱或技能名稱（包含翻譯）
      const groupMatch =
        groupKey.toLowerCase().includes(searchTerm.toLowerCase()) || getGroupTranslation(groupKey).toLowerCase().includes(searchTerm.toLowerCase())
      const skillMatch = groupData.data.some((skill) => {
        const originalName = skill.SkillName.toLowerCase()
        const translatedName = getSkillTranslation(skill.SkillName).toLowerCase()
        return originalName.includes(searchTerm.toLowerCase()) || translatedName.includes(searchTerm.toLowerCase())
      })
      return groupMatch || skillMatch
    })
  }, [skillGroups, searchTerm, getSkillTranslation, getGroupTranslation])

  // 統計資料
  const stats = useMemo(() => {
    const totalGroups = Object.keys(skillGroups).length
    const totalSkills = Object.values(skillGroups).reduce((acc, group) => acc + group.data.length, 0)
    const uniqueSkills = new Set()
    Object.values(skillGroups).forEach((group) => {
      group.data.forEach((skill) => {
        uniqueSkills.add(skill.SkillName)
      })
    })

    return {
      totalGroups,
      totalSkills,
      uniqueSkills: uniqueSkills.size,
    }
  }, [skillGroups])

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <div className={`flex flex-col flex-1 xl:ml-64 w-full ${isSidebarOpen ? "ml-64" : ""}`}>
        <Header onMenuToggle={handleSidebarToggle} title={t("skillGroups.title")} />
        <main className='flex-1 p-6'>
          <div className='container mx-auto max-w-9xl'>
            {/* 頁面標題和統計 */}
            <div className='mb-8'>
              <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 xl:block'>{t("skillGroups.title")}</h1>
              <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
                <div className='p-4 text-center bg-white rounded-lg shadow'>
                  <div className='text-2xl font-bold text-blue-600'>{stats.totalGroups}</div>
                  <div className='text-gray-600'>{t("skillGroups.totalGroups")}</div>
                </div>
                <div className='p-4 text-center bg-white rounded-lg shadow'>
                  <div className='text-2xl font-bold text-green-600'>{stats.totalSkills}</div>
                  <div className='text-gray-600'>{t("skillGroups.totalSkills")}</div>
                </div>
                <div className='p-4 text-center bg-white rounded-lg shadow'>
                  <div className='text-2xl font-bold text-purple-600'>{stats.uniqueSkills}</div>
                  <div className='text-gray-600'>{t("skillGroups.uniqueSkills")}</div>
                </div>
              </div>
            </div>

            {/* 搜索欄 */}
            <div className='mb-6'>
              <div className='relative max-w-md'>
                <input
                  type='text'
                  placeholder={t("skillGroups.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                  <svg className='w-5 h-5 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                </div>
              </div>
              {searchTerm && <p className='mt-2 text-sm text-gray-600'>{t("skillGroups.searchResults", { count: filteredGroups.length })}</p>}
            </div>

            {/* 群組網格 */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {filteredGroups.map(([groupKey, groupData]) => (
                <div
                  key={groupKey}
                  className='overflow-hidden rounded-lg shadow-lg'
                  style={{
                    backgroundColor: groupData.bgColor,
                    border: `3px solid ${groupData.bgColor}`,
                  }}>
                  {/* 群組標題 */}
                  <div
                    className='px-4 py-3'
                    style={{
                      backgroundColor: groupData.bgColor,
                      color: groupData.color,
                    }}>
                    <h2 className='text-xl font-bold'>{getGroupTranslation(groupKey)}</h2>
                    <p
                      className='font-bold text-md opacity-90 text-white/90'
                      style={{
                        backgroundColor: groupData.bgColor,
                        color: groupData.color,
                      }}>
                      {t("skillGroups.skillCount", { count: groupData.data.length })}
                    </p>
                  </div>

                  {/* 技能預覽 */}
                  <div className='p-3'>
                    <div className='space-y-1 overflow-y-auto max-h-48 lg:max-h-80'>
                      {groupData.data.map((skill, index) => (
                        <div key={index} className='flex items-center justify-between px-3 py-2 text-sm bg-white rounded bg-opacity-70'>
                          <div className='flex items-center flex-1 min-w-0 gap-3'>
                            <img
                              src={`${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skill.SkillName.replace(/\//g, "-"))}.png`}
                              alt={skill.SkillName}
                              className='flex-shrink-0 object-contain w-8 h-8'
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
                            <span className='text-base font-bold text-gray-800 truncate md:text-lg'>{getSkillTranslation(skill.SkillName)}</span>
                          </div>
                          <span
                            className='text-sm font-bold px-2 py-0.5 rounded-full opacity-60 text-white flex-shrink-0 ml-2'
                            style={{ backgroundColor: groupData.color }}>
                            Lv.{skill.SkillLevel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredGroups.length === 0 && (
              <div className='py-12 text-center'>
                <div className='text-lg text-gray-500'>{t("skillGroups.noResults")}</div>
                <button
                  onClick={() => setSearchTerm("")}
                  className='px-4 py-2 mt-4 text-white transition-colors bg-blue-500 rounded hover:bg-blue-600'>
                  {t("skillGroups.clearSearch")}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default SkillGroupsPage
