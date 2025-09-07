import React, { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
// Amulet data migrated into RarityBaseProbability.json (Group + combinationCount)
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import { useLanguageSync } from "../../hooks/useLanguageSync"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import CharmSkillsDialogContent from "./CharmSkillsDialogContent"
import skillGroupsData from "../../data/SkillGroups.json"
import rarityProbabilities from "../../data/Rarity.json"
import { Button } from "@/components/ui/button"
import * as Tooltip from "@radix-ui/react-tooltip"
const CharmTypePage = () => {
  const { t } = useTranslation()
  useLanguageSync() // 同步語言設置
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 翻譯技能名稱的函數（複用 SkillGroups 頁面的邏輯）
  const getSkillTranslation = React.useCallback(
    (skillName) => {
      const translation = t(`skillTranslations.${skillName}`)
      return translation !== `skillTranslations.${skillName}` ? translation : skillName
    },
    [t]
  )

  const getGroupTranslation = React.useCallback(
    (groupKey) => {
      const groupNumber = groupKey.toLowerCase()
      const translation = t(`skillGroups.${groupNumber}`)
      return translation !== `skillGroups.${groupNumber}` ? translation : groupKey
    },
    [t]
  )

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // 護石種類分析
  const charmAnalysis = useMemo(() => {
    const rarityGroups = {}
    const slotCombinations = new Set()
    const raritySlotMap = {}

    Object.entries(rarityProbabilities).forEach(([rarity, data]) => {
      const groups = data.Group || []
      rarityGroups[rarity] = groups.map((g) => {
        // build slot combinations for this group (per-charm)
        const slotSet = new Set()
        const gSlotObj = (g && g.slot) || {}
        Object.keys(gSlotObj).forEach((k) => {
          try {
            const arr = JSON.parse(k)
            const key = Array.isArray(arr) ? arr.join("-") : String(arr)
            slotSet.add(key)
          } catch {
            slotSet.add(k)
          }
        })

        const slotCombinations = Array.from(slotSet)
          .sort()
          .map((k) => {
            const parts = String(k).split("-")
            return `[${parts.join(", ")}]`
          })

        return {
          Rarity: rarity,
          Skill1Group: g.skills && g.skills[0] ? g.skills[0] : null,
          Skill2Group: g.skills && g.skills[1] ? g.skills[1] : null,
          Skill3Group: g.skills && g.skills[2] ? g.skills[2] : null,
          combinationCount: g.combinationCount || 0,
          slotCombinations,
        }
      })

      // collect slot combinations from group-level slot definitions
      const rarityGroupsArr = data.Group || []
      if (rarityGroupsArr.length) {
        const raritySlotSet = new Set()
        rarityGroupsArr.forEach((g) => {
          const gSlotObj = (g && g.slot) || {}
          Object.keys(gSlotObj).forEach((k) => {
            try {
              const arr = JSON.parse(k)
              const key = Array.isArray(arr) ? arr.join("-") : k
              slotCombinations.add(key)
              raritySlotSet.add(key)
            } catch {
              slotCombinations.add(k)
              raritySlotSet.add(k)
            }
          })
        })
        raritySlotMap[rarity] = Array.from(raritySlotSet).sort()
      }

      // collect skill groups (kept for future use if needed)
      // const skills = g.skills || []
    })

    // total charms = sum of group entries
    const totalCharms = Object.values(rarityGroups).reduce((s, arr) => s + arr.length, 0)

    return {
      rarityGroups,
      slotCombinations: Array.from(slotCombinations).sort(),
      raritySlotMap,
      // totalSkillGroups removed (unused)
      totalCharms,
    }
  }, [])

  // prepare rarity entries with total combos and base probability
  const rarityEntries = Object.entries(charmAnalysis.rarityGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rarity, charms]) => {
      const totalCombos = charms.reduce((s, c) => s + (c.combinationCount || 0), 0)
      const probEntry = rarityProbabilities[rarity]
      const prob = probEntry && typeof probEntry === "object" ? probEntry.probability : probEntry
      const formattedTotalCombos = (totalCombos || 0).toLocaleString()
      const formattedProbPct = typeof prob !== "undefined" && prob !== null ? `${Math.round(Number(prob) * 100)}%` : null

      return {
        rarity,
        charms,
        totalCombos,
        prob,
        formattedTotalCombos,
        formattedProbPct,
      }
    })

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <div className={`flex flex-col flex-1 xl:ml-64 w-full ${isSidebarOpen ? "ml-64" : ""}`}>
        <Header onMenuToggle={handleSidebarToggle} title={t("charmTypes.title")} />
        <main className='flex-1 p-6'>
          <div className='container mx-auto max-w-9xl'>
            {/* 頁面標題和統計 */}
            <div className='mb-8'>
              <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 xl:block'>{t("charmTypes.title")}</h1>
              <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
                <div className='p-4 text-center bg-white rounded-lg shadow'>
                  <div className='text-2xl font-bold text-blue-600'>{charmAnalysis.totalCharms}</div>
                  <div className='text-gray-600'>{t("charmTypes.stats.totalCharms")}</div>
                </div>
                <div className='p-4 text-center bg-white rounded-lg shadow'>
                  <div className='text-2xl font-bold text-green-600'>{Object.keys(charmAnalysis.rarityGroups).length}</div>
                  <div className='text-gray-600'>{t("charmTypes.stats.rarities")}</div>
                </div>
                <div className='p-4 text-center bg-white rounded-lg shadow'>
                  <div className='text-2xl font-bold text-purple-600'>{charmAnalysis.slotCombinations.length}</div>
                  <div className='text-gray-600'>{t("charmTypes.stats.slotCombinations")}</div>
                </div>
              </div>
            </div>

            <div className='p-4 mb-6 bg-white border border-gray-200 rounded-lg'>
              <h3 className='mb-1 font-semibold text-gray-800'>{t("charmTypes.notes.title")}</h3>
              <p className='text-gray-600 '>{t("charmTypes.notes.rareSame")}</p>
              <p className='text-gray-600 '>{t("charmTypes.notes.rare8FirstSlot")}</p>
            </div>

            {/* 護石種類展示 */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {rarityEntries.map((entry) => {
                const { rarity, charms, formattedTotalCombos, formattedProbPct } = entry

                // prepare display for default normalslot from data/Rarity.json
                const normalslotObj = (rarityProbabilities[rarity] && rarityProbabilities[rarity].normalslot) || null
                let normalslotEntries = []
                if (normalslotObj) {
                  const base = normalslotObj && typeof normalslotObj.slot === "object" ? normalslotObj.slot : normalslotObj
                  normalslotEntries = Object.keys(base || {}).map((k) => {
                    let label = k
                    let icons = []
                    try {
                      const parsed = JSON.parse(k)
                      if (Array.isArray(parsed)) {
                        label = `[${parsed.join(", ")}]`
                        icons = parsed.filter((v) => v !== null && typeof v !== "object").map((v) => String(v))
                      } else {
                        label = String(parsed)
                        icons = [String(parsed)]
                      }
                    } catch {
                      // keep original key and try to extract tokens
                      label = k
                      const matches = k.match(/W1|\d+/g)
                      icons = matches || []
                    }

                    const prob = base[k]
                    const pct = typeof prob !== "undefined" && prob !== null ? `${Math.round(Number(prob) * 100)}%` : null

                    // normalize icons to filenames like 1.png, 2.png, 3.png, W1.png
                    const iconNames = icons.map((ic) => `${ic}.png`)

                    return {
                      key: k,
                      label,
                      pct,
                      icons: iconNames,
                    }
                  })
                }

                // build a set of default normal slot labels for easy comparison with individual charms
                const normalslotLabelsSet = new Set((normalslotEntries || []).map((e) => String(e.label)))

                return (
                  <div key={rarity} className='bg-white border border-gray-200 rounded-lg shadow-lg'>
                    <div className='p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'>
                      <div className='flex justify-center mb-5'>
                        <div className='flex items-center'>
                          <img
                            src={`${import.meta.env.BASE_URL}image/Charm/${encodeURIComponent(rarity)}.png`}
                            alt={rarity}
                            style={{ width: 40, height: 40, objectFit: "contain" }}
                            className='mr-2 rounded'
                            onError={(e) => {
                              try {
                                if (!e || !e.currentTarget) return
                                const el = e.currentTarget
                                el.style.display = "none"
                              } catch {
                                /* swallow */
                              }
                            }}
                          />

                          <h2 className='text-xl font-bold text-purple-700'>{rarity}</h2>
                        </div>
                      </div>
                      <p className='text-gray-600 '>{t("charmTypes.charmsCount", { count: charms.length })}</p>
                      <p className='text-gray-600 '>{t("charmTypes.header.totalCombos", { count: formattedTotalCombos })}</p>
                      {formattedProbPct && <p className='text-gray-600 '>{t("charmTypes.header.baseProbability", { pct: formattedProbPct })}</p>}
                      {/* 顯示 src/data/Rarity.json 內預設 normalslot 插槽 */}
                      {normalslotEntries && normalslotEntries.length > 0 && (
                        <div className='mt-2 text-sm text-gray-700'>
                          <div className='mb-1'>
                            {t("charmTypes.header.defaultNormalSlot") &&
                            t("charmTypes.header.defaultNormalSlot") !== "charmTypes.header.defaultNormalSlot"
                              ? t("charmTypes.header.defaultNormalSlot")
                              : "Default normal slots"}
                            :
                          </div>
                          <div className='flex flex-wrap items-center gap-2'>
                            {normalslotEntries.map((e) => (
                              <Tooltip.Provider key={e.key}>
                                <Tooltip.Root>
                                  <Tooltip.Trigger asChild>
                                    <div className='flex items-center px-2 py-1 rounded cursor-default bg-gray-50'>
                                      <div className='flex items-center mr-2'>
                                        {e.icons && e.icons.length > 0
                                          ? e.icons.map((ic, idx) => (
                                              <img
                                                key={idx}
                                                src={`${import.meta.env.BASE_URL}image/slot/${encodeURIComponent(ic)}`}
                                                alt={e.label}
                                                style={{ width: 20, height: 20 }}
                                                className={idx < e.icons.length - 1 ? "mr-1" : ""}
                                              />
                                            ))
                                          : null}
                                      </div>
                                      <div className='text-xs text-gray-600'>
                                        <span>{e.pct && <span className='ml-1 text-xs text-gray-400'>({e.pct})</span>}</span>
                                      </div>
                                    </div>
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content side='top' align='center' className='px-2 py-1 text-xs text-white bg-gray-800 rounded'>
                                      {t(`slotLabels.${e.key}`) && t(`slotLabels.${e.key}`) !== `slotLabels.${e.key}`
                                        ? t(`slotLabels.${e.key}`)
                                        : e.label}
                                      <Tooltip.Arrow className='text-gray-800 fill-current' />
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              </Tooltip.Provider>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className='p-4'>
                      <div className='space-y-2'>
                        {charms.map((charm, index) => {
                          const comboCount = charm.combinationCount
                          const formattedComboCount = (comboCount || 0).toLocaleString()

                          // prepare slot combinations display for this charm and icons for each combination
                          const charmSlotsArr = charm.slotCombinations || []

                          // parse each slot label into { rawKey, label, icons: ["1.png", ...] }
                          const charmSlotTuples = (charmSlotsArr || []).map((s) => {
                            let label = String(s)
                            let icons = []
                            // build a list of candidate keys to try for translation lookup so it matches group tooltip behavior
                            let rawKeyCandidates = [String(s)]
                            try {
                              const parsed = JSON.parse(s)
                              if (Array.isArray(parsed)) {
                                label = `[${parsed.join(", ")}]`
                                icons = parsed.filter((v) => v !== null && typeof v !== "object").map((v) => `${v}.png`)
                                rawKeyCandidates.push(parsed.join("-"))
                                rawKeyCandidates.push(JSON.stringify(parsed))
                              } else {
                                label = String(parsed)
                                icons = [String(parsed) + ".png"]
                                rawKeyCandidates.push(String(parsed))
                              }
                            } catch {
                              // fallback: extract tokens like W1 or digits and try those as keys
                              const matches = String(s).match(/W1|\d+/g) || []
                              icons = matches.map((m) => `${m}.png`)
                              if (matches.length) rawKeyCandidates.push(matches.join("-"))
                            }

                            // also add variants without spaces/brackets to increase match chance
                            rawKeyCandidates = rawKeyCandidates.concat(rawKeyCandidates.map((k) => String(k).replace(/\s+/g, "")))
                            // dedupe while preserving order
                            rawKeyCandidates = Array.from(new Set(rawKeyCandidates))

                            return { rawKeyCandidates, label, icons }
                          })

                          // only show charm slot combinations when they are different from the rarity's default normal slots
                          const slotMatchesDefault =
                            charmSlotsArr.length > 0 && normalslotEntries.length > 0 && charmSlotsArr.every((s) => normalslotLabelsSet.has(String(s)))
                          const showCharmSlot = charmSlotsArr.length > 0 && !slotMatchesDefault

                          return (
                            <Dialog key={index}>
                              <DialogTrigger asChild>
                                <div className='p-3 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100'>
                                  <div className='mb-2 font-medium text-gray-800'>
                                    {t("charmTypes.labels.skillGroups")}:{" "}
                                    {[charm.Skill1Group, charm.Skill2Group, charm.Skill3Group]
                                      .filter((g) => g !== null)
                                      .map((g, idx) => {
                                        const groupKey = typeof g === "number" ? `Group${g}` : `${g}`
                                        const gd = (skillGroupsData.SkillGroups && skillGroupsData.SkillGroups[groupKey]) || {}

                                        return (
                                          <span
                                            key={`${groupKey}-${idx}`}
                                            className='inline-block px-2 py-0.5 mr-1 font-medium rounded'
                                            style={{ backgroundColor: gd.bgColor, color: gd.Color }}>
                                            {g}
                                          </span>
                                        )
                                      })}
                                  </div>
                                  {/* slot combinations moved to rarity header (shown once) */}
                                  <div className='mt-2 text-gray-700'>
                                    {t("charmTypes.labels.combinationCount")}: <span className='font-semibold'>{formattedComboCount}</span>
                                  </div>
                                  {showCharmSlot && charmSlotTuples && charmSlotTuples.length > 0 && (
                                    <div className='mt-1 text-sm text-gray-600'>
                                      {t("charmTypes.header.slotCombinations")
                                        ? t("charmTypes.header.slotCombinations") + ": "
                                        : "Slot combinations: "}
                                      <div className='flex flex-wrap items-center gap-2 mt-1'>
                                        {charmSlotTuples.map((cs, ci) => (
                                          <Tooltip.Provider key={`${ci}-${cs.label}`}>
                                            <Tooltip.Root>
                                              <Tooltip.Trigger asChild>
                                                <div className='inline-flex items-center px-2 py-1 rounded cursor-default bg-gray-50'>
                                                  {cs.icons && cs.icons.length > 0
                                                    ? cs.icons.map((ic, idx) => (
                                                        <img
                                                          key={idx}
                                                          src={`${import.meta.env.BASE_URL}image/slot/${encodeURIComponent(ic)}`}
                                                          alt={cs.label}
                                                          style={{ width: 18, height: 18 }}
                                                          className={idx < cs.icons.length - 1 ? "mr-1" : ""}
                                                        />
                                                      ))
                                                    : null}
                                                  <span className='ml-1 text-xs text-gray-600'>{cs.label}</span>
                                                </div>
                                              </Tooltip.Trigger>
                                              <Tooltip.Portal>
                                                <Tooltip.Content
                                                  side='top'
                                                  align='center'
                                                  className='px-2 py-1 text-xs text-white bg-gray-800 rounded'>
                                                  {/* try multiple candidate keys to match group tooltip lookup */}
                                                  {(() => {
                                                    const candidates = cs.rawKeyCandidates || []
                                                    for (let i = 0; i < candidates.length; i++) {
                                                      const key = candidates[i]
                                                      const trans = t(`slotLabels.${key}`)
                                                      if (trans && trans !== `slotLabels.${key}`) return trans
                                                    }
                                                    return cs.label
                                                  })()}
                                                  <Tooltip.Arrow className='text-gray-800 fill-current' />
                                                </Tooltip.Content>
                                              </Tooltip.Portal>
                                            </Tooltip.Root>
                                          </Tooltip.Provider>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogTrigger>

                              <DialogContent className='w-full max-w-4xl'>
                                <DialogHeader>
                                  <DialogTitle>
                                    {t("charmTypes.dialog.title") !== "charmTypes.dialog.title"
                                      ? t("charmTypes.dialog.title")
                                      : getSkillTranslation("Select skills")}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {t("charmTypes.dialog.description") !== "charmTypes.dialog.description"
                                      ? t("charmTypes.dialog.description")
                                      : getSkillTranslation("Choose one skill per group for this charm")}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className='space-y-4'>
                                  <CharmSkillsDialogContent
                                    charm={charm}
                                    getSkillTranslation={getSkillTranslation}
                                    getGroupTranslation={getGroupTranslation}
                                    t={t}
                                  />
                                </div>

                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button className=''>{t("actions.close") !== "actions.close" ? t("actions.close") : "Close"}</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CharmTypePage
