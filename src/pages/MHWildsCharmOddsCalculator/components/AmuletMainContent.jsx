import React, { useEffect, useState } from "react"
import clsx from "clsx"
import SkillGroupsData from "../../../data/SkillGroups.json"
import RarityData from "../../../data/Rarity.json"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { decimalToFraction } from "../../../lib/fractionUtils"
import { Ban } from "lucide-react"

export default function AmuletMainContent({ charm, t, SKILL_PLACEHOLDER_SVG }) {
  const groups = Array.isArray(charm.groups) ? charm.groups : []
  const matchingSkills = React.useMemo(() => (Array.isArray(charm.matchingSkills) ? charm.matchingSkills : []), [charm.matchingSkills])

  // 每個群組的選擇狀態（如果 matchingSkills 沒有對應項目，使用下拉選單選擇）
  const [selectedPerGroup, setSelectedPerGroup] = useState(() => {
    const arr = Array(groups.length).fill("")
    matchingSkills.forEach((sk, idx) => {
      if (idx < groups.length) arr[idx] = String(sk).split(" Lv.")[0]
    })
    return arr
  })

  // lockedPerGroup: 由 matchingSkills 初始化的群組會被鎖定（不可由介面修改）
  const [lockedPerGroup, setLockedPerGroup] = useState(() => {
    const arr = Array(groups.length).fill(false)
    matchingSkills.forEach((sk, idx) => {
      if (idx < groups.length && sk) arr[idx] = true
    })
    return arr
  })

  // 為了讓 useEffect 的依賴可靜態檢查，先計算 matchingSkillsKey
  const matchingSkillsKey = matchingSkills.join("@@||@@")

  useEffect(() => {
    // 當 charm.groups 長度或 matchingSkills 變更時，重新同步 state
    setSelectedPerGroup((prev) => {
      const next = Array(groups.length).fill("")
      matchingSkills.forEach((sk, idx) => {
        if (idx < groups.length) next[idx] = String(sk).split(" Lv.")[0]
      })
      // 保留之前使用者的選擇（如果 group 數量增加且之前有選擇）
      for (let i = 0; i < Math.min(prev.length, next.length); i++) {
        if (!next[i] && prev[i]) next[i] = prev[i]
      }
      return next
    })

    // 同步 lockedPerGroup：如果 matchingSkills 提供該 index，則鎖定
    setLockedPerGroup((prev) => {
      const next = Array(groups.length).fill(false)
      matchingSkills.forEach((sk, idx) => {
        if (idx < groups.length && sk) next[idx] = true
      })
      // 保留之前的 locked（避免群組數量縮減時丟失使用者先前的鎖定）
      for (let i = 0; i < Math.min(prev.length, next.length); i++) {
        if (!next[i] && prev[i]) next[i] = prev[i]
      }
      return next
    })
  }, [groups.length, matchingSkillsKey, matchingSkills])

  return (
    <div className='w-full'>
      <div className='flex flex-col w-full p-5 sm:flex-row'>
        <div className='flex flex-col justify-center text-white rounded-lg w-full sm:w-auto md:w-[400px]'>
          <div className='flex items-center min-w-[140px]  justify-around   sm:justify-start  mb-2 md:mb-0 md:mr-4'>
            <div className='flex flex-col '>
              <div className='flex flex-col items-center justify-center '>
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
                <div className='text-base font-medium  md:mt-1'>{charm.rarity}</div>
              </div>
              <div className='flex gap-2 md:mt-3 md:w-52 '>
                {groups.map((g, i) => {
                  const groupKey = `Group${g}`
                  const gd = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || {}
                  const bg = gd.bgColor || "#374151" // 文字顏色
                  const text = gd.color || "#ffffff" // 背景顏色

                  // 將 HEX 轉為 RGBA，並添加透明度
                  const hexToRgba = (hex, alpha) => {
                    let cleanHex = hex.replace("#", "")
                    if (cleanHex.length === 3) {
                      cleanHex = cleanHex
                        .split("")
                        .map((c) => c + c)
                        .join("")
                    }
                    const r = parseInt(cleanHex.slice(0, 2), 16)
                    const g = parseInt(cleanHex.slice(2, 4), 16)
                    const b = parseInt(cleanHex.slice(4, 6), 16)
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`
                  }

                  return (
                    <div
                      key={i}
                      className='inline-flex items-center justify-center w-16 gap-1 px-1 py-1 text-sm text-center rounded'
                      style={{ backgroundColor: hexToRgba(text, 0.5), color: bg }}>
                      <div className='flex '>
                        <span className='hidden font-semibold md:block'>{t("amulet.group", "群組")}</span>
                        <span>{g}</span>{" "}
                      </div>
                    </div>
                  )
                })}

                {groups.length < 3 && (
                  <div className='inline-flex bg-[#2f2f2f] items-center justify-center w-16 gap-1 px-1 py-1 text-sm text-center rounded'>
                    <div className='flex '>
                      <Ban className='w-4 h-4' />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* 顯示匹配的技能名稱與等級方塊（參考 UI 排版與配色） */}
            <div className='flex flex-col gap-1 ml-2'>
              {groups.length === 0 ? (
                <span className='text-sm text-gray-500'>{t("common.none", "無")}</span>
              ) : (
                Array.from({ length: groups.length }).map((_, gi) => {
                  const groupId = groups[gi]
                  const groupKey = `Group${groupId}`
                  const gd = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || {}
                  const allOptions = (gd.data && Array.isArray(gd.data) ? gd.data : []).map((d) => d.SkillName)

                  // 過濾掉已經匹配的技能選項
                  const availableOptions = allOptions.filter((opt) => {
                    const alreadyMatched = matchingSkills.some((skill) => {
                      const skillBase = String(skill).split(" Lv.")[0]
                      return skillBase === opt
                    })
                    return !alreadyMatched
                  })

                  const selected = selectedPerGroup[gi] || ""

                  // 如果該群組是由 matchingSkills 提供（lockedPerGroup[gi]），顯示靜態不可編輯；
                  // 否則若 selected 有值也允許使用者修改（select 可見）。
                  const isLocked = Array.isArray(lockedPerGroup) ? Boolean(lockedPerGroup[gi]) : false

                  if (isLocked && selected) {
                    const skillBase = selected

                    // 優先從該群組找 meta，若找不到再全域搜尋
                    let meta = (gd.data && gd.data.find((o) => o.SkillName === skillBase)) || null
                    if (!meta && SkillGroupsData && SkillGroupsData.SkillGroups) {
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

                    const maxSlots = (meta && Number(meta.SkillMax)) || 3
                    let skillLevel = 0
                    try {
                      if (Array.isArray(charm.matchingSkills) && typeof charm.matchingSkills[gi] === "string") {
                        const m = String(charm.matchingSkills[gi])
                        const lvMatch = m.match(/Lv\.(\d+)/)
                        if (lvMatch) skillLevel = Math.max(0, Number(lvMatch[1]))
                      }
                    } catch (e) {
                      void e
                    }

                    if (!skillLevel) {
                      if (meta && meta.SkillLevel) {
                        const lv = Number(meta.SkillLevel)
                        if (!isNaN(lv)) skillLevel = lv
                      }
                    }

                    skillLevel = Math.min(maxSlots, Math.max(0, Number(skillLevel) || 0))

                    const imgSrc = `${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skillBase.replace(/\//g, "-"))}.png`

                    return (
                      <div key={`group-skill-${gi}`} className='flex items-center justify-center gap-3 my-1 '>
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
                          <div className='flex items-center justify-between flex-1 min-w-0'>
                            <div className='text-base font-medium truncate' title={skillBase}>
                              {t(`skillTranslations.${skillBase}`, skillBase)}
                              {skillLevel > 0 ? ` Lv.${skillLevel}` : null}
                            </div>
                          </div>

                          <div className='flex items-center mt-1' aria-hidden>
                            {Array.from({ length: maxSlots }).map((_, i2) => {
                              const isFilled = i2 < skillLevel
                              return (
                                <span
                                  key={i2}
                                  title={t("common.empty", "empty")}
                                  className={clsx("inline-block mr-1.5", "w-3.5 h-3.5", "rounded-[3px]", isFilled ? "bg-amber-400" : "bg-gray-600")}
                                  style={{ boxShadow: "none" }}
                                />
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // 若該群組為 locked（來自 matchingSkills），且沒有選擇則也當作靜態空格處理；
                  // 只有 isLocked === false 的群組會顯示 editable select
                  if (!isLocked) {
                    // selected 為空或有值：顯示可編輯的 select 與根據選擇顯示的圖示/等級
                    const skillBase = selected || ""

                    // 先找 meta（群組內優先，找不到再全域搜尋）
                    let metaChoice = (gd.data && gd.data.find((o) => o.SkillName === skillBase)) || null
                    if (!metaChoice && skillBase && SkillGroupsData && SkillGroupsData.SkillGroups) {
                      for (const gk of Object.keys(SkillGroupsData.SkillGroups)) {
                        const group = SkillGroupsData.SkillGroups[gk]
                        if (!group || !Array.isArray(group.data)) continue
                        const found = group.data.find((o) => o.SkillName === skillBase)
                        if (found) {
                          metaChoice = found
                          break
                        }
                      }
                    }

                    const imgSrc = skillBase
                      ? `${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skillBase.replace(/\//g, "-"))}.png`
                      : `${import.meta.env.BASE_URL}image/skills/${encodeURIComponent("Ambush").replace(/%2F/g, "-")}.png`

                    const maxSlotsChoice = (metaChoice && Number(metaChoice.SkillMax)) || 3

                    // 計算等級：優先嘗試從 charm.matchingSkills 取得對應群組的等級，否則使用 meta 的 SkillLevel
                    let levelChoice = 0
                    try {
                      if (skillBase && Array.isArray(charm.matchingSkills) && typeof charm.matchingSkills[gi] === "string") {
                        const m = String(charm.matchingSkills[gi])
                        const lvMatch = m.match(/Lv\.(\d+)/)
                        if (lvMatch) levelChoice = Math.max(0, Number(lvMatch[1]))
                      }
                    } catch (e) {
                      void e
                    }

                    if (!levelChoice && metaChoice && metaChoice.SkillLevel) {
                      const lv = Number(metaChoice.SkillLevel)
                      if (!isNaN(lv)) levelChoice = lv
                    }

                    levelChoice = Math.min(maxSlotsChoice, Math.max(0, Number(levelChoice) || 0))

                    return (
                      <div key={`group-item-editable-${gi}`} className='flex items-center justify-center gap-3 my-1'>
                        <img
                          src={imgSrc}
                          alt={skillBase || "Ambush"}
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
                          <div className='flex items-center justify-between flex-1 min-w-0'>
                            <div className='text-base font-medium truncate' title={skillBase}>
                              <Select
                                value={selected}
                                onValueChange={(v) => {
                                  setSelectedPerGroup((prev) => {
                                    const copy = prev.slice()
                                    copy[gi] = v || ""
                                    return copy
                                  })
                                }}>
                                <SelectTrigger className='px-2 py-1 text-sm text-white bg-gray-800 border-none rounded h-7'>
                                  <SelectValue placeholder={`-- ${t("amulet.selectSkill", "選擇技能")} --`}>
                                    {selected ? t(`skillTranslations.${selected}`, selected) : null}

                                    {levelChoice > 0 ? ` Lv.${levelChoice}` : null}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent
                                  side='bottom'
                                  className='text-white bg-[#1f2937] border-none'
                                  position='popper'
                                  align='start'
                                  avoidCollisions={false}>
                                  <SelectGroup>
                                    <SelectLabel>
                                      {t("amulet.group", "群組")} {groupId}
                                      <span className='ml-3 text-xs text-gray-400'>
                                        {availableOptions.length} {t("common.skills", "技能")}
                                      </span>
                                    </SelectLabel>
                                    {availableOptions.length === 0 ? (
                                      <SelectItem value=''>{t("common.none", "無")}</SelectItem>
                                    ) : (
                                      availableOptions.map((opt) => {
                                        // find meta
                                        let metaOpt = (gd.data && gd.data.find((o) => o.SkillName === opt)) || null
                                        if (!metaOpt && SkillGroupsData && SkillGroupsData.SkillGroups) {
                                          for (const gk of Object.keys(SkillGroupsData.SkillGroups)) {
                                            const group = SkillGroupsData.SkillGroups[gk]
                                            if (!group || !Array.isArray(group.data)) continue
                                            const found = group.data.find((o) => o.SkillName === opt)
                                            if (found) {
                                              metaOpt = found
                                              break
                                            }
                                          }
                                        }
                                        const maxSlotsOpt = (metaOpt && Number(metaOpt.SkillMax)) || 3
                                        const levelOpt = metaOpt && metaOpt.SkillLevel ? Number(metaOpt.SkillLevel) : 0
                                        const imgOpt = `${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(opt.replace(/\//g, "-"))}.png`

                                        return (
                                          <SelectItem key={opt} className='cursor-pointer ' value={opt}>
                                            <div className='flex items-center gap-2 '>
                                              <img
                                                src={imgOpt}
                                                alt={opt}
                                                className='object-contain w-6 h-6 rounded'
                                                onError={(e) => {
                                                  try {
                                                    if (!e || !e.currentTarget) return
                                                    const el = e.currentTarget
                                                    if (el.src && el.src.indexOf("data:image/svg+xml") === -1) el.src = SKILL_PLACEHOLDER_SVG
                                                  } catch (err) {
                                                    void err
                                                  }
                                                }}
                                              />
                                              <div className='flex-1 min-w-0'>
                                                <div className='text-sm truncate'>
                                                  {t(`skillTranslations.${opt}`, opt)}
                                                  {levelOpt > 0 ? ` Lv.${levelOpt}` : null}
                                                </div>
                                                <div className='flex items-center mt-1' aria-hidden>
                                                  {Array.from({ length: maxSlotsOpt }).map((_, ii) => (
                                                    <span
                                                      key={ii}
                                                      className={clsx(
                                                        "inline-block mr-1.5",
                                                        "w-2 h-2",
                                                        "rounded-[3px]",
                                                        ii < levelOpt ? "bg-amber-400" : "bg-gray-600"
                                                      )}
                                                      style={{ boxShadow: "none" }}
                                                    />
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          </SelectItem>
                                        )
                                      })
                                    )}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>

                            {/*        <div className='text-sm font-medium min-w-[80px] ml-2'>
                            {t("amulet.group", "群組")} {groupId}
                          </div> */}
                          </div>

                          <div className='flex items-center mt-1' aria-hidden>
                            {Array.from({ length: maxSlotsChoice }).map((_, i2) => (
                              <span
                                key={i2}
                                title={t("common.empty", "empty")}
                                className={clsx(
                                  "inline-block mr-1.5",
                                  "w-3.5 h-3.5",
                                  "rounded-[3px]",
                                  i2 < levelChoice ? "bg-amber-400" : "bg-gray-600"
                                )}
                                style={{ boxShadow: "none" }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // locked 且沒有 selected：顯示空格（不可編輯）
                  return (
                    <div key={`group-select-${gi}`} className='flex items-center justify-center gap-3 my-1'>
                      <img
                        src={`${import.meta.env.BASE_URL}image/skills/${encodeURIComponent("Ambush").replace(/%2F/g, "-")}.png`}
                        alt={"Ambush"}
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
                        <div className='flex items-center justify-between flex-1 min-w-0'>
                          <div className='text-base font-medium truncate' title={""}>
                            <select
                              value={selected}
                              onChange={(e) => {
                                const v = e.target.value || ""
                                setSelectedPerGroup((prev) => {
                                  const copy = prev.slice()
                                  copy[gi] = v
                                  return copy
                                })
                              }}
                              className='px-2 py-1 text-sm text-white bg-gray-800 rounded'>
                              <option value=''>-- {t("amulet.selectSkill", "選擇技能")} --</option>
                              {availableOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {t(`skillTranslations.${opt}`, opt)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className='text-sm font-medium min-w-[80px] ml-2'>
                            {t("amulet.group", "群組")} {groupId}
                          </div>
                        </div>

                        <div className='flex items-center mt-1'>
                          {/* 顯示空插槽格 */}
                          {Array.from({ length: 3 }).map((_, i2) => (
                            <span
                              key={i2}
                              title={t("common.empty", "empty")}
                              className='inline-block mr-1.5 w-3.5 h-3.5 rounded-[3px] bg-gray-600   shadow-none'
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
        </div>

        {/* 顯示組別 和 組別可能存在的插槽組合圖示 (使用 charm.AllslotKey) */}
        <div className='flex flex-col w-full gap-2 mx-auto mt-5 md:w-auto'>
          {Array.isArray(charm.AllslotKey) && charm.AllslotKey.length > 0 ? (
            charm.AllslotKey.map((slotKey, si) => {
              const slotImgSrcs = []
              let display = String(slotKey)

              try {
                const arr = typeof slotKey === "string" ? JSON.parse(slotKey) : slotKey
                if (Array.isArray(arr)) {
                  display = `[${arr.join(", ")}]`
                  arr.forEach((v) => {
                    if (typeof v === "string" && v.startsWith("W")) slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                    else if (typeof v === "number") slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${Math.min(Math.max(1, v), 3)}.png`)
                  })
                }
              } catch {
                if (typeof slotKey === "string" && slotKey.includes("W")) slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                else if (!isNaN(Number(slotKey)))
                  slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${Math.min(Math.max(1, Number(slotKey)), 3)}.png`)
              }

              const getSlotProbability = (rk, groupsArr, sk) => {
                try {
                  const rarityObj = (RarityData && RarityData[rk]) || {}
                  const rawKey = String(sk)
                  let normKeyJson = rawKey
                  let normKeyNoSpace = rawKey.replace(/\s+/g, "")
                  try {
                    const parsed = typeof sk === "string" ? JSON.parse(sk) : sk
                    normKeyJson = JSON.stringify(parsed)
                    normKeyNoSpace = normKeyJson.replace(/\s+/g, "")
                  } catch {}

                  const groups = Array.isArray(rarityObj.Group) ? rarityObj.Group : []
                  for (const g of groups) {
                    const skills = Array.isArray(g.skills) ? g.skills : []
                    if (skills.length === groupsArr.length && skills.every((v, i) => Number(v) === Number(groupsArr[i])) && g.slot) {
                      const keysToTry = [normKeyJson, normKeyNoSpace, rawKey]
                      for (const kk of keysToTry) if (g.slot[kk] != null) return Number(g.slot[kk]) || 0
                    }
                  }

                  let normals = rarityObj.normalslot?.slot || {}
                  const keysToTry = [normKeyJson, normKeyNoSpace, rawKey]
                  for (const kk of keysToTry) if (normals[kk] != null) return Number(normals[kk]) || 0

                  return null
                } catch {
                  return null
                }
              }

              const slotProb = getSlotProbability(charm.rarity, charm.groups, slotKey)

              // 單一扁平化 container
              return (
                <div key={si} className='flex items-center justify-between gap-2 sm:justify-start'>
                  <div className='flex items-center'>
                    {slotImgSrcs.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt='slot'
                        className='object-contain w-8 h-8'
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ))}
                    <span className='ml-3 text-sm text-gray-200'>{display}</span>
                    <span className='ml-3 text-sm text-gray-400'>({(slotProb * 100).toFixed(2)}%)</span>
                  </div>

                  {slotProb != null && (
                    <>
                      {(() => {
                        try {
                          const finalNoSlot = Number(charm?.computed?.finalNoSlot || 0)
                          if (finalNoSlot > 0) {
                            const combined = slotProb * finalNoSlot
                            if (combined > 0)
                              return (
                                <span className='text-sm text-gray-300' title={`combined: ${combined}`}>
                                  &nbsp;•&nbsp;{decimalToFraction(combined)}
                                </span>
                              )
                          }
                        } catch {}
                        return null
                      })()}
                    </>
                  )}
                </div>
              )
            })
          ) : (
            <span className='ml-2 text-sm text-gray-400'>{t("common.none", "無")}</span>
          )}
        </div>
      </div>
      <div className='flex flex-row justify-between w-full'>
        {/*顯示 最終機率 finalNoSlot */}
        <div className='mr-0 text-2xl font-bold md:pr-3'>
          {(() => {
            const raw = charm && charm.computed && (charm.computed.finalNoSlot || 0)
            const chance = Number(raw)

            if (!chance || chance <= 0) {
              return <div>{t("common.skillProbability", "技能機率")}: 1/∞</div>
            }

            return (
              <div>
                {t("common.skillProbability", "技能機率")}: {decimalToFraction(chance)}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
