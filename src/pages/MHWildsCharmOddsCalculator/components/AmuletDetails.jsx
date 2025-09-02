import React from "react"

export default function AmuletDetails({ charm, t }) {
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
    if (typeof v === "number") return `${v} (${(v * 100).toFixed(2)}%)`
    return String(v)
  }

  return (
    <div className='p-4 bg-white rounded-md shadow-sm'>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center gap-2 text-sm'>
          <span className='font-semibold text-gray-600'>{t("amuletDetails.baseProb")}</span>
          <span className='text-gray-900'>{fmt(computed.baseProb ?? charm?.baseProbability)}</span>
        </div>

        <div className='flex items-center gap-2 text-sm'>
          <span className='font-semibold text-gray-600'>{t("amuletDetails.charmTypeProb")}</span>
          <span className='text-gray-900'>{fmt(computed.charmTypeProb)}</span>
        </div>

        <div className='flex flex-col text-sm'>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-gray-600'>{t("amuletDetails.groupProb")}</span>
            <span className='text-gray-900'>{fmt(computed.groupProb)}</span>
          </div>
          {groupInfo ? (
            <>
              <div className='mt-1 font-mono text-xs text-gray-700 break-words'>{groupInfo.formula}</div>
              <div className='mt-1 text-xs text-gray-600'>
                {groupInfo.details.map((d) => {
                  const counts = d.total === d.available ? `${d.available}` : `${d.total} -> ${d.available}`
                  const translatedExcluded =
                    d.excluded && d.excluded.length > 0
                      ? d.excluded.map((name) => t(`skillTranslations.${name}`, { defaultValue: name })).join(", ")
                      : null
                  return (
                    <div key={d.key} className='mb-1'>
                      <span className='font-mono text-xs text-gray-700'>
                        {t("amuletDetailsExtra.groupLineWithCounts", { group: d.group, counts })}
                        {translatedExcluded ? `    ${t("amuletDetailsExtra.excludedLabel", { items: translatedExcluded })}` : ""}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}
        </div>

        <div className='flex items-center gap-2 text-sm'>
          <span className='font-semibold text-gray-600'>{t("amuletDetails.slotProb")}</span>
          <span className='text-gray-900'>{fmt(computed.SlotProb)}</span>
        </div>
      </div>

      {/* Add more details as needed */}
    </div>
  )
}
