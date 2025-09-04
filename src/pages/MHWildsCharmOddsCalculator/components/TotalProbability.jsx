import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
// ensure `motion` is referenced so some linters that don't detect JSX usage won't report it as unused
void motion
import { useTranslation } from "react-i18next"
import useMhwStore from "../../../store/mhwStore"
import { decimalToFraction } from "../../../lib/fractionUtils"

export default function TotalProbability() {
  const { t } = useTranslation()
  const { AvlCharms = [] } = useMhwStore()

  // State to trigger re-animation when AvlCharms changes
  const [animationKey, setAnimationKey] = useState(0)

  // Trigger animation whenever AvlCharms changes
  useEffect(() => {
    setAnimationKey((prev) => prev + 1)
  }, [AvlCharms])

  /*   

  console.log(AvlCharms)



[
    {
        "rarity": "RARE[5]",
        "groups": [
            1,
            6,
            6
        ],
        "matchingSkills": [],
        "slotKeys": [
            "[2, 1]"
        ],
        "AllslotKey": [
            "[1, 1]",
            "[2]",
            "[2, 1]",
            "[3]"
        ],
        "computed": {
            "baseProb": 0.59,
            "charmTypeProb": 0.16666666666666666,
            "groupProb": 1,
            "finalNoSlot": 0.024583333333333332,
            "finalWithSlot": 0.09833333333333333,
            "SlotProb": 0.25,
            "grouped": []
        }
    } 
]



*/

  const charms = Array.isArray(AvlCharms) ? AvlCharms : []
  if (!charms || charms.length === 0) return null

  // compute both totals so we can show skill-only and skill+slot probabilities
  const totals = charms.reduce(
    (acc, c) => {
      const comp = c && c.computed
      if (!comp) return acc
      acc.noSlot += comp.finalNoSlot || 0
      acc.withSlot += comp.finalWithSlot || 0
      return acc
    },
    { noSlot: 0, withSlot: 0 }
  )

  // percentage and 1/x formatting
  // compute numeric percent values first, then format with Intl for locale correctness
  const percentNoSlotNum = totals.noSlot * 100
  const percentWithSlotNum = totals.withSlot * 100

  // formatter for percent values (display with up to 8 decimal places to match previous display)
  const nfPercent = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })

  // formatter for raw decimal probability (show up to 8 decimals)
  // (removed nfDecimal variable as it's not needed directly)

  const fracNoSlot = decimalToFraction(totals.noSlot)
  const fracWithSlot = decimalToFraction(totals.withSlot)

  return (
    <section className='w-full p-6 mb-8 bg-white rounded-xl'>
      <h2 className='mb-4 text-xl font-semibold'>{t("totalProbability.title", "總機率")}</h2>
      <div className='flex flex-col'>
        <div className='space-y-3'>
          <div className='flex items-center'>
            <div className='mr-4 text-lg text-gray-600'>{t("totalProbability.noSlot", "技能機率")} :</div>
            <div className='text-lg font-bold text-indigo-600'>
              {fracNoSlot}
              <span className='ml-3 text-sm text-gray-500'>({nfPercent.format(percentNoSlotNum)}%)</span>
            </div>
          </div>

          <div className='flex items-center'>
            <div className='mr-4 text-lg text-gray-600'>{t("totalProbability.withSlot")} :</div>
            <div className='text-lg font-bold text-indigo-600'>
              {fracWithSlot}
              <span className='ml-3 text-sm text-gray-500'>({nfPercent.format(percentWithSlotNum)}%)</span>
            </div>
          </div>
        </div>
        {/* 使用 AvlCharms 的資料統計個別 rarity 組別顯示組別的總機率 */}
        <div className='pt-2 mt-2 '>
          <div className='grid grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-4'>
            {(() => {
              // aggregate per rarity
              const per = {}
              charms.forEach((c) => {
                const r = c.rarity || "Unknown"
                if (!per[r]) per[r] = { noSlot: 0, withSlot: 0, count: 0, slotSamples: new Set() }
                const comp = c.computed || {}
                per[r].noSlot += comp.finalNoSlot || 0
                per[r].withSlot += comp.finalWithSlot || 0
                per[r].count += 1
                if (Array.isArray(c.slotKeys)) c.slotKeys.slice(0, 3).forEach((s) => per[r].slotSamples.add(s))
              })

              // render sorted by rarity key
              return Object.keys(per)
                .sort()
                .map((r, idx) => {
                  const entry = per[r]
                  const pNo = entry.noSlot
                  const pWith = entry.withSlot
                  // pct and frac values are formatted inline using helpers when rendered
                  return (
                    // make each rarity item full-width on small screens and row-aligned on md+
                    <motion.div
                      key={`${r}-${animationKey}`}
                      className='w-full p-2 rounded'
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: idx * 0.15,
                        ease: "easeOut",
                      }}>
                      <div
                        className='flex justify-center w-full p-4 rounded-lg md:flex-row md:items-center md:p-10 bg-gray-50'
                        style={{ minHeight: 64 }}>
                        <div className='flex flex-col items-center min-w-0 gap-1 pr-5'>
                          {/* 稀有度圖示 - 參考 AmuletMainContent.jsx 的路徑與 onError 行為 */}
                          <img
                            src={`${import.meta.env.BASE_URL}image/Charm/${encodeURIComponent(r || "unknown")}.png`}
                            alt={r}
                            // keep objectFit inline because Tailwind doesn't provide a direct "object-contain" that maps exactly to style here in this project setup
                            style={{ objectFit: "contain" }}
                            // responsive sizing: smaller on mobile (w-8 h-8 -> 32px), larger on md+ (w-12 h-12 -> 48px)
                            className='flex-shrink-0 w-8 h-8 rounded md:w-12 md:h-12'
                            onError={(e) => {
                              try {
                                if (!e || !e.currentTarget) return
                                e.currentTarget.style.display = "none"
                              } catch (err) {
                                console.debug("rarity img onError hide failed", err)
                              }
                            }}
                          />
                          <div className='font-medium truncate max-w-[12rem] text-sm md:text-base'>{r}</div>
                        </div>

                        <div className='flex items-center justify-center'>
                          <div className='text-right md:mt-0'>
                            <div className='flex flex-row md:flex-col'>
                              <div className='text-sm text-gray-600'>
                                {t("skill")} <span className='text-xs text-gray-400'></span>:
                              </div>
                              <div className='font-semibold text-indigo-600'>{decimalToFraction(pNo)}</div>
                            </div>
                            <div className='flex flex-row md:flex-col '>
                              <div className='mt-1 text-sm text-gray-600'>
                                {t("totalProbability.withSlot")} <span className='text-xs text-gray-400'></span>:
                              </div>
                              <div className='font-semibold text-indigo-600 xl:whitespace-nowrap'>{decimalToFraction(pWith)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
            })()}
          </div>
        </div>
      </div>
    </section>
  )
}
