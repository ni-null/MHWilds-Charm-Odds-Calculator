import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import SkillGroupsData from "../../data/SkillGroups.json"
import useMhwStore from "../../store/mhwStore"

export default function AmuletList({ matchingAmulets, amuletProbabilities, rarityBaseProbability, getGroupSkillCountForRarity }) {
  const [expandedIndex, setExpandedIndex] = useState(null)
  const { t, i18n } = useTranslation()
  const { selectedSkills } = useMhwStore()

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

  // 計算總機率和按稀有度分組的機率
  const rarityProbabilities = {}
  let totalProbability = 0

  matchingAmulets.forEach((amulet, index) => {
    const probability = parseFloat(amuletProbabilities[index]) || 0
    if (!rarityProbabilities[amulet.Rarity]) {
      rarityProbabilities[amulet.Rarity] = 0
    }
    rarityProbabilities[amulet.Rarity] += probability
    totalProbability += probability
  })

  return (
    <section className='w-full p-10 bg-white shadow-lg rounded-xl'>
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
              // 智能格式化總機率，避免科學記號
              if (totalProbability >= 0.01) {
                return totalProbability.toFixed(4)
              } else if (totalProbability >= 0.001) {
                return totalProbability.toFixed(6)
              } else if (totalProbability >= 0.0001) {
                return totalProbability.toFixed(8)
              } else {
                // 對於非常小的數字，使用更多小數位數
                const formatted = totalProbability.toFixed(12).replace(/\.?0+$/, "")
                if (formatted.includes("e")) {
                  return totalProbability.toFixed(15).replace(/\.?0+$/, "")
                }
                return formatted
              }
            })()}
            {t("probability.percentage")}
            {totalProbability > 0 && (
              <span className='ml-2 text-lg font-normal'>
                ({t("probability.approximately")} 1/{Math.round(100 / totalProbability).toLocaleString()})
              </span>
            )}
          </div>
        </div>
      )}

      {matchingAmulets.length > 0 ? (
        <ul className='divide-y divide-gray-200'>
          {matchingAmulets.map((amulet, index) => {
            const amuletSkills = getSkillsFromAmulet(amulet)
            // 所以 parseFloat 得到的是百分比數值。保留原顯示字串以維持小數位數格式。
            const probability = parseFloat(amuletProbabilities[index]) || 0
            const probabilityDisplay = amuletProbabilities[index] ?? probability.toFixed(4)
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
              <>
                <li
                  key={`${amulet.Rarity}-${amulet.Name}-${index}`}
                  className='flex flex-col items-start justify-between gap-4 px-2 py-4 border-b md:flex-row md:items-center md:gap-6'>
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
                        {t("amulet.probability")}: {probabilityDisplay}
                        {t("probability.percentage")}
                      </div>
                      {probability > 0 && (
                        // probability 是百分比 (p%), 換算成小數機率為 p/100，倒數為 1/(p/100) = 100/p
                        <span className='ml-2 text-xs font-normal'>
                          ({t("probability.approximately")} 1/{Math.round(100 / probability).toLocaleString()})
                        </span>
                      )}
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
                          const slotObj = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].slot) || {}
                          const slotKeys = Object.keys(slotObj)
                          return slotKeys.map((key, idx) => {
                            let display = key
                            try {
                              const arr = JSON.parse(key)
                              display = `[${arr.join(", ")}]`
                            } catch {
                              // fallback to raw key
                            }
                            return (
                              <span key={idx} className='mr-2 text-sm'>
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
                                const slotObj = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].slot) || {}
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
              </>
            )
          })}
        </ul>
      ) : (
        <div className='py-8 text-base text-center text-gray-500'>
          {selectedSkills.some(Boolean) ? t("amulet.noMatches") : t("amulet.selectSkills")}
        </div>
      )}

      {/* 機率計算說明 */}
      <div className='p-6 mt-6 border border-green-200 rounded-lg bg-green-50'>
        <div className='space-y-4 text-green-800'>
          <div>
            <strong className='text-lg'>{t("probability.calculation.title")}</strong>
          </div>

          <div className='text-base font-medium'>{t("probability.calculation.subtitle")}</div>

          <div className='space-y-2'>
            <div className='font-medium'>{t("probability.calculation.rarityBase")}</div>
            <div className='p-2 font-mono text-sm bg-white rounded'>RARE[5] = 59% | RARE[6] = 27% | RARE[7] = 11% | RARE[8] = 3%</div>
            <div className='mt-1 text-xs text-green-600'>{t("probability.calculation.charmTypeCounts")}</div>
          </div>

          <div className='space-y-2 text-sm'>
            <div>• {t("probability.calculation.baseFormula")}</div>
            <div>• {t("probability.calculation.typeFormula")}</div>
            <div>• {t("probability.calculation.skillFormula")}</div>
          </div>

          <div className='space-y-3'>
            <div className='text-base font-medium'>{t("probability.calculation.explanation.title")}</div>
            <div className='pl-2 space-y-1 text-sm'>
              <div>{t("probability.calculation.explanation.step1")}</div>
              <div>{t("probability.calculation.explanation.step2")}</div>
              <div>{t("probability.calculation.explanation.step3")}</div>
              <div>{t("probability.calculation.explanation.step4")}</div>
              <div>{t("probability.calculation.explanation.step5")}</div>
              <div>{t("probability.calculation.explanation.step6")}</div>
              <div>{t("probability.calculation.explanation.step7")}</div>
            </div>
          </div>

          <div className='p-3 bg-white border rounded'>
            <div className='mb-2 text-base font-medium'>{t("probability.calculation.example.title")}</div>
            <div className='space-y-1 text-sm'>
              <div>{t("probability.calculation.example.description")}</div>
              <div className='pl-2 space-y-0.5 mt-2'>
                <div>{t("probability.calculation.example.step1")}</div>
                <div>{t("probability.calculation.example.step2")}</div>
                <div>{t("probability.calculation.example.step3")}</div>
              </div>
              <div className='mt-2 font-medium'>{t("probability.calculation.example.result")}</div>
            </div>
          </div>

          <div className='space-y-2 text-sm text-green-700'>
            <div className='font-semibold'>{t("probability.note.title")}</div>
            <div className='space-y-1'>
              <div>{t("probability.note.line1")}</div>
              <div>{t("probability.note.line2")}</div>
              <div>{t("probability.note.line3")}</div>
              <div>{t("probability.note.line4")}</div>
              <div>{t("probability.note.line5")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
