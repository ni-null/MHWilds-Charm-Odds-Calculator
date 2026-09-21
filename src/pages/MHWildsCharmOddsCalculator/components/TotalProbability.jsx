import { motion as Motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { decimalToFraction } from "../../../lib/fractionUtils"
import useMhwStore from "../../../store/mhwStore"

export default function TotalProbability() {
  const { t } = useTranslation()
  const { AvlCharms = [] } = useMhwStore()
  const charms = useMemo(() => (Array.isArray(AvlCharms) ? AvlCharms : []), [AvlCharms])

  const [visibleItems, setVisibleItems] = useState(new Set())
  const observerRef = useRef(null)

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rarity = entry.target.getAttribute("data-rarity")
          if (!rarity) return

          setVisibleItems((previous) => {
            const next = new Set(previous)
            if (entry.isIntersecting) {
              next.add(rarity)
            } else {
              next.delete(rarity)
            }
            return next
          })
        })
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    )

    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    setVisibleItems(new Set())
  }, [AvlCharms])

  const probabilitiesByRarity = useMemo(() => {
    const probabilities = {}

    charms.forEach((charm) => {
      const rarity = charm.rarity || "Unknown"
      if (!probabilities[rarity]) {
        probabilities[rarity] = { noSlot: 0, withSlot: 0 }
      }

      const computed = charm.computed || {}
      probabilities[rarity].noSlot += computed.finalNoSlot || 0
      probabilities[rarity].withSlot += computed.finalWithSlot || 0
    })

    return Object.entries(probabilities).sort(([rarityA], [rarityB]) => rarityA.localeCompare(rarityB))
  }, [charms])

  if (charms.length === 0) return null

  return (
    <div>
      <div className='flex flex-col'>
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
              {probabilitiesByRarity.map(([rarity, probability], index) => {
                const isVisible = visibleItems.has(rarity)

                return (
                  <Motion.tr
                    key={`${rarity}-${charms.length}`}
                    data-rarity={rarity}
                    ref={(element) => {
                      if (element && observerRef.current) {
                        observerRef.current.observe(element)
                      }
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{
                      opacity: isVisible ? 1 : 0,
                      y: isVisible ? 0 : 8,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: isVisible ? index * 0.15 : 0,
                      ease: "easeOut",
                    }}
                    className='hover:bg-gray-50'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <img
                          src={`${import.meta.env.BASE_URL}image/charms/${encodeURIComponent(rarity)}.png`}
                          alt={rarity}
                          className='object-contain w-8 h-8 rounded'
                          onError={(event) => {
                            event.currentTarget.style.display = "none"
                          }}
                        />
                        <span className='font-medium'>{rarity}</span>
                      </div>
                    </td>
                    <td className='px-4 py-3 font-semibold text-indigo-600'>{decimalToFraction(probability.noSlot)}</td>
                    <td className='px-4 py-3 font-semibold text-indigo-600'>{decimalToFraction(probability.withSlot)}</td>
                  </Motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
