import React, { useState, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
// AmuletData is now represented inside RarityBaseProbability.json as Group + combinationCount
import SkillGroupsData from "../../data/SkillGroups.json"
import RarityBaseProbabilityData from "../../data/Rarity.json"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import SkillSelector from "./SkillSelector"
import AmuletList from "./AmuletList"
import useMhwStore from "../../store/mhwStore"
import { useLanguageSync } from "../../hooks/useLanguageSync"

export default function MHWPage() {
  const { t } = useTranslation()
  useLanguageSync() // 同步語言設置
  // selectedSkills moved to zustand store to avoid prop drilling
  const { selectedSkills, selectedSlot } = useMhwStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 稀有度基礎機率設定（從資料檔載入）
  const rarityBaseProbability = RarityBaseProbabilityData

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // 建立技能(含等級)到群組號的映射（供頁面其他計算使用）
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

  // 根據選擇的技能篩選護石 — 由於 AmuletData 已搬入 RarityBaseProbability.json，先展平成虛擬護石清單
  const matchingAmulets = useMemo(() => {
    const selectedSkillsFiltered = selectedSkills.filter(Boolean)

    // 如果只選擇插槽而沒有選擇技能，返回空陣列（只顯示插槽機率）
    if (selectedSkillsFiltered.length === 0) return []

    // build virtual amulet list from rarity groups
    const virtualAmulets = []
    Object.entries(rarityBaseProbability).forEach(([rarity, data]) => {
      const groups = data.Group || []
      groups.forEach((gObj) => {
        const skills = gObj.skills || []
        // create a lightweight amulet representation that matches code expectations
        const amu = {
          Rarity: rarity,
          Skill1Group: skills[0] || null,
          Skill2Group: skills[1] || null,
          Skill3Group: skills[2] || null,
          combinationCount: gObj.combinationCount || 0,
        }
        virtualAmulets.push(amu)
      })
    })

    return virtualAmulets.filter((amulet) => {
      // if a slot filter is selected, only include amulets whose rarity supports that slot
      if (selectedSlot) {
        const slotObj = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].slot) || {}
        if (!Object.prototype.hasOwnProperty.call(slotObj, selectedSlot)) return false
      }

      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)
      const usedSlots = []

      for (const skillKey of selectedSkillsFiltered) {
        const skillGroups = skillToGroupMap[skillKey] || []
        let foundSlot = false
        for (let slotIndex = 0; slotIndex < amuletGroups.length; slotIndex++) {
          if (!usedSlots.includes(slotIndex) && skillGroups.includes(amuletGroups[slotIndex])) {
            usedSlots.push(slotIndex)
            foundSlot = true
            break
          }
        }
        if (!foundSlot) return false
      }

      return true
    })
  }, [selectedSkills, skillToGroupMap, rarityBaseProbability, selectedSlot])

  // 根據護石群組取得可能的技能

  // 計算每個群組在特定稀有度下的技能數量
  const getGroupSkillCountForRarity = useCallback(
    (groupNumber, rarity) => {
      // 對於Monster Hunter護石系統：
      // 每個群組的技能數量在所有稀有度下都是相同的
      // 稀有度主要影響基礎出現機率，而不是技能選擇池
      const groupKey = `Group${groupNumber}`
      const totalGroupSkills = SkillGroupsData.SkillGroups[groupKey] ? SkillGroupsData.SkillGroups[groupKey].data.length : 1

      // 檢查該稀有度是否實際包含此群組（從 RarityBaseProbability.json 的 Group 欄位判斷）
      const rarityGroups = (rarityBaseProbability[rarity] && rarityBaseProbability[rarity].Group) || []
      const hasGroupInRarity = rarityGroups.some((g) => Array.isArray(g.skills) && g.skills.includes(groupNumber))

      return hasGroupInRarity ? totalGroupSkills : 1
    },
    [rarityBaseProbability]
  )

  // 計算護石的精確出現機率
  const calculateAmuletProbability = useCallback(
    (amulet, includeSlot = true) => {
      const baseProb = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].probability) || 0.01
      // if a slot is selected, factor in the slot probability for this rarity
      const slotObj = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].slot) || {}
      const slotProb = includeSlot && selectedSlot && Object.prototype.hasOwnProperty.call(slotObj, selectedSlot) ? slotObj[selectedSlot] : 1
      const selectedSkillsFiltered = selectedSkills.filter(Boolean)

      if (selectedSkillsFiltered.length === 0) return baseProb * slotProb

      // 計算該稀有度下護石類型的總數（使用 RarityBaseProbability.Group 的項目數）
      const amuletsOfSameRarity = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].Group) || []
      const amuletTypeProb = amuletsOfSameRarity.length > 0 ? 1 / amuletsOfSameRarity.length : 0

      // 獲取護石的群組
      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

      // 計算技能組合機率：考慮已選擇技能的排除效應
      let skillCombinationProb = 1
      const usedSlots = []
      const selectedSkillBaseNamesInGroup = {} // 記錄每個群組中已選擇的技能基礎名稱

      for (const skillKey of selectedSkillsFiltered) {
        const skillGroups = skillToGroupMap[skillKey] || []

        // 找到一個未使用的槽位，且該槽位的群組可以提供此技能
        let assignedSlot = -1
        for (let slotIndex = 0; slotIndex < amuletGroups.length; slotIndex++) {
          if (!usedSlots.includes(slotIndex) && skillGroups.includes(amuletGroups[slotIndex])) {
            assignedSlot = slotIndex
            usedSlots.push(slotIndex)
            break
          }
        }

        if (assignedSlot !== -1) {
          const groupNumber = amuletGroups[assignedSlot]
          const totalSkillCount = getGroupSkillCountForRarity(groupNumber, amulet.Rarity)

          // 計算該群組中已選擇的技能基礎名稱數量
          if (!selectedSkillBaseNamesInGroup[groupNumber]) {
            selectedSkillBaseNamesInGroup[groupNumber] = new Set()
          }

          // 獲取當前技能的基礎名稱
          const currentSkillBaseName = skillKey.split(" Lv.")[0]

          // 計算需要排除的技能數量（該群組中與已選技能基礎名稱相同的所有技能）
          const groupKey = `Group${groupNumber}`
          let excludedSkillCount = 0
          if (SkillGroupsData.SkillGroups[groupKey]) {
            // 收集所有已選擇的技能基礎名稱（來自所有群組）
            const allSelectedBaseNames = new Set()
            Object.values(selectedSkillBaseNamesInGroup).forEach((baseNameSet) => {
              baseNameSet.forEach((baseName) => allSelectedBaseNames.add(baseName))
            })

            // 計算該群組中所有與已選技能基礎名稱相同的技能數量
            allSelectedBaseNames.forEach((baseName) => {
              const sameBaseNameSkills = SkillGroupsData.SkillGroups[groupKey].data.filter((skill) => skill.SkillName === baseName)
              excludedSkillCount += sameBaseNameSkills.length
            })
          }

          // 可用技能數量 = 總數 - 需要排除的技能數量
          const availableSkillCount = totalSkillCount - excludedSkillCount
          skillCombinationProb *= 1 / availableSkillCount

          // 記錄這個技能的基礎名稱已被選擇
          selectedSkillBaseNamesInGroup[groupNumber].add(currentSkillBaseName)
        }
      }

      // 最終機率 = 基礎機率 × 插槽機率(if included) × 護石類型機率 × 技能組合機率
      return baseProb * slotProb * amuletTypeProb * skillCombinationProb
    },
    [rarityBaseProbability, getGroupSkillCountForRarity, selectedSkills, skillToGroupMap, selectedSlot]
  )

  // 計算匹配護石的機率分布，同時回傳「不含插槽」與「含插槽」兩種表示
  const amuletProbabilities = useMemo(() => {
    if (matchingAmulets.length === 0) return {}

    const probabilities = {}
    matchingAmulets.forEach((amulet, index) => {
      const probNoSlot = calculateAmuletProbability(amulet, false)
      const probWithSlot = calculateAmuletProbability(amulet, true)

      const pctNoSlot = probNoSlot * 100
      const pctWithSlot = probWithSlot * 100

      const formatPct = (percentageProb) => {
        if (percentageProb >= 0.01) return percentageProb.toFixed(4)
        if (percentageProb >= 0.001) return percentageProb.toFixed(6)
        if (percentageProb >= 0.0001) return percentageProb.toFixed(8)
        return percentageProb.toFixed(12).replace(/\.?0+$/, "")
      }

      probabilities[index] = {
        noSlot: {
          formatted: formatPct(pctNoSlot),
          rawPercent: pctNoSlot,
        },
        withSlot: {
          formatted: formatPct(pctWithSlot),
          rawPercent: pctWithSlot,
        },
      }
    })

    return probabilities
  }, [matchingAmulets, calculateAmuletProbability])

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <div className='flex flex-col flex-1 lg:ml-64'>
        <Header onMenuToggle={handleSidebarToggle} title={t("title")} />
        <main className='flex-1 p-6'>
          <div className='container mx-auto max-w-7xl'>
            {/* 頁面標題 */}
            <div className='mb-8'>
              <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 lg:block'>{t("title")}</h1>
            </div>

            <SkillSelector />

            {/* 插槽機率顯示區塊 - 當只選擇插槽而沒選擇技能時顯示 */}
            {selectedSlot && selectedSkills.filter(Boolean).length === 0 && (
              <section className='w-full p-6 mb-8 bg-white rounded-xl'>
                <h2 className='mb-4 text-xl font-semibold'>{t("slotProbability.title", "插槽機率")}</h2>
                {/* 顯示所有稀有度累計後的總機率 */}
                {(() => {
                  const totalFinalProbability = Object.entries(rarityBaseProbability).reduce((sum, [, data]) => {
                    const slotObj = (data && data.slot) || {}
                    const slotProb = Object.prototype.hasOwnProperty.call(slotObj, selectedSlot) ? slotObj[selectedSlot] : 0
                    if (!slotProb) return sum
                    const baseProb = data.probability || 0
                    return sum + baseProb * slotProb
                  }, 0)

                  // 分子固定為 1 的表示法：1 / N（若機率為 0 顯示 0）
                  let fracStr = "0"
                  if (totalFinalProbability > 0) {
                    const denomOne = Math.max(1, Math.round(1 / totalFinalProbability))
                    fracStr = `1/${denomOne}`
                  }

                  return (
                    <div className='flex items-center justify-between mb-4'>
                      <div className='text-sm text-gray-600'>{t("slotProbability.totalLabel", "全部稀有度總機率")}:</div>
                      <div className='text-2xl font-bold text-indigo-600'>
                        {(totalFinalProbability * 100).toFixed(4)}%<span className='ml-3 text-sm text-gray-500'>({fracStr})</span>
                      </div>
                    </div>
                  )
                })()}

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {Object.entries(rarityBaseProbability).map(([rarity, data]) => {
                    const slotObj = (data && data.slot) || {}
                    const hasSlot = Object.prototype.hasOwnProperty.call(slotObj, selectedSlot)
                    const slotProbability = hasSlot ? slotObj[selectedSlot] : 0

                    if (!hasSlot) return null

                    // 計算最終機率 = 稀有度基礎機率 × 插槽機率
                    const baseProbability = data.probability || 0
                    const finalProbability = baseProbability * slotProbability

                    // determine slot image(s) or fallback text
                    let slotImgSrcs = []
                    let slotAlt = selectedSlot
                    try {
                      const arr = JSON.parse(selectedSlot)
                      if (Array.isArray(arr)) {
                        arr.forEach((v) => {
                          if (typeof v === "string" && v.startsWith("W")) {
                            slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                          } else if (typeof v === "number") {
                            const idx = Math.min(Math.max(1, v), 3)
                            slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${idx}.png`)
                          }
                        })
                      }
                    } catch {
                      // not JSON, try simple string like 'W1' or numeric
                      if (typeof selectedSlot === "string" && selectedSlot.indexOf("W") !== -1) {
                        slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                      } else if (!isNaN(Number(selectedSlot))) {
                        const idx = Math.min(Math.max(1, Number(selectedSlot)), 3)
                        slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${idx}.png`)
                      }
                    }

                    return (
                      <div
                        key={rarity}
                        className='p-6 transition-shadow border rounded-lg shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md'>
                        <div className='flex items-center justify-between mb-3'>
                          <span className='text-lg font-medium text-gray-700'>{rarity}</span>
                          <img
                            src={`${import.meta.env.BASE_URL}image/Charm/${rarity}.png`}
                            alt={rarity}
                            className='object-contain w-12 h-12'
                            onError={(e) => {
                              e.target.style.display = "none"
                            }}
                          />
                        </div>
                        <div className='flex items-center gap-3 mb-2 text-sm text-gray-600'>
                          <div className='text-gray-600'>{t("slotProbability.slot", "插槽")}:</div>
                          {slotImgSrcs.length ? (
                            <div className='flex items-center gap-2'>
                              {slotImgSrcs.map((s, idx) => (
                                <img
                                  key={s + idx}
                                  src={s}
                                  alt={slotAlt}
                                  className='object-contain w-10 h-10'
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className='font-mono'>{selectedSlot}</span>
                          )}
                        </div>
                        <div className='space-y-1'>
                          <div className='text-xs text-gray-500'>
                            {t("slotProbability.baseProb", "稀有度機率")}: {(baseProbability * 100).toFixed(2)}%
                          </div>
                          <div className='text-xs text-gray-500'>
                            {t("slotProbability.slotProb", "插槽機率")}: {(slotProbability * 100).toFixed(2)}%
                          </div>
                          <div className='pt-1 text-xl font-bold text-indigo-600'>
                            {t("slotProbability.finalProb", "總機率")}: {(finalProbability * 100).toFixed(4)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            <AmuletList
              matchingAmulets={matchingAmulets}
              amuletProbabilities={amuletProbabilities}
              rarityBaseProbability={rarityBaseProbability}
              getGroupSkillCountForRarity={getGroupSkillCountForRarity}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
