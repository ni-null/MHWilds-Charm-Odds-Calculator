import React, { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import AmuletData from "../../data/Amulet.json"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import { useLanguageSync } from "../../hooks/useLanguageSync"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import CharmSkillsDialogContent from "./CharmSkillsDialogContent"
import skillGroupsData from "../../data/SkillGroups.json"
import rarityProbabilities from "../../data/RarityBaseProbability.json"
import { Button } from "@/components/ui/button"
const CharmTypePage = () => {
  const { t } = useTranslation()
  useLanguageSync() // 同步語言設置
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 翻譯技能名稱的函數（複用 SkillGroups 頁面的邏輯）
  const getSkillTranslation = React.useCallback(
    (skillName) => {
      const translation = t(`skillTranslations.${skillName}`)
      return translation !== `skillTranslations.${skillName}` ? translation : skillName
    },
    [t]
  )

  const getGroupTranslation = React.useCallback(
    (groupKey) => {
      const groupNumber = groupKey.toLowerCase()
      const translation = t(`skillGroups.${groupNumber}`)
      return translation !== `skillGroups.${groupNumber}` ? translation : groupKey
    },
    [t]
  )

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

  // prepare rarity entries with total combos and base probability
  const rarityEntries = Object.entries(charmAnalysis.rarityGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rarity, charms]) => {
      const totalCombos = charms.reduce((s, c) => s + (c.combinationCount || 0), 0)
      const prob = rarityProbabilities[rarity]
      const formattedTotalCombos = (totalCombos || 0).toLocaleString()
      const formattedProbPct = typeof prob !== "undefined" && prob !== null ? `${Math.round(Number(prob) * 100)}%` : null

      return {
        rarity,
        charms,
        totalCombos,
        prob,
        formattedTotalCombos,
        formattedProbPct,
      }
    })

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

            <div className='p-4 mb-6 bg-white border border-gray-200 rounded-lg'>
              <h3 className='mb-1 font-semibold text-gray-800'>{t("charmTypes.notes.title")}</h3>
              <p className='text-gray-600 '>{t("charmTypes.notes.rareSame")}</p>
              <p className='text-gray-600 '>{t("charmTypes.notes.rare8FirstSlot")}</p>
            </div>

            {/* 護石種類展示 */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {rarityEntries.map((entry) => {
                const { rarity, charms, formattedTotalCombos, formattedProbPct } = entry
                // compute slot combinations that appear only in this rarity's charms
                const raritySlotSet = new Set()
                charms.forEach((ch) => {
                  if (ch.PossibleSlotCombos && Array.isArray(ch.PossibleSlotCombos)) {
                    ch.PossibleSlotCombos.forEach((combo) => {
                      if (Array.isArray(combo)) raritySlotSet.add(combo.join("-"))
                    })
                  }
                })
                const raritySlotList = Array.from(raritySlotSet).sort()
                return (
                  <div key={rarity} className='bg-white border border-gray-200 rounded-lg shadow-lg'>
                    <div className='p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'>
                      <h2 className='text-xl font-bold text-purple-700'>{rarity}</h2>
                      <p className='text-gray-600 '>{t("charmTypes.charmsCount", { count: charms.length })}</p>
                      <p className='text-gray-600 '>{t("charmTypes.header.totalCombos", { count: formattedTotalCombos })}</p>
                      {formattedProbPct && <p className='text-gray-600 '>{t("charmTypes.header.baseProbability", { pct: formattedProbPct })}</p>}
                      {raritySlotList && raritySlotList.length > 0 && (
                        <p className='mt-2 text-gray-600'>
                          {t("charmTypes.header.slotCombinations") ? t("charmTypes.header.slotCombinations") + ": " : "Slot combinations: "}
                          {raritySlotList.map((c) => `[${c.split("-").join(", ")}]`).join(" ")}
                        </p>
                      )}
                    </div>
                    <div className='p-4'>
                      <div className='space-y-2'>
                        {charms.map((charm, index) => {
                          const comboCount = charm.combinationCount
                          const formattedComboCount = (comboCount || 0).toLocaleString()

                          return (
                            <Dialog key={index}>
                              <DialogTrigger asChild>
                                <div className='p-3 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100'>
                                  <div className='mb-2 font-medium text-gray-800'>
                                    {t("charmTypes.labels.skillGroups")}:{" "}
                                    {[charm.Skill1Group, charm.Skill2Group, charm.Skill3Group]
                                      .filter((g) => g !== null)
                                      .map((g, idx) => {
                                        const groupKey = typeof g === "number" ? `Group${g}` : `${g}`
                                        const gd = (skillGroupsData.SkillGroups && skillGroupsData.SkillGroups[groupKey]) || {}

                                        return (
                                          <span
                                            key={`${groupKey}-${idx}`}
                                            className='inline-block px-2 py-0.5 mr-1 font-medium rounded'
                                            style={{ backgroundColor: gd.bgColor, color: gd.Color }}>
                                            {g}
                                          </span>
                                        )
                                      })}
                                  </div>
                                  {/* slot combinations moved to rarity header (shown once) */}
                                  <div className='mt-2 text-gray-700'>
                                    {t("charmTypes.labels.combinationCount")}: <span className='font-semibold'>{formattedComboCount}</span>
                                  </div>
                                </div>
                              </DialogTrigger>

                              <DialogContent className='w-full max-w-4xl'>
                                <DialogHeader>
                                  <DialogTitle>
                                    {t("charmTypes.dialog.title") !== "charmTypes.dialog.title"
                                      ? t("charmTypes.dialog.title")
                                      : getSkillTranslation("Select skills")}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {t("charmTypes.dialog.description") !== "charmTypes.dialog.description"
                                      ? t("charmTypes.dialog.description")
                                      : getSkillTranslation("Choose one skill per group for this charm")}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className='space-y-4'>
                                  <CharmSkillsDialogContent
                                    charm={charm}
                                    getSkillTranslation={getSkillTranslation}
                                    getGroupTranslation={getGroupTranslation}
                                    t={t}
                                  />
                                </div>

                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button className=''>{t("actions.close") !== "actions.close" ? t("actions.close") : "Close"}</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CharmTypePage
