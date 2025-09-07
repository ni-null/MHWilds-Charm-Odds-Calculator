import React, { useState, useMemo } from "react"
import MonsterData from "../../data/Monster.json"
import RarityData from "../../data/Rarity.json"
import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

export default function HuntTimeCalculator({ AvlCharms }) {
  const { t } = useTranslation()

  // 狀態管理
  const [selectedMonster, setSelectedMonster] = useState("Uth Duna")
  const [huntTime, setHuntTime] = useState(10) // 討伐時間(分鐘)
  const [restTime, setRestTime] = useState(2) // 休息時間(分鐘)
  const [isSlotOpen, setIsSlotOpen] = useState(false) // 控制插槽組合展開/摺疊
  console.log(AvlCharms)

  // 通用計算護石機率總和分母的函數
  const calculateCharmDenominator = useMemo(() => {
    const calculateProbabilityDenominator = (probabilityField) => {
      if (!AvlCharms.length) return null

      const totalProbability = AvlCharms.reduce((sum, charm) => {
        const prob = charm?.computed?.[probabilityField] || 0
        return sum + prob
      }, 0)

      if (totalProbability <= 0) return null
      return Math.round(1 / totalProbability)
    }

    return {
      noSlot: calculateProbabilityDenominator("finalNoSlot"),
      withSlot: calculateProbabilityDenominator("finalWithSlot"),
    }
  }, [AvlCharms])

  // 計算插槽組合機率
  const slotCombinationProbabilities = useMemo(() => {
    if (!AvlCharms.length) return {}

    const slotProbs = {}

    AvlCharms.forEach((charm) => {
      const rarity = charm.rarity
      const rarityData = RarityData[rarity]
      if (!rarityData) return

      const charmProb = charm.computed?.baseProb || 0
      const charmTypeProb = charm.computed?.charmTypeProb || 0
      const groupProb = charm.computed?.groupProb || 0

      // 找到匹配的 group
      const matchingGroup = rarityData.Group.find((group) => {
        return JSON.stringify(group.skills) === JSON.stringify(charm.groups)
      })

      if (matchingGroup) {
        // 從 AvlCharms 的 AllslotKey 中獲取實際的插槽組合
        if (charm.AllslotKey) {
          charm.AllslotKey.forEach((slotKey) => {
            const slotProb = matchingGroup.slot[slotKey] || 0
            const totalProb = charmProb * charmTypeProb * groupProb * slotProb

            if (!slotProbs[slotKey]) {
              slotProbs[slotKey] = 0
            }
            slotProbs[slotKey] += totalProb
          })
        }
      }
    })

    // 轉換為分母形式
    const result = {}
    Object.keys(slotProbs).forEach((key) => {
      if (slotProbs[key] > 0) {
        result[key] = Math.round(1 / slotProbs[key])
      }
    })

    return result
  }, [AvlCharms])

  // 解構獲取兩個分母值
  const totalCharmDenominator = calculateCharmDenominator.noSlot

  // 計算需要的討伐次數 (無插槽)
  const calculateHuntCounts = useMemo(() => {
    if (!totalCharmDenominator || !selectedMonster) return null

    const monster = MonsterData.Monster[selectedMonster]
    const base = MonsterData.Base // 任務額外獎勵：每次討伐怪物後額外獲得 1-3 個護石
    if (!monster || !base) return null

    // 總護石數 = 怪物護石 + Base 護石
    const totalMin = monster.MIN + base.MIN
    const totalMax = monster.MAX + base.MAX
    const totalAvg = (monster.MAX + monster.MIN) / 2 + (base.MAX + base.MIN) / 2

    const minHunts = Math.ceil(totalCharmDenominator / totalMax)
    const maxHunts = Math.ceil(totalCharmDenominator / totalMin)
    const avgHunts = Math.ceil(totalCharmDenominator / totalAvg)

    return { minHunts, maxHunts, avgHunts, monster }
  }, [totalCharmDenominator, selectedMonster])

  // 計算總時間(小時) - 無插槽
  const calculateTotalTime = useMemo(() => {
    if (!calculateHuntCounts) return null

    const { minHunts, maxHunts, avgHunts } = calculateHuntCounts
    const totalTimePerHunt = huntTime + restTime // 分鐘

    return {
      minTime: (minHunts * totalTimePerHunt) / 60, // 轉換為小時
      maxTime: (maxHunts * totalTimePerHunt) / 60,
      avgTime: (avgHunts * totalTimePerHunt) / 60,
    }
  }, [calculateHuntCounts, huntTime, restTime])

  // 計算插槽組合的狩獵次數
  const calculateSlotCombinationHuntCounts = useMemo(() => {
    if (!selectedMonster || !Object.keys(slotCombinationProbabilities).length) return {}

    const monster = MonsterData.Monster[selectedMonster]
    const base = MonsterData.Base
    if (!monster || !base) return {}

    const totalMin = monster.MIN + base.MIN
    const totalMax = monster.MAX + base.MAX
    const totalAvg = (monster.MAX + monster.MIN) / 2 + (base.MAX + base.MIN) / 2

    const result = {}
    Object.keys(slotCombinationProbabilities).forEach((key) => {
      const denominator = slotCombinationProbabilities[key]
      if (denominator) {
        result[key] = {
          minHunts: Math.ceil(denominator / totalMax),
          maxHunts: Math.ceil(denominator / totalMin),
          avgHunts: Math.ceil(denominator / totalAvg),
        }
      }
    })

    return result
  }, [slotCombinationProbabilities, selectedMonster])

  // 計算插槽組合的總時間
  const calculateSlotCombinationTotalTime = useMemo(() => {
    if (!Object.keys(calculateSlotCombinationHuntCounts).length) return {}

    const totalTimePerHunt = huntTime + restTime
    const result = {}

    Object.keys(calculateSlotCombinationHuntCounts).forEach((key) => {
      const { minHunts, maxHunts, avgHunts } = calculateSlotCombinationHuntCounts[key]
      result[key] = {
        minTime: (minHunts * totalTimePerHunt) / 60,
        maxTime: (maxHunts * totalTimePerHunt) / 60,
        avgTime: (avgHunts * totalTimePerHunt) / 60,
      }
    })

    return result
  }, [calculateSlotCombinationHuntCounts, huntTime, restTime])

  // 獲取怪物列表
  const monsterList = Object.keys(MonsterData.Monster)

  // helper: format hours into days and hours display
  const formatHoursWithDays = (hours) => {
    if (hours == null || isNaN(hours)) return "-"
    const h = Number(hours)
    // Only show days when total hours >= 24. Use ceil so e.g. 60.4 -> 3 days.
    const days = h >= 24 ? Math.ceil(h / 24) : 0
    const hoursFixed = h.toFixed(1)
    if (days > 0) {
      return `${days.toLocaleString()}${t("huntTimeCalculator.daysSuffix", "天")}(${parseFloat(hoursFixed).toLocaleString()} ${t(
        "huntTimeCalculator.hours",
        "hours"
      )})`
    }
    return `${parseFloat(hoursFixed).toLocaleString()} ${t("huntTimeCalculator.hours", "hours")}`
  }

  // 使用原始怪物名稱當翻譯鍵（包含空格），t() 的 fallback 為原名

  /* 
  console.log(AvlCharms)
  [
    {
        "rarity": "RARE[8]",
        "groups": [
            3,
            6,
            5
        ],
        "matchingSkills": [
            "Adaptability Lv.1",
            "Antivirus Lv.2",
            "Charge Master Lv.3"
        ],
        "slotKeys": [
            "[\"W1\", 1, 1]"
        ],
        "AllslotKey": [
            "[\"W1\"]",
            "[\"W1\", 1]",
            "[\"W1\", 1, 1]"
        ],
        "computed": {
            "baseProb": 0.03,
            "charmTypeProb": 0.125,
            "groupProb": 0.00001876876876876877,
            "finalNoSlot": 7.038288288288289e-8,
            "finalWithSlot": 1.1965090090090092e-8,
            "SlotProb": 0.17,
            "grouped": [
                {
                    "group": 3,
                    "total": 40,
                    "available": 40,
                    "excluded": []
                },
                {
                    "group": 6,
                    "total": 37,
                    "available": 36,
                    "excluded": [
                        "Adaptability"
                    ]
                },
                {
                    "group": 5,
                    "total": 37,
                    "available": 37,
                    "excluded": []
                }
            ]
        }
    }
]
  */

  return (
    <div>
      <div className='p-2 md:p-6 '>
        <h2 className='text-2xl font-bold text-gray-800'>{t("huntTimeCalculator.title", "Hunt Time Calculator")}</h2>
      </div>

      <div className='p-2 md:p-6 '>
        {totalCharmDenominator ? (
          <div className='space-y-6'>
            <div className='flex flex-col gap-6 md:flex-row md:gap-6'>
              {/* 選擇怪物 */}
              <div className='w-full space-y-2 md:flex-1'>
                <label htmlFor='monster-select' className='block text-sm font-medium text-gray-700'>
                  {t("huntTimeCalculator.selectMonster", "Select Monster")}
                </label>
                <Select value={selectedMonster} onValueChange={setSelectedMonster}>
                  <SelectTrigger
                    id='monster-select'
                    className='w-full h-auto min-h-[48px] px-3 text-base md:min-h-[64px] md:px-4 md:text-lg flex items-center'>
                    <SelectValue>
                      {selectedMonster ? (
                        <div className='flex items-center w-full gap-3'>
                          <img
                            src={`${import.meta.env.BASE_URL}image/Monsters/${encodeURIComponent(selectedMonster)}.webp`}
                            alt={selectedMonster}
                            loading='lazy'
                            className='object-contain w-8 h-8 rounded md:w-10 md:h-10'
                            onError={(e) => {
                              try {
                                if (!e || !e.currentTarget) return
                                e.currentTarget.style.display = "none"
                              } catch (err) {
                                console.debug("selected monster img onError hide failed", err)
                              }
                            }}
                          />
                          <span className='text-xl font-bold truncate'>{t(`monsters.${selectedMonster}`, selectedMonster)}</span>
                          {MonsterData.Monster[selectedMonster] && MonsterData.Base && (
                            <span className='text-base text-gray-500'>
                              ({MonsterData.Monster[selectedMonster].MIN + MonsterData.Base.MIN}-
                              {MonsterData.Monster[selectedMonster].MAX + MonsterData.Base.MAX} {t("amulet.unit", "護石")})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className='text-sm'>{t("huntTimeCalculator.selectMonster", "Select Monster")}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t("huntTimeCalculator.monsters", "Monsters")}</SelectLabel>
                      {monsterList.map((monster) => {
                        const key = `monsters.${monster}`
                        const label = t(key, monster)
                        const imgSrcPublic = `${import.meta.env.BASE_URL}image/Monsters/${encodeURIComponent(monster)}.webp`

                        return (
                          <SelectItem key={monster} value={monster} className='py-2'>
                            <div className='flex items-center gap-3 cursor-pointer'>
                              <img
                                src={imgSrcPublic}
                                loading='lazy'
                                alt={`${label} icon`}
                                className='object-contain w-10 h-10 rounded md:w-12 md:h-12'
                                onError={(e) => {
                                  try {
                                    if (!e || !e.currentTarget) return
                                    e.currentTarget.style.display = "none"
                                  } catch (err) {
                                    console.debug("monster img onError hide failed", err)
                                  }
                                }}
                              />
                              <div className='flex flex-col'>
                                <div className='text-base font-medium leading-tight md:text-lg'>{label}</div>
                                <div className='text-sm text-gray-500'>
                                  {MonsterData.Monster[monster].MIN + MonsterData.Base.MIN}-{MonsterData.Monster[monster].MAX + MonsterData.Base.MAX}{" "}
                                  {t("amulet.unit", "護石")}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* 狩獵時間 */}
              <div className='hidden w-full space-y-2 md:flex-1 md:block'>
                <label htmlFor='hunt-time' className='block text-sm font-medium text-gray-700'>
                  {t("huntTimeCalculator.huntTime", "Hunt Time (minutes)")}
                </label>
                <Input
                  id='hunt-time'
                  type='number'
                  className='w-full h-auto min-h-[48px] px-3 text-base md:min-h-[64px] md:px-4 md:text-xl'
                  value={huntTime}
                  onChange={(e) => setHuntTime(parseInt(e.target.value) || 0)}
                  min='1'
                  placeholder='10'
                />
              </div>

              {/* 休息時間 */}
              <div className='hidden w-full space-y-2 md:flex-1 md:block'>
                <label htmlFor='rest-time' className='block text-sm font-medium text-gray-700'>
                  {t("huntTimeCalculator.restTime", "Rest Time (minutes)")}
                </label>
                <Input
                  id='rest-time'
                  type='number'
                  className='w-full h-auto min-h-[48px] px-3 text-base md:min-h-[64px] md:px-4 md:text-xl'
                  value={restTime}
                  onChange={(e) => setRestTime(parseInt(e.target.value) || 0)}
                  min='0'
                  placeholder='2'
                />
              </div>

              {/* 手機版：狩獵時間 + 休息時間 同行 */}
              <div className='flex flex-row w-full gap-2 md:hidden'>
                {/* 狩獵時間 */}
                <div className='flex-1 space-y-2'>
                  <label htmlFor='hunt-time-mobile' className='block text-sm font-medium text-gray-700'>
                    {t("huntTimeCalculator.huntTime", "Hunt Time (minutes)")}
                  </label>
                  <Input
                    id='hunt-time-mobile'
                    type='number'
                    className='w-full h-auto min-h-[48px] px-3 text-base md:min-h-[64px] md:px-4 md:text-xl'
                    value={huntTime}
                    onChange={(e) => setHuntTime(parseInt(e.target.value) || 0)}
                    min='1'
                    placeholder='10'
                  />
                </div>
                {/* 休息時間 */}
                <div className='flex-1 space-y-2'>
                  <label htmlFor='rest-time-mobile' className='block text-sm font-medium text-gray-700'>
                    {t("huntTimeCalculator.restTime", "Rest Time (minutes)")}
                  </label>
                  <Input
                    id='rest-time-mobile'
                    type='number'
                    className='w-full h-auto min-h-[48px] px-3 text-base md:min-h-[64px] md:px-4 md:text-xl'
                    value={restTime}
                    onChange={(e) => setRestTime(parseInt(e.target.value) || 0)}
                    min='0'
                    placeholder='2'
                  />
                </div>
              </div>
            </div>

            <div className='w-full overflow-x-auto overflow-y-hidden bg-white border border-gray-200 shadow-sm rounded-2xl'>
              <table className='min-w-[500px] divide-y divide-gray-100 w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                      {t("huntTimeCalculator.type", "出現機率")}
                    </th>
                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                      {t("huntTimeCalculator.Min", "最小")}
                    </th>
                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                      {t("huntTimeCalculator.Avg", "平均")}
                    </th>
                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                      {t("huntTimeCalculator.Max", "最大")}
                    </th>
                  </tr>
                </thead>

                <tbody className='divide-y divide-gray-100'>
                  {/* 技能 出現機率 */}
                  {calculateHuntCounts && calculateTotalTime && (
                    <tr className='hover:bg-gray-50/60'>
                      <td className='px-4 py-3 text-sm font-semibold text-sky-700'>
                        {t("huntTimeCalculator.skillOdds", "技能")}
                        <span className='ml-2 font-bold'>1/{totalCharmDenominator.toLocaleString()}</span>
                      </td>
                      <td className='px-4 py-3 font-semibold text-emerald-600'>
                        {calculateHuntCounts.minHunts.toLocaleString()} {t("huntTimeCalculator.hunts", "hunts")}
                        <div className='text-xs text-gray-500'>{formatHoursWithDays(calculateTotalTime.minTime)}</div>
                      </td>
                      <td className='px-4 py-3 font-semibold text-amber-600'>
                        {calculateHuntCounts.avgHunts.toLocaleString()} {t("huntTimeCalculator.hunts", "hunts")}
                        <div className='text-xs text-gray-500'>{formatHoursWithDays(calculateTotalTime.avgTime)}</div>
                      </td>
                      <td className='flex-row px-4 py-3 font-semibold text-rose-600'>
                        {calculateHuntCounts.maxHunts.toLocaleString()} {t("huntTimeCalculator.hunts", "hunts")}
                        <div className='text-xs text-gray-500'>{formatHoursWithDays(calculateTotalTime.maxTime)}</div>
                      </td>
                    </tr>
                  )}

                  {/* 插槽組合 展開/摺疊 */}
                  {Object.keys(slotCombinationProbabilities).length > 0 && (
                    <>
                      <tr>
                        <td colSpan='4' className='px-0 py-0'>
                          <Collapsible open={isSlotOpen} onOpenChange={setIsSlotOpen}>
                            <CollapsibleTrigger asChild>
                              <button className='flex items-center justify-between w-full px-4 py-3 text-left transition-colors border-t border-gray-200 bg-gray-50 hover:bg-gray-100'>
                                <span className='text-sm font-medium text-gray-700'>
                                  {t("huntTimeCalculator.slotCombinationDetails", "插槽組合詳細資料")}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isSlotOpen ? "rotate-180" : ""}`} />
                              </button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan='4' className='px-0 py-0'>
                          <Collapsible open={isSlotOpen} onOpenChange={setIsSlotOpen}>
                            <CollapsibleContent className='w-full'>
                              <div className='w-full overflow-x-auto'>
                                <table className='min-w-[500px] w-full divide-y divide-gray-100'>
                                  <tbody>
                                    {/* 插槽組合 出現機率 */}
                                    {Object.keys(slotCombinationProbabilities).map((slotKey) => {
                                      const denominator = slotCombinationProbabilities[slotKey]
                                      const huntCounts = calculateSlotCombinationHuntCounts[slotKey]
                                      const totalTime = calculateSlotCombinationTotalTime[slotKey]

                                      if (!denominator || !huntCounts || !totalTime) return null

                                      const parsedSlotKey = JSON.parse(slotKey)
                                      let displaySlotKey = ""
                                      let slotImages = []

                                      if (Array.isArray(parsedSlotKey)) {
                                        if (parsedSlotKey[0] === "W1") {
                                          // W1 格式的顯示
                                          slotImages.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                                          if (parsedSlotKey.length === 1) {
                                            displaySlotKey = "W1"
                                          } else if (parsedSlotKey.length === 2) {
                                            displaySlotKey = `W1, ${parsedSlotKey[1]}`
                                            slotImages.push(`${import.meta.env.BASE_URL}image/slot/${parsedSlotKey[1]}.png`)
                                          } else if (parsedSlotKey.length === 3) {
                                            displaySlotKey = `W1, ${parsedSlotKey[1]}, ${parsedSlotKey[2]}`
                                            slotImages.push(`${import.meta.env.BASE_URL}image/slot/${parsedSlotKey[1]}.png`)
                                            slotImages.push(`${import.meta.env.BASE_URL}image/slot/${parsedSlotKey[2]}.png`)
                                          }
                                        } else {
                                          // 標準格式
                                          displaySlotKey = parsedSlotKey.join(", ")
                                          parsedSlotKey.forEach((slot) => {
                                            slotImages.push(`${import.meta.env.BASE_URL}image/slot/${slot}.png`)
                                          })
                                        }
                                      } else {
                                        displaySlotKey = parsedSlotKey
                                        slotImages.push(`${import.meta.env.BASE_URL}image/slot/${parsedSlotKey}.png`)
                                      }

                                      return (
                                        <tr key={slotKey} className='border-t border-gray-200 hover:bg-gray-50/60'>
                                          <td className='px-4 py-3 text-sm font-semibold text-purple-700'>
                                            <div className='flex flex-col gap-1 md:flex-row md:items-center md:gap-1'>
                                              <div className='md:flex md:items-center md:gap-1'>
                                                <div>{t("huntTimeCalculator.skillWithSlotOdds", "技能+插槽")}</div>
                                                <span className='font-bold'>[{displaySlotKey}]</span>
                                              </div>
                                              <div className='items-center hidden gap-1 md:flex'>
                                                {slotImages.map((imgSrc, index) => (
                                                  <img
                                                    key={index}
                                                    src={imgSrc}
                                                    alt={`slot-${index}`}
                                                    className='object-contain w-4 h-4'
                                                    onError={(e) => {
                                                      e.currentTarget.style.display = "none"
                                                    }}
                                                  />
                                                ))}
                                              </div>
                                              <span className='font-bold md:ml-2'>1/{denominator.toLocaleString()}</span>
                                            </div>
                                          </td>
                                          <td className='px-4 py-3 font-semibold text-emerald-600'>
                                            {huntCounts.minHunts.toLocaleString()} {t("huntTimeCalculator.hunts", "hunts")}
                                            <div className='text-xs text-gray-500'>{formatHoursWithDays(totalTime.minTime)}</div>
                                          </td>
                                          <td className='px-4 py-3 font-semibold text-amber-600'>
                                            {huntCounts.avgHunts.toLocaleString()} {t("huntTimeCalculator.hunts", "hunts")}
                                            <div className='text-xs text-gray-500'>{formatHoursWithDays(totalTime.avgTime)}</div>
                                          </td>
                                          <td className='px-4 py-3 font-semibold text-rose-600'>
                                            {huntCounts.maxHunts.toLocaleString()} {t("huntTimeCalculator.hunts", "hunts")}
                                            <div className='text-xs text-gray-500'>{formatHoursWithDays(totalTime.maxTime)}</div>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* 說明文字 */}
            <div className='mt-4 text-sm text-gray-600'>
              <p className='mt-2'>
                {t("huntTimeCalculator.baseRewardNote", "任務額外獎勵：每次討伐怪物後額外獲得 1-3 個護石，已計入總護石數量計算中。")}
              </p>

              <p>{t("huntTimeCalculator.disclaimer", "此計算器僅供參考，推算幾乎出於推估的出現機率。")}</p>
            </div>
          </div>
        ) : (
          <div className='py-8 text-center text-gray-500'>
            <p>{t("huntTimeCalculator.noData", "No charm data available. Please select skills first.")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
