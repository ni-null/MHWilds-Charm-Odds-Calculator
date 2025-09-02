import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import SkillGroupsData from "../../data/SkillGroups.json"
import useMhwStore from "../../store/mhwStore"
import AmuletDetails from "./components/AmuletDetails"

export default function AmuletList() {
  const { AvlCharms } = useMhwStore()
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    console.log(AvlCharms)
  }, [AvlCharms])

  const charms = Array.isArray(AvlCharms) ? AvlCharms : []

  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
        "<rect fill='%23efefef' width='100%' height='100%'/>" +
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23999'>?" +
        "</text></svg>"
    )

  const rarityColorMap = {
    "RARE[8]": "text-orange-600",
    "RARE[7]": "text-purple-600",
    "RARE[6]": "text-blue-800",
    "RARE[5]": "text-green-600",
  }

  function AmuletListView() {
    const { t, i18n } = useTranslation()

    return (
      <div>
        <div className='p-6 mb-6 bg-white rounded-lg'>
          <h2 className='text-2xl font-semibold'>
            {t ? t("amulet.listTitle") : "可用護符"} ({charms.length})
          </h2>
        </div>

        <div className='p-6 bg-white rounded-lg'>
          <ul>
            {charms.map((charm, idx) => {
              const key = `${charm.rarity || "unknown"}-${idx}`
              const rarityClass = rarityColorMap[charm.rarity] || "text-gray-800"
              const groups = Array.isArray(charm.groups) ? charm.groups : []
              const matchingSkills = Array.isArray(charm.matchingSkills) ? charm.matchingSkills : []

              return (
                <React.Fragment key={key}>
                  <li className='flex flex-col items-start justify-between gap-4 px-2 py-4 border-b md:flex-row md:items-center md:gap-6'>
                    <div className='flex flex-col'>
                      <div className='flex items-center min-w-[140px] mb-2 md:mb-0 md:mr-4'>
                        <img
                          src={`${import.meta.env.BASE_URL}image/Charm/${encodeURIComponent(charm.rarity || "unknown")}.png`}
                          alt={charm.rarity}
                          style={{ width: 40, height: 40, objectFit: "contain" }}
                          className='mr-2 rounded'
                          onError={(e) => {
                            try {
                              if (!e || !e.currentTarget) return
                              e.currentTarget.style.display = "none"
                            } catch (err) {
                              console.debug("img onError hide failed", err)
                            }
                          }}
                        />
                        <div className='flex flex-col'>
                          <div className={`text-lg font-semibold ${rarityClass}`}>{charm.rarity}</div>
                          <div className='text-xs text-gray-600'>
                            {matchingSkills.length} {t ? t("amulet.matchingSkills") : "匹配技能"}
                          </div>
                        </div>
                      </div>
                      {/*顯示 最終機率 finalNoSlot */}
                      <div className='text-sm text-gray-500'>
                        {(() => {
                          // `raw` is a decimal probability (0..1). Format as percent by *100.
                          const raw = charm && charm.computed && (charm.computed.finalNoSlot || 0)
                          // resolve i18n language key to a BCP47 locale for Intl.NumberFormat
                          const lng = (i18n && i18n.language) || (typeof navigator !== "undefined" && navigator.language) || undefined
                          const langMap = { enUS: "en-US", zhTW: "zh-TW", zhCN: "zh-CN", jaJP: "ja-JP" }
                          const locale = langMap[lng] || lng || undefined
                          // format number with up to 3 decimal places, but trim trailing zeros
                          const nf = new Intl.NumberFormat(locale, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 8,
                          })
                          const formatted = nf.format(Number(raw * 100))
                          // compute 1/odds display. raw is a probability (e.g. 0.000101 for 0.0101%)
                          let oddsDisplay = "0"
                          try {
                            const chance = Number(raw)
                            if (chance > 0) {
                              const odds = Math.round(1 / chance) // invert the decimal probability
                              const of = new Intl.NumberFormat(locale).format(odds)
                              oddsDisplay = of
                            } else {
                              oddsDisplay = "∞"
                            }
                          } catch {
                            oddsDisplay = "?"
                          }

                          return t ? t("amulet.finalOdds", { pct: formatted, odds: oddsDisplay }) : `最終機率: ${formatted}% (1/${oddsDisplay})`
                        })()}
                      </div>
                      {/*顯示 技能+插槽機率最終機率 finalWithSlot */}
                    </div>

                    <div className='flex-1'>
                      <div className='mb-2 text-base'>
                        <span className='font-medium'>{t ? t("amulet.skillGroups") : "技能群組"}:</span>
                        <span className='ml-2'>
                          {groups.map((g, i) => {
                            const groupKey = `Group${g}`
                            const gd = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || {}
                            const bg = gd.bgColor || "#6b7280"
                            const text = gd.color || "#ffffff"
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

                      <div className='mb-2 text-base'>
                        <span className='font-medium'>{t ? t("amulet.matchingSkills") : "匹配技能"}:</span>
                        <span className='ml-2'>
                          {matchingSkills.length === 0 && <span className='ml-2 text-sm text-gray-500'>{t ? t("common.none") : "無"}</span>}

                          {/*
                            Render matching skills grouped by the charm's `groups` order (preserve duplicates).
                            We assign skills to each group occurrence in order, removing assigned skills so
                            duplicate group numbers get distinct assignments when possible.
                          */}
                          {matchingSkills.length > 0 &&
                            (() => {
                              const skillsByGroup = []
                              const remaining = matchingSkills.slice()

                              for (let gi = 0; gi < groups.length; gi++) {
                                const gnum = groups[gi]
                                const groupKey = `Group${gnum}`
                                const gd = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || null
                                if (!gd || !Array.isArray(gd.data)) {
                                  skillsByGroup.push([])
                                  continue
                                }

                                const assigned = []
                                // iterate remaining and assign those that belong to this group's skill set
                                for (let ri = remaining.length - 1; ri >= 0; ri--) {
                                  const sk = remaining[ri]
                                  const found = gd.data.find((skObj) => `${skObj.SkillName} Lv.${skObj.SkillLevel}` === sk)
                                  if (found) {
                                    assigned.push(sk)
                                    remaining.splice(ri, 1)
                                  }
                                }
                                assigned.reverse()
                                skillsByGroup.push(assigned)
                              }

                              // any skills not assigned to explicit group occurrences go to a fallback bucket
                              if (remaining.length > 0) skillsByGroup.push(remaining.slice())

                              return skillsByGroup.map((groupSkills, gi) =>
                                groupSkills.map((skillKey, si) => {
                                  const skillBase = String(skillKey).split(" Lv.")[0]
                                  const skillLevel = String(skillKey).includes(" Lv.") ? String(skillKey).split(" Lv.")[1] : null
                                  const imgSrc = `${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skillBase.replace(/\//g, "-"))}.png`
                                  let displayName = skillKey
                                  try {
                                    const translated = t ? t(`skillTranslations.${skillBase}`, skillBase) : skillBase
                                    displayName = skillLevel ? `${translated} ${t ? t("common.level") : "Lv."}${skillLevel}` : translated
                                  } catch {
                                    displayName = skillKey
                                  }

                                  // determine group meta: if gi corresponds to a real group index use that group's meta
                                  let matchMeta = null
                                  if (gi < groups.length) {
                                    const groupNumber = groups[gi]
                                    const groupKey = `Group${groupNumber}`
                                    matchMeta = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || null
                                  }

                                  const bgColor = (matchMeta && matchMeta.bgColor) || "#eaeaea"
                                  const textColor = (matchMeta && matchMeta.color) || "#111"

                                  return (
                                    <span
                                      key={`${gi}-${si}`}
                                      className='inline-flex items-center gap-1 mt-2 px-2 py-0.5 ml-2 text-base rounded whitespace-nowrap'
                                      style={{ backgroundColor: bgColor, color: textColor, fontWeight: "600" }}>
                                      <img
                                        src={imgSrc}
                                        alt={skillBase}
                                        style={{ width: 22, height: 22, objectFit: "contain" }}
                                        onError={(e) => {
                                          try {
                                            if (!e || !e.currentTarget) return
                                            const el = e.currentTarget
                                            if (el.src && el.src.indexOf("data:image/svg+xml") === -1) el.src = SKILL_PLACEHOLDER_SVG
                                          } catch (err) {
                                            console.debug("skill img onError", err)
                                          }
                                        }}
                                      />
                                      {displayName}
                                    </span>
                                  )
                                })
                              )
                            })()}
                        </span>
                      </div>
                    </div>

                    <div className='flex flex-col items-end md:items-end min-w-[80px] mt-2 md:mt-0 md:ml-4'>
                      <button
                        className='px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50'
                        onClick={() => setExpandedId(expandedId === key ? null : key)}>
                        {expandedId === key ? (t ? t("common.collapse") : "收合") : t ? t("common.details") : "詳細"}
                      </button>
                    </div>
                  </li>
                  {expandedId === key && <AmuletDetails charm={charm} t={t} />}
                </React.Fragment>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }

  if (!charms || charms.length === 0) return null

  return <AmuletListView />
}
