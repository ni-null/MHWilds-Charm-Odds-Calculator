import React, { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import SlotList from "./SlotList"
export default function AmuletDetails({ charm, t, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // safe access to computed values
  const computed = charm?.computed || {}

  // build human-readable formula and per-group details for groupProb from computed.grouped
  const groupInfo = (() => {
    const groups = computed.grouped || []
    if (!Array.isArray(groups) || groups.length === 0) return null
    const parts = groups.map((g) => {
      const avail = Number(g.available) || 0
      return `1/${Math.max(1, avail)}`
    })
    const details = groups.map((g, idx) => {
      const total = Number(g.total) || Math.max(1, Number(g.available) || 1)
      const available = Number(g.available) || 0
      const excluded = Array.isArray(g.excluded) ? g.excluded : []
      return {
        key: `${g.group}-${idx}`,
        group: g.group,
        total,
        available,
        excluded,
      }
    })
    return { formula: parts.join(" * "), details }
  })()

  const fmt = (v) => {
    if (v === undefined || v === null || Number.isNaN(v)) return "-"
    if (typeof v === "number") {
      // Format to 8 decimal places and remove trailing zeros
      const formatted = v.toFixed(8).replace(/\.?0+$/, "")
      const percentage = (v * 100).toFixed(2)
      return `${formatted} (${percentage}%)`
    }
    return String(v)
  }

  // fmtDecimal: format only the decimal number without percentage or extra text
  const fmtDecimal = (v) => {
    if (v === undefined || v === null || Number.isNaN(v)) return "-"
    if (typeof v === "number") {
      // Format to up to 8 decimal places, then strip trailing zeros
      return v
        .toFixed(8)
        .replace(/\. ?0+$/, "")
        .replace(/\.?0+$/, "")
        .replace(/\.$/, "")
    }
    // If it's a string that already looks like a number, return as-is
    return String(v)
  }

  const DetailsContent = () => (
    <div className='flex flex-col gap-2 sm:gap-3'>
      <div className='flex items-center gap-2 text-xs sm:text-sm'>
        <span className='font-semibold text-gray-400'>{t("amuletDetails.baseProb")}</span>
        <span className='font-bold text-yellow-500 truncate'>{fmt(computed.baseProb ?? charm?.baseProbability)}</span>
      </div>

      <div className='flex items-center gap-2 text-xs sm:text-sm'>
        <span className='font-semibold text-gray-400'>{t("amuletDetails.charmTypeProb")}</span>
        <span className='font-bold text-yellow-500'>{fmt(computed.charmTypeProb)}</span>
      </div>

      <div className='flex flex-col text-sm'>
        <div className='flex items-center gap-2'>
          <span className='font-semibold text-gray-400'>{t("amuletDetails.groupProb")}</span>
          <span className='font-bold text-yellow-500'>{fmt(computed.groupProb)}</span>
        </div>
        <div className='ml-10'>
          {groupInfo ? (
            <>
              <div className='mt-1 font-mono text-xs text-gray-400 break-words'>{groupInfo.formula}</div>
              <div className='mt-1 text-xs text-gray-400'>
                {groupInfo.details.map((d) => {
                  const counts = d.total === d.available ? `${d.available}` : `${d.total} -> ${d.available}`
                  const translatedExcluded =
                    d.excluded && d.excluded.length > 0
                      ? d.excluded.map((name) => t(`skillTranslations.${name}`, { defaultValue: name })).join(", ")
                      : null
                  const matchedNames =
                    d.matched && d.matched.length > 0
                      ? d.matched
                          .map((full) => {
                            const base = full.split(" Lv.")[0]
                            return t(`skillTranslations.${base}`, { defaultValue: base })
                          })
                          .join(", ")
                      : null
                  return (
                    <div key={d.key} className='mb-1'>
                      <span className='font-mono text-xs text-gray-400'>
                        {t("amuletDetailsExtra.groupLineWithCounts", { group: d.group, counts })}{" "}
                        <span className='ml-1'>{t("amuletDetailsExtra.matchedLabel2", "個技能")}</span>
                        {translatedExcluded ? `    ${t("amuletDetailsExtra.excludedLabel", { items: translatedExcluded })}` : ""}
                        {matchedNames ? ` — ${t("amuletDetailsExtra.matchedLabel", { items: matchedNames })}` : ""}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className='items-center gap-2 text-xs sm:text-sm'>
        <span className='font-semibold text-gray-400 text-nowrap'>技能機率</span>{" "}
        <span className='font-bold text-yellow-500'>{fmt(computed.finalNoSlot)}</span>
        <div>
          <span className='font-mono text-xs text-gray-400 break-words'>
            {`${fmtDecimal(computed.baseProb)} * ${fmtDecimal(computed.charmTypeProb)} * ${fmtDecimal(computed.groupProb)}   `}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`w-full xl:w-auto   ${className}`}>
      {/* 小屏幕使用 Collapsible 折疊功能 */}
      <div className='block sm:hidden'>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className='flex items-center justify-center w-full px-4 py-2 text-sm text-white transition-colors bg-gray-700 rounded-md hover:bg-gray-600'>
            <span className='mr-2'>{isExpanded ? t("common.hideDetails", "隱藏詳情") : t("common.showDetails", "顯示詳情")}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </CollapsibleTrigger>
          <CollapsibleContent className='mt-4'>
            <SlotList charm={charm} t={t} />
            <div className='w-full p-3 bg-black rounded-md shadow-sm sm:p-4 xl:w-auto 2xl:w-80'>
              <DetailsContent />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* 大屏幕直接顯示 */}
      <div className='hidden sm:block'>
        <div className='w-full p-3 bg-black rounded-md shadow-sm sm:p-4 xl:w-auto 2xl:w-80'>
          <DetailsContent />
        </div>
      </div>
    </div>
  )
}
