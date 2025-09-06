import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
// ensure `motion` is referenced so some linters that don't detect JSX usage won't report it as unused
void motion
import { Star, Trash2 } from "lucide-react"
import useMhwStore from "../../store/mhwStore"
import AmuletDetails from "../MHWildsCharmOddsCalculator/components/AmuletDetails"
import CharmDisplay from "../MHWildsCharmOddsCalculator/components/CharmDisplay"
import SkillSelector from "../MHWildsCharmOddsCalculator/components/SkillSelector"
import SlotList from "../MHWildsCharmOddsCalculator/components/SlotList"
import { decimalToFraction } from "../../lib/fractionUtils"
import rarityBaseProbability from "../../data/Rarity.json"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

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

  const { t } = useTranslation()

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
                <Star className='w-4 h-4 mr-2' />
                {t("amuletList.addAllToFavorites", "全部加入最愛")}
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
                <Trash2 className='w-4 h-4 mr-2' />
                {t("amuletList.removeAllFromFavorites", "全部移除最愛")}
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
          <motion.ul
            className={amuletListShowMode === "simple" ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4" : ""}
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
                  <motion.li
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
                              className='flex flex-col ml-10'
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
                            <SlotList charm={charm} t={t} />
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
                                {t("common.skillProbability", "技能機率")}: {chance > 0 ? decimalToFraction(chance) : "1/∞"}
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

                    {amuletListShowMode !== "simple" && <AmuletDetails charm={charm} t={t} />}
                  </motion.li>
                </React.Fragment>
              )
            })}
          </motion.ul>
        </div>
      </div>
    )
  }

  function TotalProbabilityView() {
    if (!charms || charms.length === 0) {
      return (
        <div>
          <div className='p-6 text-center text-gray-500'>請先選擇技能以查看總機率統計</div>
        </div>
      )
    }

    return (
      <div>
        <div className='flex flex-col'>
          {/* 使用 charms 的資料統計個別 rarity 組別顯示組別的總機率 */}
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
                        key={`${r}-${charms.length}`}
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
      </div>
    )
  }

  if (!charms || charms.length === 0) return null

  return (
    <Tabs defaultValue='list' className='w-full p-5 bg-white rounded-md'>
      <div class='p-2 md:p-6 '>
        <h2 class='text-2xl font-bold mb-5 text-gray-800'>護石列表</h2>

        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='list'>{t("amuletList.list", "護石列表")}</TabsTrigger>
          <TabsTrigger value='probability'>{t("totalProbability.title", "總機率")}</TabsTrigger>
        </TabsList>
        <TabsContent value='list'>
          <AmuletListView />
        </TabsContent>
        <TabsContent value='probability'>
          <TotalProbabilityView />
        </TabsContent>
      </div>
    </Tabs>
  )
}
