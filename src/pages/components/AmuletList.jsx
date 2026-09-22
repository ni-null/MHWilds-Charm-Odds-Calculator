import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { motion as Motion } from "framer-motion"
import { Star, Trash2 } from "lucide-react"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import rarityBaseProbability from "../../data/Rarity.json"
import { decimalToFraction } from "../../lib/fractionUtils"
import useMhwStore from "../../store/mhwStore"
import AmuletDetails from "../MHWildsCharmOddsCalculator/components/AmuletDetails"
import CharmDisplay from "../MHWildsCharmOddsCalculator/components/CharmDisplay"
import SkillSelector from "../MHWildsCharmOddsCalculator/components/SkillSelector"
import SlotList from "../MHWildsCharmOddsCalculator/components/SlotList"

export default function AmuletList({ charms: propCharms, favoriteCharms: propFavoriteCharms }) {
  const { amuletListShowMode, setFavoriteCharms, setAmuletListShowMode } = useMhwStore()

  const charms = useMemo(() => (Array.isArray(propCharms) ? propCharms : []), [propCharms])
  const favoriteCharms = propFavoriteCharms || []

  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'>" +
      "<rect fill='%23efefef' width='100%' height='100%'/>" +
      "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23999'>?" +
      "</text></svg>"
    )

  const { t, i18n } = useTranslation()
  const languageCode = i18n.resolvedLanguage || i18n.language

  // 動畫變體設定
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // 每個子元素延遲 0.1 秒
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }

  function AmuletListView() {
    const hasUnfavorited = charms.some(
      (charm) =>
        !favoriteCharms.some(
          (fav) =>
            fav.rarity === charm.rarity &&
            JSON.stringify(fav.groups) === JSON.stringify(charm.groups) &&
            JSON.stringify(fav.slotKeys || []) === JSON.stringify(charm.slotKeys || []) &&
            JSON.stringify(fav.matchingSkills || []) === JSON.stringify(charm.matchingSkills || [])
        )
    )
    const hasFavorited = charms.some((charm) =>
      favoriteCharms.some(
        (fav) =>
          fav.rarity === charm.rarity &&
          JSON.stringify(fav.groups) === JSON.stringify(charm.groups) &&
          JSON.stringify(fav.slotKeys || []) === JSON.stringify(charm.slotKeys || []) &&
          JSON.stringify(fav.matchingSkills || []) === JSON.stringify(charm.matchingSkills || [])
      )
    )

    return (
      <div>
        <div className='flex justify-between '>
          {/*  全部加入最愛*/}
          <div className='flex gap-2 mb-4'>
            {hasUnfavorited && (
              <Button
                onClick={() => {
                  // 添加所有 charms，確保沒有重複
                  const newFavorites = [...favoriteCharms]
                  charms.forEach((charm) => {
                    const exists = newFavorites.some(
                      (fav) =>
                        fav.rarity === charm.rarity &&
                        JSON.stringify(fav.groups) === JSON.stringify(charm.groups) &&
                        JSON.stringify(fav.slotKeys || []) === JSON.stringify(charm.slotKeys || []) &&
                        JSON.stringify(fav.matchingSkills || []) === JSON.stringify(charm.matchingSkills || [])
                    )
                    if (!exists) {
                      let charmWithCompleteData = { ...charm }
                      if (!charmWithCompleteData.slotKeys) {
                        const rarityData = rarityBaseProbability[charm.rarity]
                        if (rarityData && rarityData.Group) {
                          const group = rarityData.Group.find((g) => JSON.stringify(g.skills) === JSON.stringify(charm.groups))
                          if (group && group.slot) {
                            charmWithCompleteData.slotKeys = Object.keys(group.slot)
                          }
                        }
                      }
                      newFavorites.push(charmWithCompleteData)
                    }
                  })
                  setFavoriteCharms(newFavorites)
                }}>
                <Star className='w-4 h-4 md:mr-2' />
                {t("amuletList.addAllToFavorites", "全部收藏")}
              </Button>
            )}
            {hasFavorited && (
              <Button
                variant='destructive'
                className='bg-red-400 hover:bg-red-400 '
                onClick={() => {
                  // 移除所有 charms
                  setFavoriteCharms(
                    favoriteCharms.filter(
                      (fav) =>
                        !charms.some(
                          (charm) =>
                            fav.rarity === charm.rarity &&
                            JSON.stringify(fav.groups) === JSON.stringify(charm.groups) &&
                            JSON.stringify(fav.slotKeys || []) === JSON.stringify(charm.slotKeys || []) &&
                            JSON.stringify(fav.matchingSkills || []) === JSON.stringify(charm.matchingSkills || [])
                        )
                    )
                  )
                }}>
                <Trash2 className='w-4 h-4 md:mr-2' />
                {t("amuletList.removeAllFromFavorites", "移除收藏")}
              </Button>
            )}
          </div>
          {/* 開關些換 AmuletListShowMode 狀態 */}
          <div className='flex items-center justify-end mb-4 space-x-2'>
            <span className='text-sm text-gray-600'>
              {amuletListShowMode === "all" ? t("amuletList.showAll", "顯示全部") : t("amuletList.showSimple", "簡化顯示")}
            </span>
            <Switch checked={amuletListShowMode === "all"} onCheckedChange={(checked) => setAmuletListShowMode(checked ? "all" : "simple")} />
          </div>
        </div>
        <div className=''>
          <Motion.ul
            className={amuletListShowMode === "simple" ? "grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4" : ""}
            variants={containerVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: false, margin: "100px" }}>
            {charms.map((charm, idx) => {
              const key = `${charm.rarity || "unknown"}-${idx}`
              const isFavorite = favoriteCharms.some((c) => {
                return (
                  c.rarity === charm.rarity &&
                  JSON.stringify(c.groups) === JSON.stringify(charm.groups) &&
                  JSON.stringify(c.slotKeys || []) === JSON.stringify(charm.slotKeys || []) &&
                  JSON.stringify(c.matchingSkills || []) === JSON.stringify(charm.matchingSkills || [])
                )
              })

              return (
                <React.Fragment key={key}>
                  <Motion.li
                    variants={itemVariants}
                    initial='hidden'
                    whileInView='visible'
                    exit='hidden'
                    viewport={{ once: false, margin: "50px" }}
                    className={
                      amuletListShowMode === "simple"
                        ? "flex flex-col bg-[#251d12] px-3 py-4 text-white rounded-lg"
                        : "flex flex-col   bg-[#251d12] px-3 sm:px-4 md:px-6 my-10 text-white rounded-lg items-start justify-between gap-4 py-4 border-b xl:flex-row md:items-center md:gap-6"
                    }>
                    <div className='flex flex-col justify-between flex-1 w-full'>
                      <div
                        className={
                          amuletListShowMode === "simple" ? "flex flex-col w-full p-5 sm:flex-row h-48" : "flex flex-col w-full p-5 sm:flex-row "
                        }>
                        {/* 左邊：護石與技能選擇 */}
                        <div className='flex flex-col justify-center mb-4 sm:flex-1 sm:mb-0 sm:mr-4'>
                          <div className='flex items-center justify-around mb-2 sm:justify-start'>
                            <CharmDisplay charm={charm} groups={Array.isArray(charm.groups) ? charm.groups : []} t={t} mode={amuletListShowMode} />
                            <SkillSelector
                              className='flex flex-col sm:ml-2 md:ml-10'
                              groups={Array.isArray(charm.groups) ? charm.groups : []}
                              matchingSkills={Array.isArray(charm.matchingSkills) ? charm.matchingSkills : []}
                              t={t}
                              SKILL_PLACEHOLDER_SVG={SKILL_PLACEHOLDER_SVG}
                            />
                          </div>
                        </div>
                        {/* 右邊：插槽 */}
                        {amuletListShowMode !== "simple" && (
                          <div className='hidden sm:block'>
                            <SlotList charm={charm} t={t} languageCode={languageCode} />
                          </div>
                        )}
                      </div>
                      <div className='flex items-center justify-between'>
                        {/* 技能機率 */}
                        <div className='text-2xl font-bold md:pr-3 '>
                          {(() => {
                            const raw = charm?.computed?.finalNoSlot || 0
                            const chance = Number(raw)
                            return (
                              <div>
                                {t("common.skillProbability", "技能機率")}: {chance > 0 ? decimalToFraction(chance, 100000000, languageCode) : "1/∞"}
                              </div>
                            )
                          })()}
                        </div>

                        {/*  最愛功能  */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isFavorite) {
                              // 移除收藏
                              setFavoriteCharms(
                                favoriteCharms.filter(
                                  (c) =>
                                    !(
                                      c.rarity === charm.rarity &&
                                      JSON.stringify(c.groups) === JSON.stringify(charm.groups) &&
                                      JSON.stringify(c.slotKeys || []) === JSON.stringify(charm.slotKeys || []) &&
                                      JSON.stringify(c.matchingSkills || []) === JSON.stringify(charm.matchingSkills || [])
                                    )
                                )
                              )
                            } else {
                              // 添加收藏，確保有完整的資料
                              let charmWithCompleteData = { ...charm }
                              if (!charmWithCompleteData.slotKeys) {
                                const rarityData = rarityBaseProbability[charm.rarity]
                                if (rarityData && rarityData.Group) {
                                  const group = rarityData.Group.find((g) => JSON.stringify(g.skills) === JSON.stringify(charm.groups))
                                  if (group && group.slot) {
                                    charmWithCompleteData.slotKeys = Object.keys(group.slot)
                                  }
                                }
                              }
                              setFavoriteCharms([...favoriteCharms, charmWithCompleteData])
                            }
                          }}
                          className='p-2 mt-2 bg-transparent border-none'>
                          <Star className={isFavorite ? "w-6 h-6 fill-yellow-500 text-yellow-500" : "w-6 h-6 text-gray-500"} />
                        </button>
                      </div>
                    </div>

                    {amuletListShowMode !== "simple" && <AmuletDetails charm={charm} t={t} languageCode={languageCode} />}
                  </Motion.li>
                </React.Fragment>
              )
            })}
          </Motion.ul>
        </div>
      </div>
    )
  }

  function TotalProbabilityView() {
    if (charms.length === 0) {
      return <div className='p-6 text-center text-gray-500'>{t("amuletList.selectSkillsFirst", "請先選擇技能以查看總機率統計")}</div>
    }

    const probabilitiesByRarity = {}
    charms.forEach((charm) => {
      const rarity = charm.rarity || "Unknown"
      if (!probabilitiesByRarity[rarity]) {
        probabilitiesByRarity[rarity] = { noSlot: 0, withSlot: 0 }
      }

      const computed = charm.computed || {}
      probabilitiesByRarity[rarity].noSlot += computed.finalNoSlot || 0
      probabilitiesByRarity[rarity].withSlot += computed.finalWithSlot || 0
    })

    return (
      <div className='overflow-x-auto rounded-lg border border-gray-200'>
        <table className='w-full min-w-[32rem] text-left'>
          <thead className='bg-gray-100'>
            <tr>
              <th className='px-4 py-3 text-sm font-semibold text-gray-700'>{t("rarity", "稀有度")}</th>
              <th className='px-4 py-3 text-sm font-semibold text-gray-700'>{t("skill", "技能機率")}</th>
              <th className='px-4 py-3 text-sm font-semibold text-gray-700'>{t("totalProbability.withSlot", "技能+插槽")}</th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {Object.entries(probabilitiesByRarity)
              .sort(([rarityA], [rarityB]) => rarityA.localeCompare(rarityB))
              .map(([rarity, probability], index) => (
                <Motion.tr
                  key={`${rarity}-${charms.length}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.15, ease: "easeOut" }}
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
                  <td className='px-4 py-3 font-semibold text-indigo-600'>{decimalToFraction(probability.noSlot, 100000000, languageCode)}</td>
                  <td className='px-4 py-3 font-semibold text-indigo-600'>{decimalToFraction(probability.withSlot, 100000000, languageCode)}</td>
                </Motion.tr>
              ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!charms || charms.length === 0) return null

  return (
    <div className='w-full p-5 bg-white rounded-md'>
      <div className='p-2 md:p-6'>
        <h2 className='mb-5 text-2xl font-bold text-gray-800'>{t("totalProbability.title", "總機率")}</h2>
        <TotalProbabilityView />

        <h2 className='mt-8 mb-5 text-2xl font-bold text-gray-800'>{t("amuletList.list", "護石列表")}</h2>
        <AmuletListView />
      </div>
    </div>
  )
}
