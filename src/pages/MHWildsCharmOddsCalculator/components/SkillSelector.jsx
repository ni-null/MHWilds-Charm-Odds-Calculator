import React, { useEffect, useState } from "react"
import clsx from "clsx"
import SkillGroupsData from "../../../data/SkillGroups.json"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SkillSelector({ groups, matchingSkills, t, SKILL_PLACEHOLDER_SVG, className }) {
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
    <div className={clsx(className)}>
      {groups.length === 0 ? (
        <span className='text-sm text-gray-500'>{t("common.none", "無")}</span>
      ) : (
        Array.from({ length: groups.length }).map((_, gi) => {
          const groupId = groups[gi]
          const groupKey = `Group${groupId}`
          const gd = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || {}
          const allOptions = (gd.data && Array.isArray(gd.data) ? gd.data : []).map((d) => d.SkillName)

          const availableOptions = allOptions.filter((opt) => {
            const alreadyMatched = matchingSkills.some((skill) => {
              const skillBase = String(skill).split(" Lv.")[0]
              return skillBase === opt
            })
            return !alreadyMatched
          })

          const selected = selectedPerGroup[gi] || ""

          const isLocked = Array.isArray(lockedPerGroup) ? Boolean(lockedPerGroup[gi]) : false

          if (isLocked && selected) {
            const skillBase = selected

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
              if (Array.isArray(matchingSkills) && typeof matchingSkills[gi] === "string") {
                const m = String(matchingSkills[gi])
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
              <div key={`group-skill-${gi}`} className='flex items-center gap-3 my-1'>
                <img
                  src={imgSrc}
                  alt={skillBase}
                  loading='lazy'
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
                  <div className='text-base font-medium truncate' title={skillBase}>
                    {t(`skillTranslations.${skillBase}`, skillBase)}
                    {skillLevel > 0 ? ` Lv.${skillLevel}` : null}
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

          if (!isLocked) {
            const skillBase = selected || ""

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

            let levelChoice = 0
            try {
              if (skillBase && Array.isArray(matchingSkills) && typeof matchingSkills[gi] === "string") {
                const m = String(matchingSkills[gi])
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
              <div key={`group-item-editable-${gi}`} className='flex items-center gap-3 my-1'>
                <img
                  src={imgSrc}
                  loading='lazy'
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
                                <SelectItem key={opt} className='cursor-pointer' value={opt}>
                                  <div className='flex items-center gap-2'>
                                    <img
                                      src={imgOpt}
                                      alt={opt}
                                      loading='lazy'
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
                  <div className='flex items-center mt-1' aria-hidden>
                    {Array.from({ length: maxSlotsChoice }).map((_, i2) => (
                      <span
                        key={i2}
                        title={t("common.empty", "empty")}
                        className={clsx("inline-block mr-1.5", "w-3.5 h-3.5", "rounded-[3px]", i2 < levelChoice ? "bg-amber-400" : "bg-gray-600")}
                        style={{ boxShadow: "none" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={`group-select-${gi}`} className='flex items-center gap-3 my-1'>
              <img
                src={`${import.meta.env.BASE_URL}image/skills/${encodeURIComponent("Ambush").replace(/%2F/g, "-")}.png`}
                alt={"Ambush"}
                loading='lazy'
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
                <div className='flex items-center mt-1'>
                  {Array.from({ length: 3 }).map((_, i2) => (
                    <span
                      key={i2}
                      title={t("common.empty", "empty")}
                      className='inline-block mr-1.5 w-3.5 h-3.5 rounded-[3px] bg-gray-600 shadow-none'
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
