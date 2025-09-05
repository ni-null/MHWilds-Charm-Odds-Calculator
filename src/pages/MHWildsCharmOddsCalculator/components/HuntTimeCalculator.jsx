import React, { useState, useMemo } from "react"
import useMhwStore from "../../../store/mhwStore"
import MonsterData from "../../../data/Monster.json"
import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function HuntTimeCalculator() {
  const { t } = useTranslation()
  const { AvlCharms = [] } = useMhwStore()

  // 狀態管理
  const [selectedMonster, setSelectedMonster] = useState("Uth Duna")
  const [huntTime, setHuntTime] = useState(10) // 討伐時間(分鐘)
  const [restTime, setRestTime] = useState(2) // 休息時間(分鐘)
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

  // 解構獲取兩個分母值
  const totalCharmDenominator = calculateCharmDenominator.noSlot
  const totalWithSlotDenominator = calculateCharmDenominator.withSlot

  // 計算需要的討伐次數 (無插槽)
  const calculateHuntCounts = useMemo(() => {
    if (!totalCharmDenominator || !selectedMonster) return null

    const monster = MonsterData[selectedMonster]
    if (!monster) return null

    const minHunts = Math.ceil(totalCharmDenominator / monster.MAX)
    const maxHunts = Math.ceil(totalCharmDenominator / monster.MIN)
    const avgHunts = Math.ceil(totalCharmDenominator / ((monster.MAX + monster.MIN) / 2))

    return { minHunts, maxHunts, avgHunts, monster }
  }, [totalCharmDenominator, selectedMonster])

  // 計算需要的討伐次數 (帶插槽)
  const calculateWithSlotHuntCounts = useMemo(() => {
    if (!totalWithSlotDenominator || !selectedMonster) return null

    const monster = MonsterData[selectedMonster]
    if (!monster) return null

    const minHunts = Math.ceil(totalWithSlotDenominator / monster.MAX)
    const maxHunts = Math.ceil(totalWithSlotDenominator / monster.MIN)
    const avgHunts = Math.ceil(totalWithSlotDenominator / ((monster.MAX + monster.MIN) / 2))

    return { minHunts, maxHunts, avgHunts, monster }
  }, [totalWithSlotDenominator, selectedMonster])

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

  // 計算總時間(小時) - 帶插槽
  const calculateWithSlotTotalTime = useMemo(() => {
    if (!calculateWithSlotHuntCounts) return null

    const { minHunts, maxHunts, avgHunts } = calculateWithSlotHuntCounts
    const totalTimePerHunt = huntTime + restTime // 分鐘

    return {
      minTime: (minHunts * totalTimePerHunt) / 60, // 轉換為小時
      maxTime: (maxHunts * totalTimePerHunt) / 60,
      avgTime: (avgHunts * totalTimePerHunt) / 60,
    }
  }, [calculateWithSlotHuntCounts, huntTime, restTime])

  // 獲取怪物列表
  const monsterList = Object.keys(MonsterData)

  // helper: format hours into days and hours display
  const formatHoursWithDays = (hours) => {
    if (hours == null || isNaN(hours)) return "-"
    const h = Number(hours)
    // Only show days when total hours >= 24. Use ceil so e.g. 60.4 -> 3 days.
    const days = h >= 24 ? Math.ceil(h / 24) : 0
    const hoursFixed = h.toFixed(1)
    if (days > 0) {
      return `${days}${t("huntTimeCalculator.daysSuffix", "天")}(${hoursFixed} ${t("huntTimeCalculator.hours", "hours")})`
    }
    return `${hoursFixed} ${t("huntTimeCalculator.hours", "hours")}`
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
      <div className='p-6 '>
        <h2 className='text-2xl font-bold text-gray-800'>{t("huntTimeCalculator.title", "Hunt Time Calculator")}</h2>
      </div>

      <div className='p-6'>
        {totalCharmDenominator ? (
          <div className='space-y-6'>
            {/* 怪物選擇和時間設定 */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <label htmlFor='monster-select' className='block text-sm font-medium text-gray-700'>
                  {t("huntTimeCalculator.selectMonster", "Select Monster")}
                </label>
                <Select value={selectedMonster} onValueChange={setSelectedMonster}>
                  <SelectTrigger
                    id='monster-select'
                    className='w-full h-auto min-h-[48px] px-3 text-base md:min-h-[64px] md:px-4 md:text-lg flex items-center'>
                    <SelectValue>
                      {/* custom display for selected monster: image + name */}
                      {selectedMonster ? (
                        <div className='flex items-center w-full gap-3'>
                          <img
                            src={`${import.meta.env.BASE_URL}docs/image/Monsters/${encodeURIComponent(selectedMonster)}.png`}
                            alt={selectedMonster}
                            className='w-8 h-8 rounded md:w-10 md:h-10'
                            style={{ objectFit: "contain" }}
                            onError={(e) => {
                              try {
                                if (!e || !e.currentTarget) return
                                e.currentTarget.style.display = "none"
                              } catch (err) {
                                console.debug("selected monster img onError hide failed", err)
                              }
                            }}
                          />
                          <span className='text-xl font-bold truncate '>{t(`monsters.${selectedMonster}`, selectedMonster)}</span>
                          {MonsterData[selectedMonster] && (
                            <span className='text-base gray-500 text-'>
                              ({MonsterData[selectedMonster].MIN}-{MonsterData[selectedMonster].MAX} {t("amulet.unit", "護石")})
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
                        // Images live in docs/image/Monsters in this repo; use BASE_URL to ensure correct base path
                        const imgSrcPublic = `${import.meta.env.BASE_URL}docs/image/Monsters/${encodeURIComponent(monster)}.png`

                        return (
                          <SelectItem key={monster} value={monster} className='py-2'>
                            <div className='flex items-center gap-3 cursor-pointer'>
                              <img
                                src={imgSrcPublic}
                                alt={`${label} icon`}
                                style={{ objectFit: "contain" }}
                                className='w-10 h-10 rounded md:w-12 md:h-12'
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
                                  {MonsterData[monster].MIN}-{MonsterData[monster].MAX} {t("amulet.unit", "護石")}
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

              {/* 將兩個時間輸入在小螢幕時並排顯示，md 時仍維持三欄佈局 */}
              <div className='col-span-1 md:col-span-2'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
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

                  <div className='space-y-2'>
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
                </div>
              </div>
            </div>

            {/* 機率顯示與計算結果 */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* 無插槽機率與結果 */}
              <div className='p-6 rounded-lg bg-sky-50'>
                <div className='flex mb-4 text-2xl '>
                  <h3 className='font-semibold text-sky-700 '>{t("huntTimeCalculator.skillOdds", "技能 出現機率")}</h3>
                  <p className='ml-3 font-bold text-sky-700 '>1/{totalCharmDenominator.toLocaleString()}</p>
                </div>

                {/* 無插槽計算結果 */}
                {calculateHuntCounts && calculateTotalTime && (
                  <div className='flex w-full gap-3'>
                    <div className='flex-1 p-3 text-center rounded-md bg-white/70'>
                      <div className='text-xs text-gray-600'>{t("huntTimeCalculator.Min", "Min")}</div>
                      <div className='text-lg font-bold text-emerald-600'>
                        {calculateHuntCounts.minHunts} {t("huntTimeCalculator.hunts", "hunts")}
                      </div>
                      <div className='text-xs text-gray-500'>{formatHoursWithDays(calculateTotalTime.minTime)}</div>
                    </div>

                    <div className='flex-1 p-3 text-center rounded-md bg-white/70'>
                      <div className='text-xs text-gray-600'>{t("huntTimeCalculator.Avg", "Avg")}</div>
                      <div className='text-lg font-bold text-amber-600'>
                        {calculateHuntCounts.avgHunts} {t("huntTimeCalculator.hunts", "hunts")}
                      </div>
                      <div className='text-xs text-gray-500'>{formatHoursWithDays(calculateTotalTime.avgTime)}</div>
                    </div>

                    <div className='flex-1 p-3 text-center rounded-md bg-white/70'>
                      <div className='text-xs text-gray-600'>{t("huntTimeCalculator.Max", "Max")}</div>
                      <div className='text-lg font-bold text-rose-600'>
                        {calculateHuntCounts.maxHunts} {t("huntTimeCalculator.hunts", "hunts")}
                      </div>
                      <div className='text-xs text-gray-500'>{formatHoursWithDays(calculateTotalTime.maxTime)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 帶插槽機率與結果 */}
              {totalWithSlotDenominator && (
                <div className='p-6 rounded-lg bg-fuchsia-50'>
                  <div className='flex mb-4 text-2xl '>
                    <h3 className='font-semibold text-fuchsia-700 '>{t("huntTimeCalculator.skillWithSlotOdds", "技能+插槽 出現機率")}</h3>
                    <p className='ml-3 font-bold text-fuchsia-700 '>1/{totalWithSlotDenominator.toLocaleString()}</p>
                  </div>

                  {/* 帶插槽計算結果 */}
                  {calculateWithSlotHuntCounts && calculateWithSlotTotalTime && (
                    <div className='flex w-full gap-3'>
                      <div className='flex-1 p-3 text-center rounded-md bg-white/70'>
                        <div className='text-xs text-gray-600'>{t("huntTimeCalculator.Min", "Min")}</div>
                        <div className='text-lg font-bold text-emerald-600'>
                          {calculateWithSlotHuntCounts.minHunts} {t("huntTimeCalculator.hunts", "hunts")}
                        </div>
                        <div className='text-xs text-gray-500'>{formatHoursWithDays(calculateWithSlotTotalTime.minTime)}</div>
                      </div>

                      <div className='flex-1 p-3 text-center rounded-md bg-white/70'>
                        <div className='text-xs text-gray-600'>{t("huntTimeCalculator.Avg", "Avg")}</div>
                        <div className='text-lg font-bold text-amber-600'>
                          {calculateWithSlotHuntCounts.avgHunts} {t("huntTimeCalculator.hunts", "hunts")}
                        </div>
                        <div className='text-xs text-gray-500'>{formatHoursWithDays(calculateWithSlotTotalTime.avgTime)}</div>
                      </div>

                      <div className='flex-1 p-3 text-center rounded-md bg-white/70'>
                        <div className='text-xs text-gray-600'>{t("huntTimeCalculator.Max", "Max")}</div>
                        <div className='text-lg font-bold text-rose-600'>
                          {calculateWithSlotHuntCounts.maxHunts} {t("huntTimeCalculator.hunts", "hunts")}
                        </div>
                        <div className='text-xs text-gray-500'>{formatHoursWithDays(calculateWithSlotTotalTime.maxTime)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 說明文字 */}
            <div className='text-sm text-gray-600'>
              <p>
                {t("huntTimeCalculator.note", "Note")}:{" "}
                {t(
                  "huntTimeCalculator.explanation",
                  "Calculations based on monster reward range and selected time settings. Times include both hunting and rest periods."
                )}
              </p>
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
