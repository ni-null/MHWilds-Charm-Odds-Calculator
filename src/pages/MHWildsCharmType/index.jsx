import React, { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import AmuletData from "../../data/Amulet.json"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import { useLanguageSync } from "../../hooks/useLanguageSync"

const CharmTypePage = () => {
  const { t } = useTranslation()
  useLanguageSync() // 同步語言設置
  const [searchTerm, setSearchTerm] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // 護石種類分析
  const charmAnalysis = useMemo(() => {
    const rarityGroups = {}
    const slotCombinations = new Set()
    const skillGroups = new Set()

    AmuletData.forEach((amulet) => {
      // 按稀有度分組
      if (!rarityGroups[amulet.Rarity]) {
        rarityGroups[amulet.Rarity] = []
      }
      rarityGroups[amulet.Rarity].push(amulet)

      // 插槽組合
      amulet.PossibleSlotCombos.forEach((combo) => {
        slotCombinations.add(combo.join("-"))
      })

      // 技能群組
      if (amulet.Skill1Group) skillGroups.add(amulet.Skill1Group)
      if (amulet.Skill2Group) skillGroups.add(amulet.Skill2Group)
      if (amulet.Skill3Group) skillGroups.add(amulet.Skill3Group)
    })

    return {
      rarityGroups,
      slotCombinations: Array.from(slotCombinations).sort(),
      totalSkillGroups: skillGroups.size,
      totalCharms: AmuletData.length,
    }
  }, [])

  // 篩選護石
  const filteredCharms = useMemo(() => {
    if (!searchTerm) return AmuletData

    return AmuletData.filter((amulet) => {
      return (
        amulet.Rarity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amulet.PossibleSlotCombos.some((combo) => combo.join("-").includes(searchTerm))
      )
    })
  }, [searchTerm])

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <div className='flex flex-col flex-1 lg:ml-64'>
        <Header onMenuToggle={handleSidebarToggle} title={t("charmTypes.title")} />
        <main className='flex-1 p-6'>
          <div className='container mx-auto max-w-7xl'>
            {/* 頁面標題和統計 */}
            <div className='mb-8'>
              <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 lg:block'>{t("charmTypes.title")}</h1>
              <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
                <div className='p-4 text-center bg-white rounded-lg shadow'>
                  <div className='text-2xl font-bold text-blue-600'>{charmAnalysis.totalCharms}</div>
                  <div className='text-gray-600'>{t("charmTypes.stats.totalCharms")}</div>
                </div>
                <div className='p-4 text-center bg-white rounded-lg shadow'>
                  <div className='text-2xl font-bold text-green-600'>{Object.keys(charmAnalysis.rarityGroups).length}</div>
                  <div className='text-gray-600'>{t("charmTypes.stats.rarities")}</div>
                </div>
                <div className='p-4 text-center bg-white rounded-lg shadow'>
                  <div className='text-2xl font-bold text-purple-600'>{charmAnalysis.slotCombinations.length}</div>
                  <div className='text-gray-600'>{t("charmTypes.stats.slotCombinations")}</div>
                </div>
              </div>
            </div>

            {/* 護石種類展示 */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {Object.entries(charmAnalysis.rarityGroups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([rarity, charms]) => (
                  <div key={rarity} className='bg-white border border-gray-200 rounded-lg shadow-lg'>
                    <div className='p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'>
                      <h2 className='text-xl font-bold text-purple-700'>{rarity}</h2>
                      <p className='text-sm text-gray-600'>{t("charmTypes.charmsCount", { count: charms.length })}</p>
                    </div>
                    <div className='p-4'>
                      <div className='space-y-2'>
                        {charms.map((charm, index) => (
                          <div key={index} className='p-3 border rounded bg-gray-50'>
                            <div className='mb-2 text-sm font-medium text-gray-800'>
                              {t("charmTypes.labels.skillGroups")}:{" "}
                              {[charm.Skill1Group, charm.Skill2Group, charm.Skill3Group].filter((g) => g !== null).join(", ")}
                            </div>
                            <div className='text-xs text-gray-600'>
                              {t("charmTypes.labels.slotCombinations")}: {charm.PossibleSlotCombos.map((combo) => `[${combo.join(", ")}]`).join(" ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CharmTypePage
