import React from "react"
import { useTranslation } from "react-i18next"
import useMhwStore from "../../store/mhwStore"
import RarityBaseProbabilityData from "../../data/Rarity.json"

export default function SlotProbability() {
  const { t } = useTranslation()
  const { selectedSkills, selectedSlot } = useMhwStore()
  const rarityBaseProbability = RarityBaseProbabilityData

  // Guard: only render when a slot is selected and no skills are selected
  const anySkillChosen = (selectedSkills || []).some((a) => (Array.isArray(a) ? a.length > 0 : !!a))
  if (!selectedSlot || anySkillChosen) return null

  // Calculate total final probability across rarities
  const totalFinalProbability = Object.entries(rarityBaseProbability).reduce((sum, [, data]) => {
    const groups = (data && data.Group) || []
    if (!groups.length) return sum
    let weightSum = 0
    let weightedSlotSum = 0
    groups.forEach((g) => {
      const comb = g.combinationCount || 1
      const gSlotObj = (g && g.slot) || {}
      const prob = Object.prototype.hasOwnProperty.call(gSlotObj, selectedSlot) ? gSlotObj[selectedSlot] : 0
      weightSum += comb
      weightedSlotSum += comb * prob
    })
    const slotProb = weightSum > 0 ? weightedSlotSum / weightSum : 0
    if (!slotProb) return sum
    const baseProb = data.probability || 0
    return sum + baseProb * slotProb
  }, 0)

  let fracStr = "0"
  if (totalFinalProbability > 0) {
    const denomOne = Math.max(1, Math.round(1 / totalFinalProbability))
    fracStr = `1/${denomOne}`
  }

  return (
    <section className='w-full p-6 mb-8 bg-white rounded-xl'>
      <h2 className='mb-4 text-xl font-semibold'>{t("slotProbability.title", "插槽機率")}</h2>
      <div className='flex flex-col mb-4'>
        <div className='flex'>
          <div className='mr-3 text-2xl text-gray-600'>{t("slotProbability.totalLabel", "全部稀有度總機率")}:</div>
          <div className='text-2xl font-bold text-indigo-600'>
            {(totalFinalProbability * 100).toFixed(4)}%<span className='ml-3 text-sm text-gray-500'>({fracStr})</span>
          </div>
        </div>
        <span className='mt-2'>{t("slotProbability.rare8Note", "Only RARE[8] has precise slot probabilities")}</span>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {Object.entries(rarityBaseProbability).map(([rarity, data]) => {
          const groups = (data && data.Group) || []
          if (!groups.length) return null

          let weightSum = 0
          let weightedSlotSum = 0
          groups.forEach((g) => {
            const comb = g.combinationCount || 1
            const gSlotObj = (g && g.slot) || {}
            const prob = Object.prototype.hasOwnProperty.call(gSlotObj, selectedSlot) ? gSlotObj[selectedSlot] : 0
            weightSum += comb
            weightedSlotSum += comb * prob
          })
          const slotProbability = weightSum > 0 ? weightedSlotSum / weightSum : 0
          if (!slotProbability) return null

          const baseProbability = data.probability || 0
          const finalProbability = baseProbability * slotProbability

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
                  {t("slotProbability.baseProb", "稀有度機率")} : {(baseProbability * 100).toFixed(2)}%
                </div>
                <div className='text-xs text-gray-500'>
                  {t("slotProbability.slotProb", "插槽機率")} : {(slotProbability * 100).toFixed(2)}%
                </div>
                <div className='pt-1 text-xl font-bold text-indigo-600'>
                  {t("slotProbability.finalProb", "總機率")} : {(finalProbability * 100).toFixed(4)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
