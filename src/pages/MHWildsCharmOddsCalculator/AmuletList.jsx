import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import SkillGroupsData from "../../data/SkillGroups.json"

export default function AmuletList({
  matchingAmulets,
  amuletProbabilities,
  rarityBaseProbability,
  selectedSkills,
  getSkillsFromAmulet,
  getGroupSkillCountForRarity,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null)
  const { t, i18n } = useTranslation()

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
        <div className='p-3 bg-orange-100 border-2 border-orange-300 rounded'>
          <div className='text-xl font-bold text-orange-800'>
            {t("common.total")}
            {t("amulet.probability")}: {totalProbability.toFixed(4)}
            {t("probability.percentage")}
            {totalProbability > 0 && <span className='ml-2 text-lg font-normal'>(約 1/{Math.round(100 / totalProbability).toLocaleString()})</span>}
          </div>
        </div>
      )}

      {matchingAmulets.length > 0 ? (
        <ul className='divide-y divide-gray-200'>
          {matchingAmulets.map((amulet, index) => {
            const amuletSkills = getSkillsFromAmulet(amulet)
            const probability = amuletProbabilities[index]
            return (
              <>
                <li key={index} className='flex flex-col items-start justify-between gap-4 px-2 py-4 border-b md:flex-row md:items-center md:gap-6'>
                  <div className='flex flex-col min-w-[140px] mb-2 md:mb-0 md:mr-4'>
                    <div className='text-lg font-semibold text-purple-600'>{amulet.Rarity}</div>
                    <div className='text-base font-medium text-blue-600'>
                      {t("amulet.probability")}: {probability}
                      {t("probability.percentage")}
                    </div>
                  </div>
                  <div className='flex-1'>
                    <div className='mb-1 text-base'>
                      <span className='font-medium'>{t("amulet.skillGroups")}:</span>
                      <span className='ml-2'>
                        {[amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group]
                          .filter((g) => g !== null && g !== undefined)
                          .map((g, i) => (
                            <span key={i} className='mr-2'>
                              {t("common.group")}
                              {g}
                            </span>
                          ))}
                      </span>
                    </div>
                    <div className='mb-1 text-base'>
                      <span className='font-medium'>{t("amulet.matchingSkills")}:</span>
                      {selectedSkills.filter(Boolean).length === 0 && <span className='ml-2 text-sm text-gray-500'>{t("common.none")}</span>}
                      {selectedSkills.filter(Boolean).map((skillKey, skillIndex) => {
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
                        if (i18n.language === "zhTW" && match) {
                          const skillName = match.name.split(" Lv.")[0]
                          const skillLevel = match.name.split(" Lv.")[1]
                          const translatedName = t(`skillTranslations.${skillName}`, skillName)
                          displayName = `${translatedName} ${t("common.level")}${skillLevel}`
                        }
                        return match ? (
                          <span
                            key={skillIndex}
                            className='px-2 py-1 ml-2 text-sm rounded'
                            style={{ backgroundColor: bgColor, color: textColor, fontWeight: "bold" }}>
                            {displayName}
                          </span>
                        ) : null
                      })}
                    </div>
                    <div className='mb-1 text-base'>
                      <span className='font-medium'>{t("amulet.slotCombinations")}:</span>
                      <span className='ml-2'>
                        {amulet.PossibleSlotCombos.map((combo, comboIndex) => (
                          <span key={comboIndex} className='mr-2 text-sm'>
                            [{combo.join(", ")}]
                          </span>
                        ))}
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
                        const baseProb = rarityBaseProbability[amulet.Rarity] || 0.01
                        const groups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)
                        const skillCounts = groups.map((groupNumber) => getGroupSkillCountForRarity(groupNumber, amulet.Rarity))
                        const skillCombinationProb = skillCounts.reduce((acc, count) => acc * (1 / count), 1)
                        const finalProb = baseProb * skillCombinationProb
                        return (
                          <>
                            <div className='mb-2 text-base font-semibold'>{t("probability.debug.title")}</div>
                            <div className='mb-1 text-base'>
                              {t("probability.debug.baseProb")}: {baseProb} ({(baseProb * 100).toFixed(2)}%)
                            </div>
                            <div className='mb-1 text-base'>
                              {t("probability.debug.skillGroups")}:{" "}
                              {groups.map((g, i) => (
                                <span key={i} className='mr-2'>
                                  {t("common.group")}
                                  {g}: {skillCounts[i]}
                                  {t("probability.debug.skills")}
                                </span>
                              ))}
                            </div>
                            <div className='mb-1 text-base'>
                              {t("probability.debug.skillCombProb")}: {skillCounts.map((count) => `1/${count}`).join(" × ")} ={" "}
                              {skillCombinationProb.toPrecision(6)}
                            </div>
                            <div className='mb-1 text-base'>
                              {t("probability.debug.finalProb")}: {baseProb} × {skillCombinationProb.toPrecision(6)} = {finalProb.toPrecision(8)}
                            </div>
                            <div className='mb-1 text-base'>
                              {t("probability.debug.finalPercentage")}: {(finalProb * 100).toFixed(4)}%
                            </div>
                            <div className='text-base'>
                              {t("amulet.slotCombinations")}:{" "}
                              {amulet.PossibleSlotCombos.map((combo, comboIndex) => (
                                <span key={comboIndex} className='mr-2'>
                                  [{combo.join(", ")}]
                                </span>
                              ))}
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

      {/* 機率統計摘要 */}
      <div className='p-4 mt-4 border border-green-200 rounded-lg bg-green-50'>
        <div className='space-y-2 text-base text-green-800'>
          <div>
            <strong>{t("probability.calculation.title")}</strong>
          </div>
          <div>{t("probability.calculation.formula")}</div>
          <div className='text-sm'>
            <div className='font-medium'>{t("probability.calculation.rarityBase")}</div>
            <div className='mt-1 font-mono text-sm'>
              RARE[5]=59%
              <br />
              RARE[6]=27%
              <br />
              RARE[7]=11%
              <br />
              RARE[8]=3%
            </div>
            <div className='mt-2'>• {t("probability.calculation.groupCount")}</div>
          </div>
          {/* 多國語系提示：使用 i18n 鍵 */}
          <div className='mt-2 text-sm text-gray-700'>
            <div className='font-semibold'>{t("probability.note.title")}</div>
            <div>{t("probability.note.line1")}</div>
            <div>{t("probability.note.line2")}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
