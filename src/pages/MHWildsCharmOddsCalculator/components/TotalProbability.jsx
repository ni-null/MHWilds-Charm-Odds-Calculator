import React, { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
// ensure `motion` is referenced so some linters that don't detect JSX usage won't report it as unused
void motion
import { useTranslation } from "react-i18next"
import useMhwStore from "../../../store/mhwStore"
import { decimalToFraction } from "../../../lib/fractionUtils"

export default function TotalProbability() {
  const { t } = useTranslation()
  const { AvlCharms = [] } = useMhwStore()

  // State to track which items are visible
  const [visibleItems, setVisibleItems] = useState(new Set())
  const observerRef = useRef(null)

  // Setup Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const itemId = entry.target.getAttribute("data-rarity")
          if (itemId) {
            setVisibleItems((prev) => {
              const newSet = new Set(prev)
              if (entry.isIntersecting) {
                newSet.add(itemId)
              } else {
                newSet.delete(itemId)
              }
              return newSet
            })
          }
        })
      },
      {
        threshold: 0.1, // Trigger when 10% of the item is visible
        rootMargin: "50px", // Start animation 50px before the item enters viewport
      }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Reset visible items when AvlCharms changes
  useEffect(() => {
    setVisibleItems(new Set())
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

  return (
    <div>
      <div className='flex flex-col'>
        {/* 使用 AvlCharms 的資料統計個別 rarity 組別顯示組別的總機率 */}
        <div className='pt-2 mt-2 overflow-x-auto rounded-lg border border-gray-200'>
          <table className='w-full min-w-[32rem] text-left'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='px-4 py-3 text-sm font-semibold text-gray-700'>{t("rarity", "稀有度")}</th>
                <th className='px-4 py-3 text-sm font-semibold text-gray-700'>{t("skill", "技能機率")}</th>
                <th className='px-4 py-3 text-sm font-semibold text-gray-700'>{t("totalProbability.withSlot", "技能+插槽")}</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {(() => {
                const per = {}
                charms.forEach((c) => {
                  const r = c.rarity || "Unknown"
                  if (!per[r]) per[r] = { noSlot: 0, withSlot: 0 }
                  const comp = c.computed || {}
                  per[r].noSlot += comp.finalNoSlot || 0
                  per[r].withSlot += comp.finalWithSlot || 0
                })

                return Object.keys(per)
                  .sort()
                  .map((r, idx) => {
                    const entry = per[r]
                    const isVisible = visibleItems.has(r)

                    return (
                      <motion.tr
                        key={`${r}-${AvlCharms.length}`}
                        data-rarity={r}
                        ref={(el) => {
                          if (el && observerRef.current) observerRef.current.observe(el)
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 8 }}
                        transition={{ duration: 0.4, delay: isVisible ? idx * 0.15 : 0, ease: "easeOut" }}
                        className='hover:bg-gray-50'>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-3'>
                            <img
                              src={`${import.meta.env.BASE_URL}image/Charm/${encodeURIComponent(r || "unknown")}.png`}
                              alt={r}
                              className='object-contain w-8 h-8 rounded'
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                            <span className='font-medium'>{r}</span>
                          </div>
                        </td>
                        <td className='px-4 py-3 font-semibold text-indigo-600'>{decimalToFraction(entry.noSlot)}</td>
                        <td className='px-4 py-3 font-semibold text-indigo-600'>{decimalToFraction(entry.withSlot)}</td>
                      </motion.tr>
                    )
                  })
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
