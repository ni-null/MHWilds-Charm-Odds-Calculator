import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import SkillGroupsData from "../../data/SkillGroups.json"
import RarityData from "../../data/Rarity.json"
import useMhwStore from "../../store/mhwStore"

export default function AmuletList({ matchingAmulets, amuletProbabilities, rarityBaseProbability, getGroupSkillCountForRarity }) {
  const [expandedIndex, setExpandedIndex] = useState(null)
  const { t, i18n } = useTranslation()
  const { selectedSkills, selectedSlot } = useMhwStore()

  const hasSelection = (selectedSkills || []).filter(Boolean).length > 0

  // locally filter by selectedSlot to avoid mismatch if parent forgot to filter
  const visibleAmulets = React.useMemo(() => {
    if (!selectedSlot) return matchingAmulets
    return matchingAmulets.filter((amulet) => {
      const rarityData = rarityBaseProbability[amulet.Rarity] || {}
      const groups = rarityData.Group || []
      // return true if any group within this rarity defines the selectedSlot
      return groups.some((g) => {
        const gSlotObj = (g && g.slot) || {}
        return Object.prototype.hasOwnProperty.call(gSlotObj, selectedSlot)
      })
    })
  }, [matchingAmulets, selectedSlot, rarityBaseProbability])

  // inline placeholder SVG used when skill icon fails to load
  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
        "<rect fill='%23efefef' width='100%' height='100%'/>" +
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23999'>?" +
        "</text></svg>"
    )

  // 根據護石群組取得可能的技能（AmuletList 自行管理，不再由外部傳入）
  const getSkillsFromAmulet = (amulet) => {
    const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)
    const possibleSkills = []

    amuletGroups.forEach((groupNumber) => {
      const groupKey = `Group${groupNumber}`
      if (SkillGroupsData.SkillGroups[groupKey]) {
        SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
          const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
          possibleSkills.push({
            name: skillKey,
            group: groupNumber,
            isSelected: selectedSkills.includes(skillKey),
          })
        })
      }
    })

    return possibleSkills
  }

  // 計算總機率和按稀有度分組的機率（同時累計不含插槽與含插槽）
  const rarityProbabilities = {}
  let totalNoSlot = 0
  let totalWithSlot = 0

  visibleAmulets.forEach((amulet) => {
    // find original index in matchingAmulets to look up probability map
    const originalIndex = matchingAmulets.indexOf(amulet)
    const probEntry = amuletProbabilities[originalIndex]
    const noSlotProb = probEntry && probEntry.noSlot ? parseFloat(probEntry.noSlot.rawPercent) || 0 : 0
    const withSlotProb = probEntry && probEntry.withSlot ? parseFloat(probEntry.withSlot.rawPercent) || 0 : 0

    if (!rarityProbabilities[amulet.Rarity]) {
      rarityProbabilities[amulet.Rarity] = { noSlot: 0, withSlot: 0 }
    }
    rarityProbabilities[amulet.Rarity].noSlot += noSlotProb
    rarityProbabilities[amulet.Rarity].withSlot += withSlotProb
    totalNoSlot += noSlotProb
    totalWithSlot += withSlotProb
  })

  // If no skills selected, don't show the amulet list section
  if (!hasSelection) return null

  return (
    <section className='w-full p-5 bg-white shadow-lg md:p-10 rounded-xl'>
      <h2 className='mb-4 text-2xl font-semibold'>
        {t("amulet.matching")} ({matchingAmulets.length} {t("common.count")})
      </h2>

      {/* 總機率顯示 */}
      {matchingAmulets.length > 0 && (
        <div className='p-3 bg-orange-100 rounded'>
          <div className='text-xl font-bold text-orange-800'>
            {t("common.total")}
            {t("amulet.probability")}:{" "}
            {(() => {
              // 智能格式化總機率（不含插槽）
              if (totalNoSlot >= 0.01) return totalNoSlot.toFixed(4)
              if (totalNoSlot >= 0.001) return totalNoSlot.toFixed(6)
              if (totalNoSlot >= 0.0001) return totalNoSlot.toFixed(8)
              const formatted = totalNoSlot.toFixed(12).replace(/\.?0+$/, "")
              if (formatted.includes("e")) return totalNoSlot.toFixed(15).replace(/\.?0+$/, "")
              return formatted
            })()}
            {t("probability.percentage")}
            {totalNoSlot > 0 && (
              <span className='ml-2 text-lg font-normal'>
                ({t("probability.approximately")} 1/{Math.round(100 / totalNoSlot).toLocaleString()})
              </span>
            )}
            {/* 當選擇插槽時，顯示含插槽的總機率與插槽篩選百分比 */}
            {selectedSlot &&
              (() => {
                // 試圖從任一 visibleAmulet 找到 slot 百分比（同一稀有度下 slot 百分比相同）
                const sample = visibleAmulets[0]
                if (!sample) return null
                const rarityData = rarityBaseProbability[sample.Rarity] || {}
                // find sample probability display to compute approx 1/N for withSlot
                const sampleOriginalIndex = matchingAmulets.indexOf(sample)
                const sampleProbEntry = amuletProbabilities[sampleOriginalIndex]
                const sampleProbabilityDisplay = sampleProbEntry || parseFloat(amuletProbabilities[sampleOriginalIndex]) || 0
                const groups = rarityData.Group || []
                // weighted average of group-level slot probabilities using combinationCount
                let weightSum = 0
                let weightedSlotSum = 0
                groups.forEach((g) => {
                  const comb = g.combinationCount || 1
                  const gSlotObj = (g && g.slot) || {}
                  const prob = Object.prototype.hasOwnProperty.call(gSlotObj, selectedSlot) ? gSlotObj[selectedSlot] : 0
                  weightSum += comb
                  weightedSlotSum += comb * prob
                })
                const slotVal = weightSum > 0 ? weightedSlotSum / weightSum : undefined
                if (typeof slotVal === "undefined") return null
                // 格式化含插槽總機率
                let formattedWithSlot
                if (totalWithSlot >= 0.01) formattedWithSlot = totalWithSlot.toFixed(4)
                else if (totalWithSlot >= 0.001) formattedWithSlot = totalWithSlot.toFixed(6)
                else if (totalWithSlot >= 0.0001) formattedWithSlot = totalWithSlot.toFixed(8)
                else formattedWithSlot = totalWithSlot.toFixed(12).replace(/\.?0+$/, "")

                return (
                  <div className='mt-1 text-lg text-gray-700'>
                    <div>
                      {t("amulet.specificSlotProb", { defaultValue: "Specific slot probability" })}: {formattedWithSlot}
                      {t("probability.percentage")}
                      {(() => {
                        // 顯示近似 1/N（使用 withSlot 原始百分比）
                        const rawWithSlotPct =
                          typeof sampleProbabilityDisplay === "object"
                            ? sampleProbabilityDisplay.withSlot && sampleProbabilityDisplay.withSlot.rawPercent
                            : parseFloat(sampleProbabilityDisplay) || 0
                        if (rawWithSlotPct && rawWithSlotPct > 0) {
                          const approx = Math.round(100 / rawWithSlotPct)
                          return (
                            <span className='ml-2 text-lg font-normal'>
                              ({t("probability.approximately")} 1/{approx.toLocaleString()})
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                )
              })()}
          </div>
        </div>
      )}

      {visibleAmulets.length > 0 ? (
        <ul className='divide-y divide-gray-200'>
          {visibleAmulets.map((amulet, index) => {
            const amuletSkills = getSkillsFromAmulet(amulet)
            // find probability using original index
            const originalIndex = matchingAmulets.indexOf(amulet)
            const probability = parseFloat(amuletProbabilities[originalIndex]) || 0
            const probabilityDisplay = amuletProbabilities[originalIndex] ?? probability.toFixed(4)
            // 稀有度顏色對照
            const rarityColorMap = {
              "RARE[8]": "text-orange-600",
              "RARE[7]": "text-purple-600",
              "RARE[6]": "text-blue-800",
              "RARE[5]": "text-green-600",
            }
            const rarityClass = rarityColorMap[amulet.Rarity] || "text-gray-800"
            // prepare sorted selected skills according to this amulet's group order
            const selectedSkillsFilteredForRender = selectedSkills.filter(Boolean)
            const amuletGroupsForSort = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null && g !== undefined)
            const sortedSelectedSkills = selectedSkillsFilteredForRender.slice().sort((a, b) => {
              const ma = amuletSkills.find((s) => s.name === a)
              const mb = amuletSkills.find((s) => s.name === b)
              const ia = ma ? amuletGroupsForSort.indexOf(ma.group) : Number.POSITIVE_INFINITY
              const ib = mb ? amuletGroupsForSort.indexOf(mb.group) : Number.POSITIVE_INFINITY
              if (ia === ib) return 0
              return ia - ib
            })

            return (
              <React.Fragment key={`${amulet.Rarity}-${amulet.Name}-${index}`}>
                <li className='flex flex-col items-start justify-between gap-4 px-2 py-4 border-b md:flex-row md:items-center md:gap-6'>
                  <div className='flex items-center  min-w-[140px] mb-2 md:mb-0 md:mr-4'>
                    <img
                      src={`${import.meta.env.BASE_URL}image/Charm/${encodeURIComponent(amulet.Rarity)}.png`}
                      alt={amulet.Rarity}
                      style={{ width: 40, height: 40, objectFit: "contain" }}
                      className='mr-2 rounded'
                      onError={(e) => {
                        try {
                          if (!e || !e.currentTarget) return
                          const el = e.currentTarget
                          el.style.display = "none"
                        } catch {
                          /* swallow */
                        }
                      }}
                    />
                    <div className='flex flex-col'>
                      <div className={`text-lg font-semibold ${rarityClass}`}>{amulet.Rarity}</div>
                      <div className='flex items-center text-xs font-medium'>
                        {t("amulet.probability")}:{/* show probability WITHOUT slot as primary */}
                        <span className='ml-1'>
                          {typeof probabilityDisplay === "object" ? probabilityDisplay.noSlot.formatted : probabilityDisplay}
                        </span>
                        {t("probability.percentage")}
                      </div>

                      {/* When slot filter is active, show detailed slot probability (with slot applied) */}
                      {selectedSlot &&
                        (() => {
                          const slotObj = amulet.slotObj || {}
                          const slotProb = slotObj[selectedSlot]
                          if (typeof slotProb !== "undefined") {
                            const slotPct = slotProb * 100
                            const formattedWithSlot =
                              typeof probabilityDisplay === "object"
                                ? probabilityDisplay.withSlot.formatted
                                : (parseFloat(probabilityDisplay) || 0).toFixed(6)
                            return (
                              <div className='mt-1 text-xs text-gray-700'>
                                <div>
                                  {t("amulet.specificSlotProb", { defaultValue: "Specific slot probability" })}: {formattedWithSlot}
                                  {t("probability.percentage")}
                                </div>
                                <div className='text-gray-500'>
                                  ({t("skillSelector.slotFilter")} {slotPct.toFixed(2)}%)
                                </div>
                                {/*   當等級不為 RARE[8]  顯示 rare8Note 提醒*/}
                                {amulet.Rarity !== "RARE[8]" && (
                                  <div className='text-xs text-gray-500'>
                                    {t("slotProbability.rare8Note", { defaultValue: "Note: This amulet is not RARE[8]." })}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          return null
                        })()}

                      {(() => {
                        // probability is the percentage string or object; compute approximate 1/N display using raw percent
                        const rawPct = typeof probabilityDisplay === "object" ? probabilityDisplay.rawPercent : parseFloat(probabilityDisplay) || 0
                        if (rawPct > 0) {
                          const approx = Math.round(100 / rawPct)
                          return (
                            <span className='ml-2 text-xs font-normal'>
                              ({t("probability.approximately")} 1/{approx.toLocaleString()})
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                  <div className='flex-1'>
                    <div className='mb-1 text-base'>
                      <span className='font-medium'>{t("amulet.skillGroups")}:</span>
                      <span className='ml-2'>
                        {[amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group]
                          .filter((g) => g !== null && g !== undefined)
                          .map((g, i) => {
                            const groupKey = `Group${g}`
                            const gd = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || {}
                            const bg = gd.color || "#6b7280"
                            const text = "#ffffff"
                            return (
                              <span
                                key={i}
                                className='inline-block px-2 py-0.5 rounded text-xs font-medium mr-2'
                                style={{ backgroundColor: bg, color: text }}>
                                {g}
                              </span>
                            )
                          })}
                      </span>
                    </div>
                    <div className='mb-1 text-base'>
                      <span className='font-medium'>{t("amulet.matchingSkills")}:</span>
                      {selectedSkills.filter(Boolean).length === 0 && <span className='ml-2 text-sm text-gray-500'>{t("common.none")}</span>}
                      {sortedSelectedSkills.map((skillKey, skillIndex) => {
                        const match = amuletSkills.find((s) => s.name === skillKey)
                        let displayName = skillKey
                        let bgColor = "#e0e0e0"
                        let textColor = "#38761D"
                        if (match) {
                          const groupKey = `Group${match.group}`
                          if (SkillGroupsData.SkillGroups[groupKey]) {
                            if (SkillGroupsData.SkillGroups[groupKey].bgColor) {
                              bgColor = SkillGroupsData.SkillGroups[groupKey].bgColor
                            }
                            if (SkillGroupsData.SkillGroups[groupKey].color) {
                              textColor = SkillGroupsData.SkillGroups[groupKey].color
                            }
                          }
                        }
                        if (i18n.language && i18n.language.startsWith("zh") && match) {
                          const skillName = match.name.split(" Lv.")[0]
                          const skillLevel = match.name.split(" Lv.")[1]
                          const translatedName = t(`skillTranslations.${skillName}`, skillName)
                          displayName = `${translatedName} ${t("common.level")}${skillLevel}`
                        }
                        return match ? (
                          <span
                            key={skillIndex}
                            className='inline-flex items-center gap-1 mt-2 px-2 py-0.5 ml-2 text-base rounded whitespace-nowrap'
                            style={{ backgroundColor: bgColor, color: textColor, fontWeight: "bold" }}>
                            <img
                              src={`${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(
                                match.name.split(" Lv.")[0].replace(/\//g, "-")
                              )}.png`}
                              alt={match.name.split(" Lv.")[0]}
                              style={{ width: 22, height: 22, objectFit: "contain" }}
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
                            {displayName}
                          </span>
                        ) : null
                      })}
                    </div>
                    <div className='mb-1 text-base'>
                      <span className='font-medium'>{t("amulet.slotCombinations")}:</span>
                      <span className='ml-2'>
                        {(() => {
                          // 嘗試根據顯示美化 selectedSlot
                          // selectedSlot 會用來比對 key 是否為選擇項目

                          // 讀取來自 src/data/Rarity.json 的所有組合插槽（稀有度聯集）
                          const rarityEntry = RarityData[amulet.Rarity] || {}
                          const groups = rarityEntry.Group || []

                          // 嘗試只取與當前 amulet 技能群組相符的 Group 的 slot keys
                          const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group]
                            .filter((g) => g !== null && g !== undefined)
                            .map(Number)
                          // sorted string for easy comparison
                          const amuletGroupsSorted = amuletGroups
                            .slice()
                            .sort((a, b) => a - b)
                            .join(",")

                          const slotKeySet = new Set()
                          groups.forEach((g) => {
                            const gSkills = (g && g.skills) || []
                            const gSkillsSorted = gSkills
                              .slice()
                              .sort((a, b) => a - b)
                              .join(",")
                            if (gSkillsSorted === amuletGroupsSorted) {
                              const gSlotObj = (g && g.slot) || {}
                              Object.keys(gSlotObj).forEach((k) => slotKeySet.add(k))
                            }
                          })

                          // 若沒有任何匹配（保守回退），則使用稀有度下所有 group's 聯集
                          if (slotKeySet.size === 0) {
                            groups.forEach((g) => {
                              const gSlotObj = (g && g.slot) || {}
                              Object.keys(gSlotObj).forEach((k) => slotKeySet.add(k))
                            })
                          }

                          const slotKeys = Array.from(slotKeySet)

                          // 始終顯示所有組合，若其中一個等於 selectedSlot 就加強樣式
                          if (slotKeys.length === 0) {
                            return <span className='ml-2 text-sm text-gray-500'>{t("common.none")}</span>
                          }

                          return slotKeys.map((key, idx) => {
                            let display = key
                            try {
                              const arr = JSON.parse(key)
                              display = `[${arr.join(", ")}]`
                            } catch {
                              // fallback to raw key
                            }

                            const isSelected = selectedSlot && selectedSlot === key
                            const className = `mr-2 text-sm ${isSelected ? "text-blue-600 font-bold" : ""}`

                            return (
                              <span key={idx} className={className}>
                                {display}
                              </span>
                            )
                          })
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className='flex flex-col items-end md:items-end min-w-[80px] mt-2 md:mt-0 md:ml-4 w-full md:w-auto'>
                    <button
                      className='px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50'
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                      {expandedIndex === index ? t("common.collapse") : t("common.details")}
                    </button>
                  </div>
                </li>
                {expandedIndex === index && (
                  <li className='px-2 py-3 border-b bg-gray-50'>
                    <div className='p-3 text-sm bg-white border rounded'>
                      {/* 機率計算詳細步驟 */}
                      {(() => {
                        const baseProb = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].probability) || 0.01
                        const selectedSkillsFiltered = selectedSkills.filter(Boolean)

                        if (selectedSkillsFiltered.length === 0) {
                          return <div className='mb-2 text-base'>{t("probability.debug.noSkillsSelected")}</div>
                        }

                        // 計算該稀有度下護石類型的總數（使用 RarityBaseProbability.Group 的項目數）
                        const totalAmuletsOfRarity =
                          rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].Group
                            ? rarityBaseProbability[amulet.Rarity].Group.length
                            : 0
                        const amuletTypeProb = 1 / totalAmuletsOfRarity

                        // 統計每個技能在每個群組的需求
                        const skillRequirements = {}
                        selectedSkillsFiltered.forEach((skillKey) => {
                          skillRequirements[skillKey] = (skillRequirements[skillKey] || 0) + 1
                        })

                        // 獲取護石的群組
                        const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

                        // 計算實際使用的群組和機率 - 考慮已選擇技能的排除效應
                        const usedGroups = []
                        const usedSkillCounts = []
                        const skillDrawDetails = [] // 記錄每次抽取的詳細信息
                        let skillCombinationProb = 1
                        const selectedSkillBaseNamesInGroup = {} // 記錄每個群組中已選擇的技能基礎名稱

                        // 需要根據選擇的技能順序來計算，模擬實際分配過程
                        const skillToGroupMap = {}
                        // 建立技能到群組的映射（簡化版）
                        for (const groupNum of amuletGroups) {
                          const groupKey = `Group${groupNum}`
                          if (SkillGroupsData.SkillGroups[groupKey]) {
                            SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
                              const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
                              if (!skillToGroupMap[skillKey]) {
                                skillToGroupMap[skillKey] = []
                              }
                              skillToGroupMap[skillKey].push(groupNum)
                            })
                          }
                        }

                        // 模擬技能分配過程
                        const usedSlots = []
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

                            // 計算該群組中已選擇的技能基礎名稱
                            if (!selectedSkillBaseNamesInGroup[groupNumber]) {
                              selectedSkillBaseNamesInGroup[groupNumber] = new Set()
                            }

                            // 獲取當前技能的基礎名稱
                            const currentSkillBaseName = skillKey.split(" Lv.")[0]

                            // 計算需要排除的技能數量和已選技能列表（用於顯示）
                            const groupKey = `Group${groupNumber}`
                            let excludedSkillCount = 0
                            const excludedSkillBaseNames = new Set() // 用於記錄被排除的技能基礎名稱

                            if (SkillGroupsData.SkillGroups[groupKey]) {
                              // 收集所有已選擇的技能基礎名稱（來自所有群組）
                              const allSelectedBaseNames = new Set()
                              Object.values(selectedSkillBaseNamesInGroup).forEach((baseNameSet) => {
                                baseNameSet.forEach((baseName) => allSelectedBaseNames.add(baseName))
                              })

                              // 計算該群組中所有與已選技能基礎名稱相同的技能數量
                              allSelectedBaseNames.forEach((baseName) => {
                                const sameBaseNameSkills = SkillGroupsData.SkillGroups[groupKey].data.filter((skill) => skill.SkillName === baseName)
                                if (sameBaseNameSkills.length > 0) {
                                  excludedSkillCount += sameBaseNameSkills.length
                                  excludedSkillBaseNames.add(baseName)
                                }
                              })
                            }

                            // 可用技能數量 = 總數 - 需要排除的技能數量
                            const availableSkillCount = totalSkillCount - excludedSkillCount
                            skillCombinationProb *= 1 / availableSkillCount

                            // 記錄這個技能的基礎名稱已被選擇
                            selectedSkillBaseNamesInGroup[groupNumber].add(currentSkillBaseName)

                            usedGroups.push(groupNumber)
                            usedSkillCounts.push(availableSkillCount)
                            skillDrawDetails.push({
                              skill: skillKey,
                              group: groupNumber,
                              total: totalSkillCount,
                              excludedBaseNames: Array.from(excludedSkillBaseNames), // 轉換為陣列以便顯示
                              available: availableSkillCount,
                            })
                          }
                        }

                        const finalProb = baseProb * amuletTypeProb * skillCombinationProb

                        return (
                          <>
                            <div className='mb-2 text-base font-semibold'>{t("probability.debug.title")}</div>
                            <div className='mb-1 text-base'>
                              {amulet.Rarity}
                              {t("probability.debug.baseProb")}: {baseProb} ({(baseProb * 100).toFixed(2)}%)
                            </div>
                            <div className='mb-1 text-base'>
                              {amulet.Rarity}
                              {t("probability.charmTypeProb")}: 1/{totalAmuletsOfRarity} ={" "}
                              {(() => {
                                const prob = amuletTypeProb
                                if (prob >= 0.001) return prob.toFixed(8)
                                else if (prob >= 0.0001) return prob.toFixed(10)
                                else return prob.toFixed(12).replace(/\.?0+$/, "")
                              })()}
                            </div>
                            <div className='mb-1 text-base'>
                              {t("probability.debug.skillGroups")}:{" "}
                              {skillDrawDetails.map((detail, i) => (
                                <div key={i} className='ml-4 text-sm'>
                                  <span className='font-medium'>
                                    {t("common.group")}
                                    {detail.group}: {detail.total}
                                    {t("probability.debug.skills")}
                                    {detail.excludedBaseNames.length > 0 && (
                                      <span className='ml-2 text-gray-600'>
                                        ({t("probability.debug.excluded")}:{" "}
                                        {detail.excludedBaseNames
                                          .map((skillBaseName) => {
                                            if (i18n.language && i18n.language.startsWith("zh")) {
                                              return t(`skillTranslations.${skillBaseName}`, skillBaseName)
                                            } else {
                                              return skillBaseName
                                            }
                                          })
                                          .join(", ")}
                                        )
                                      </span>
                                    )}
                                  </span>
                                  <span className='ml-2 text-green-600'> → {detail.available}</span>
                                </div>
                              ))}
                            </div>
                            <div className='mb-1 text-base'>
                              {t("probability.debug.skillCombProb")}: {usedSkillCounts.map((count) => `1/${count}`).join(" × ")} ={" "}
                              {(() => {
                                const prob = skillCombinationProb
                                if (prob >= 0.001) return prob.toFixed(8)
                                else if (prob >= 0.0001) return prob.toFixed(10)
                                else return prob.toFixed(12).replace(/\.?0+$/, "")
                              })()}
                            </div>
                            <div className='mb-1 text-base'>
                              {t("probability.debug.finalProb")}: {baseProb} ×{" "}
                              {(() => {
                                const prob = amuletTypeProb
                                if (prob >= 0.001) return prob.toFixed(8)
                                else if (prob >= 0.0001) return prob.toFixed(10)
                                else return prob.toFixed(12).replace(/\.?0+$/, "")
                              })()}{" "}
                              ×{" "}
                              {(() => {
                                const prob = skillCombinationProb
                                if (prob >= 0.001) return prob.toFixed(8)
                                else if (prob >= 0.0001) return prob.toFixed(10)
                                else return prob.toFixed(12).replace(/\.?0+$/, "")
                              })()}{" "}
                              ={" "}
                              {(() => {
                                const prob = finalProb
                                if (prob >= 0.001) return prob.toFixed(8)
                                else if (prob >= 0.0001) return prob.toFixed(10)
                                else return prob.toFixed(15).replace(/\.?0+$/, "")
                              })()}
                            </div>
                            <div className='mb-1 text-base'>
                              {t("probability.debug.finalPercentage")}:{" "}
                              {(() => {
                                const percentageProb = finalProb * 100
                                if (percentageProb >= 0.01) return percentageProb.toFixed(6)
                                else if (percentageProb >= 0.001) return percentageProb.toFixed(8)
                                else if (percentageProb >= 0.0001) return percentageProb.toFixed(10)
                                else return percentageProb.toFixed(12).replace(/\.?0+$/, "")
                              })()}
                              %
                            </div>
                            <div className='text-base'>
                              {t("amulet.slotCombinations")}:{" "}
                              {(() => {
                                const slotObj = amulet.slotObj || {}
                                return Object.keys(slotObj).map((key, idx) => {
                                  let display = key
                                  try {
                                    const arr = JSON.parse(key)
                                    display = `[${arr.join(", ")}]`
                                  } catch {
                                    // fallback
                                  }
                                  return (
                                    <span key={idx} className='mr-2'>
                                      {display}
                                    </span>
                                  )
                                })
                              })()}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </li>
                )}
              </React.Fragment>
            )
          })}
        </ul>
      ) : (
        <div className='py-8 text-base text-center text-gray-500'>
          {selectedSkills.some(Boolean) ? t("amulet.noMatches") : t("amulet.selectSkills")}
        </div>
      )}

      {/* 機率計算說明 已移至頁面層級 index.jsx */}
    </section>
  )
}
