import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import SkillGroupsData from "../../data/SkillGroups.json"
import useMhwStore from "../../store/mhwStore"
import AmuletDetails from "./components/AmuletDetails"

export default function AmuletList() {
  const { AvlCharms } = useMhwStore()
  const [_expandedId, _setExpandedId] = useState(null)

  useEffect(() => {
    console.log(AvlCharms)
  }, [AvlCharms])

  const charms = Array.isArray(AvlCharms) ? AvlCharms : []

  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'>" +
        "<rect fill='%23efefef' width='100%' height='100%'/>" +
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23999'>?" +
        "</text></svg>"
    )

  const _rarityColorMap = {
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

        <div className=''>
          <ul>
            {charms.map((charm, idx) => {
              const key = `${charm.rarity || "unknown"}-${idx}`
              const groups = Array.isArray(charm.groups) ? charm.groups : []
              const matchingSkills = Array.isArray(charm.matchingSkills) ? charm.matchingSkills : []

              return (
                <React.Fragment key={key}>
                  <li className=' flex flex-col  bg-[#251d12] px-6  my-10  text-white rounded-lg    items-start justify-between gap-4   py-4 border-b md:flex-row md:items-center md:gap-6'>
                    <div className='flex flex-row'>
                      <div className='flex flex-col flex-1 p-5 text-white rounded-lg '>
                        <div className='flex items-center min-w-[140px]  mb-2 md:mb-0 md:mr-4'>
                          <div className='flex flex-col items-center justify-center mr-3'>
                            <img
                              src={`${import.meta.env.BASE_URL}image/Charm/${encodeURIComponent(charm.rarity || "unknown")}.png`}
                              alt={charm.rarity}
                              style={{ width: 56, height: 56, objectFit: "contain" }}
                              className='rounded'
                              onError={(e) => {
                                try {
                                  if (!e || !e.currentTarget) return
                                  e.currentTarget.style.display = "none"
                                } catch (err) {
                                  console.debug("img onError hide failed", err)
                                }
                              }}
                            />
                            <div className='mt-1 text-base font-medium'>{charm.rarity}</div>
                          </div>

                          {/* 顯示匹配的技能名稱與等級方塊（參考 UI 排版與配色） */}
                          <div className='flex flex-col gap-1 ml-2'>
                            {matchingSkills.length === 0 ? (
                              <span className='text-sm text-gray-500'>{t ? t("common.none") : "無"}</span>
                            ) : (
                              matchingSkills.map((sk, si) => {
                                const skillBase = String(sk).split(" Lv.")[0]
                                const skillLevel = String(sk).includes(" Lv.") ? Number(String(sk).split(" Lv.")[1]) : 0

                                // 在 SkillGroupsData 中尋找對應的 skill meta（SkillMax, color）
                                let meta = null
                                if (SkillGroupsData && SkillGroupsData.SkillGroups) {
                                  for (const gk of Object.keys(SkillGroupsData.SkillGroups)) {
                                    const group = SkillGroupsData.SkillGroups[gk]
                                    if (!group || !Array.isArray(group.data)) continue
                                    const found = group.data.find((o) => o.SkillName === skillBase)
                                    if (found) {
                                      meta = found
                                      break
                                    }
                                  }
                                }

                                const maxSlots = (meta && Number(meta.SkillMax)) || 3 // 預設 3 個方塊較貼近畫面範例
                                const fillColor = (meta && meta.color) || "#d97706" // 若無則用暖色（接近範例）
                                const emptyColor = "#6a6a6a" // 淺灰背景
                                const imgSrc = `${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skillBase.replace(/\//g, "-"))}.png`

                                return (
                                  <div key={`${si}-${skillBase}`} className='flex items-center gap-3'>
                                    <img
                                      src={imgSrc}
                                      alt={skillBase}
                                      style={{ width: 36, height: 36, objectFit: "contain" }}
                                      className='flex-shrink-0 rounded'
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

                                    <div className='flex-1 min-w-0'>
                                      <div className='flex items-center justify-between'>
                                        <div className='text-base font-medium truncate' title={skillBase}>
                                          {t ? t(`skillTranslations.${skillBase}`, skillBase) : skillBase}
                                        </div>
                                        <div
                                          className={`ml-2 text-sm ${
                                            skillLevel > 0 && maxSlots && skillLevel === maxSlots ? "text-yellow-400 font-semibold" : "text-gray-500"
                                          }`}>
                                          {skillLevel > 0 ? `${t ? t("common.level") : "Lv."}${skillLevel}` : ""}
                                        </div>
                                      </div>

                                      <div className='flex items-center mt-1' aria-hidden>
                                        {Array.from({ length: maxSlots }).map((_, i2) => (
                                          <span
                                            key={i2}
                                            title={i2 < skillLevel ? (t ? t("common.filled") : "filled") : t ? t("common.empty") : "empty"}
                                            style={{
                                              width: 16,
                                              height: 16,
                                              borderRadius: 3,
                                              display: "inline-block",
                                              marginRight: 6,
                                              backgroundColor: i2 < skillLevel ? fillColor : emptyColor,
                                              boxShadow: i2 < skillLevel ? "inset 0 -1px 0 rgba(0,0,0,0.15)" : "none",
                                              border: "1px solid rgba(0,0,0,0.06)",
                                            }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>

                        {/*顯示 最終機率 finalNoSlot */}
                        <div className='mt-5 text-2xl font-bold text-gray-500'>
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
                      </div>

                      {/* 顯示組別 和 組別可能存在的插槽組合圖示 (使用 charm.AllslotKey) */}
                      <div className='flex flex-col items-start gap-4 ml-4 md:flex-row'>
                        <div className='flex flex-col'>
                          <div className='mb-2 text-base'>
                            <span className='font-medium'>{t ? t("amulet.skillGroups") : "技能群組"}:</span>
                          </div>
                          <div className='flex flex-wrap gap-2 md:flex-col'>
                            {groups.map((g, i) => {
                              const groupKey = `Group${g}`
                              const gd = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || {}
                              const bg = gd.bgColor || "#374151"
                              const text = gd.color || "#ffffff"

                              return (
                                <div
                                  key={i}
                                  className='inline-flex items-center gap-2 px-2 py-1 text-sm rounded'
                                  style={{ backgroundColor: bg, color: text }}>
                                  <span className='font-semibold'>G{g}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div className='flex flex-col'>
                          <div className='mb-2 text-base'>
                            <span className='font-medium'>{t ? t("amulet.slotCombos") : "插槽組合"}:</span>
                          </div>
                          <div className='flex flex-col gap-2'>
                            {Array.isArray(charm.AllslotKey) && charm.AllslotKey.length > 0 ? (
                              charm.AllslotKey.map((slotKey, si) => {
                                // Build image sources similar to SkillSelector: parse each slotKey and map
                                // numeric sizes -> image/slot/{1..3}.png, W* markers -> image/slot/W1.png
                                const slotImgSrcs = []
                                let display = String(slotKey)
                                try {
                                  const arr = typeof slotKey === "string" ? JSON.parse(slotKey) : slotKey
                                  if (Array.isArray(arr)) {
                                    display = `[${arr.join(", ")}]`
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
                                  if (typeof slotKey === "string" && slotKey.indexOf("W") !== -1) {
                                    slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                                  } else if (!isNaN(Number(slotKey))) {
                                    const idx = Math.min(Math.max(1, Number(slotKey)), 3)
                                    slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${idx}.png`)
                                  }
                                }

                                return (
                                  <div key={si} className='inline-flex items-center gap-2'>
                                    {slotImgSrcs.length > 0 ? (
                                      <div className='flex items-center gap-1'>
                                        {slotImgSrcs.map((src, idx) => (
                                          <img
                                            key={`${si}-${idx}`}
                                            src={src}
                                            alt='slot'
                                            className='object-contain w-6 h-6'
                                            onError={(e) => {
                                              try {
                                                if (!e || !e.currentTarget) return
                                                e.currentTarget.style.display = "none"
                                              } catch {
                                                /* ignore */
                                              }
                                            }}
                                          />
                                        ))}
                                      </div>
                                    ) : null}
                                    <span className='text-sm text-gray-200'>{display}</span>
                                  </div>
                                )
                              })
                            ) : (
                              <span className='ml-2 text-sm text-gray-400'>{t ? t("common.none") : "無"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <AmuletDetails charm={charm} t={t} />
                  </li>
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
