import React from "react"
import { useTranslation } from "react-i18next"
import useMhwStore from "../../../store/mhwStore"

export default function TotalProbability() {
  const { t, i18n } = useTranslation()
  const { AvlCharms = [] } = useMhwStore()

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

  // format percent and 1/x
  // format percent and 1/x for both totals
  const percentNoSlotStr = (totals.noSlot * 100).toFixed(4)
  const percentWithSlotStr = (totals.withSlot * 100).toFixed(4)

  const makeFrac = (p) => {
    if (!p || p <= 0) return "0"
    const denom = Math.max(1, Math.round(1 / p))
    return `1/${denom}`
  }

  const fracNoSlot = makeFrac(totals.noSlot)
  const fracWithSlot = makeFrac(totals.withSlot)

  // localized number formatting for display (keep consistency with other components)
  // some i18n.language values in this project are short keys like 'zhTW' — map them to valid BCP47 tags
  const lng = (i18n && i18n.language) || (typeof navigator !== "undefined" && navigator.language) || undefined
  const langMap = { enUS: "en-US", zhTW: "zh-TW", zhCN: "zh-CN", jaJP: "ja-JP" }
  const locale = (lng && langMap[lng]) || lng || undefined

  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })

  return (
    <section className='w-full p-6 mb-8 bg-white rounded-xl'>
      <h2 className='mb-4 text-xl font-semibold'>{t("totalProbability.title", "總機率")}</h2>
      <div className='space-y-3'>
        <div className='flex items-center'>
          <div className='mr-4 text-lg text-gray-600'>{t("totalProbability.noSlot", "技能機率")}:</div>
          <div className='text-lg font-bold text-indigo-600'>
            {nf.format(Number(percentNoSlotStr))}%<span className='ml-3 text-sm text-gray-500'>({fracNoSlot})</span>
          </div>
        </div>

        <div className='flex items-center'>
          <div className='mr-4 text-lg text-gray-600'>{t("totalProbability.withSlot", "技能+插槽機率")}:</div>
          <div className='text-lg font-bold text-indigo-600'>
            {nf.format(Number(percentWithSlotStr))}%<span className='ml-3 text-sm text-gray-500'>({fracWithSlot})</span>
          </div>
        </div>
      </div>
    </section>
  )
}
