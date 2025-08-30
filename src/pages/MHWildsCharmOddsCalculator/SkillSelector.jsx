import React, { useMemo, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import useMhwStore from "../../store/mhwStore"
import rarityBaseProbability from "../../data/Rarity.json"
import SkillGroupsData from "../../data/SkillGroups.json"

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SkillSelector() {
  const { t, i18n } = useTranslation()
  // inline placeholder SVG used when skill icon fails to load
  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
        "<rect fill='%23efefef' width='100%' height='100%'/>" +
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23999'>?" +
        "</text></svg>"
    )
  // Per-slot search inputs are local to each Select to avoid parent re-renders
  // remounting the Input in the SelectContent and causing focus loss.

  // use store values; store defines AvlCharms/setAvlCharms (not Charms/setCharms)
  const { selectedSkills, setSelectedSkills, selectedSlot, setSelectedSlot, AvlCharms, setAvlCharms } = useMhwStore()

  useEffect(() => {
    console.log(selectedSkills)
  }, [selectedSkills])

  useEffect(() => {
    console.log(AvlCharms)
  }, [AvlCharms])

  // build global list of slot options from rarity data
  const slotOptions = React.useMemo(() => {
    const setKeys = new Set()
    Object.values(rarityBaseProbability).forEach((r) => {
      const groups = (r && r.Group) || []
      if (groups.length) {
        groups.forEach((g) => {
          const slotObj = (g && g.slot) || {}
          Object.keys(slotObj).forEach((k) => setKeys.add(k))
        })
      }
    })
    // custom sort:
    // - parse each key as JSON array when possible (e.g. "[1, 1]")
    // - compare segment-by-segment: numbers compare numerically, numbers come before strings
    // - strings that start with "W" are ordered after numeric/string slots
    // - if all segments equal, shorter array (parent) comes before longer (child)
    const parseKey = (k) => {
      try {
        const parsed = JSON.parse(k)
        if (Array.isArray(parsed)) return parsed
      } catch {
        /* ignore */
      }
      // fallback: strip brackets and split by comma
      const s = String(k).replace(/^\[|\]$/g, "")
      if (s.trim() === "") return []
      return s.split(/\s*,\s*/).map((p) => {
        // try convert to number
        const n = Number(p)
        if (!isNaN(n) && p !== "") return n
        // keep as string
        return p
      })
    }

    const typeOrder = (v) => {
      if (typeof v === "number") return 1
      if (typeof v === "string" && v.startsWith("W")) return 3
      return 2 // other strings
    }

    const cmp = (a, b) => {
      const pa = parseKey(a)
      const pb = parseKey(b)
      const len = Math.min(pa.length, pb.length)
      for (let i = 0; i < len; i++) {
        const va = pa[i]
        const vb = pb[i]
        if (va === vb) continue

        const ta = typeOrder(va)
        const tb = typeOrder(vb)
        if (ta !== tb) return ta - tb

        // same type
        if (typeof va === "number" && typeof vb === "number") return va - vb

        // both strings (non-W or both W)
        const sa = String(va).toLowerCase()
        const sb = String(vb).toLowerCase()
        if (sa < sb) return -1
        if (sa > sb) return 1
        return 0
      }

      // all compared segments equal -> shorter (parent) first
      if (pa.length !== pb.length) return pa.length - pb.length

      // final fallback: string compare of original key
      const sa = String(a).toLowerCase()
      const sb = String(b).toLowerCase()
      if (sa < sb) return -1
      if (sa > sb) return 1
      return 0
    }

    return Array.from(setKeys).sort(cmp)
  }, [])

  // 建立技能(含等級)到群組號的映射（只需在此組件內部）
  const skillToGroupMap = useMemo(() => {
    const map = {}
    Object.keys(SkillGroupsData.SkillGroups).forEach((groupKey) => {
      const groupNumber = parseInt(groupKey.replace("Group", ""))
      SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
        const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
        if (!map[skillKey]) map[skillKey] = []
        map[skillKey].push(groupNumber)
      })
    })
    return map
  }, [])

  // 獲取所有技能（過濾重複）
  const getAllUniqueSkills = useMemo(() => {
    const allSkills = new Set()
    Object.keys(SkillGroupsData.SkillGroups).forEach((groupKey) => {
      SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
        allSkills.add(`${skill.SkillName} Lv.${skill.SkillLevel}`)
      })
    })
    return Array.from(allSkills).sort()
  }, [])

  // helper: normalize slot/key string to a stable JSON string when possible
  const normalizeSlotKey = useCallback((k) => {
    if (!k && k !== 0) return String(k)
    try {
      const parsed = JSON.parse(k)
      return JSON.stringify(parsed)
    } catch {
      // fallback: collapse whitespace
      return String(k).replace(/\s+/g, "")
    }
  }, [])

  // helper: get base skill name without level
  const baseName = useCallback((skillKey) => String(skillKey).split(" Lv.")[0], [])

  // helper: validate that an amulet's groups do not contain the same base skill name in multiple groups
  const isAmuletGroupsValid = useCallback((amulet) => {
    const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)
    const nameToGroupCount = {}
    for (let gi = 0; gi < amuletGroups.length; gi++) {
      const groupNumber = amuletGroups[gi]
      const groupKey = `Group${groupNumber}`
      const group = SkillGroupsData.SkillGroups[groupKey]
      if (!group) continue
      const seen = new Set()
      group.data.forEach((skill) => {
        const b = String(skill.SkillName)
        if (!seen.has(b)) {
          seen.add(b)
          nameToGroupCount[b] = (nameToGroupCount[b] || 0) + 1
          if (nameToGroupCount[b] > 1) {
            // duplicate base found across groups -> invalid amulet
            return
          }
        }
      })
      // early exit if any duplicate was found
      for (const k in nameToGroupCount) {
        if (nameToGroupCount[k] > 1) return false
      }
    }
    return true
  }, [])

  // build a virtual amulet list with parsed slotKey to reuse in both skills and slots filtering
  const virtualAmulets = useMemo(() => {
    const arr = []
    Object.entries(rarityBaseProbability).forEach(([rarity, data]) => {
      const groups = data.Group || []
      // Each group entry corresponds to a possible amulet combination; slot keys may be defined per-group
      groups.forEach((gObj) => {
        const slots = (gObj && gObj.slot) || {}
        Object.keys(slots).forEach((slotKey) => {
          const skills = gObj.skills || []
          const amulet = {
            Rarity: rarity,
            slotKeyOriginal: slotKey,
            slotKeyNormalized: normalizeSlotKey(slotKey),
            Skill1Group: skills[0] || null,
            Skill2Group: skills[1] || null,
            Skill3Group: skills[2] || null,
          }
          // include all amulet definitions from data; validation against selected skills
          // is performed later when computing matches
          arr.push(amulet)
        })
      })
    })
    return arr
  }, [normalizeSlotKey])

  // compute slot options filtered by currently selected skills
  const filteredSlotOptions = useMemo(() => {
    // if no skills chosen at all, return all slotOptions
    const anySkillChosen = selectedSkills.some((arr) => (Array.isArray(arr) ? arr.length > 0 : !!arr))
    if (!anySkillChosen) return slotOptions

    const validSet = new Set()

    const canAssignSelectedToAmulet = (amulet) => {
      // amulet groups in order
      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)
      // build list of chosen skill keys per earlier slot (treat per-slot multi-select as OR)
      const chosenPerSlot = selectedSkills.map((s) => (Array.isArray(s) ? s.slice() : s ? [s] : [])).filter((arr) => arr.length > 0)

      // if no chosen slots, trivially true
      if (chosenPerSlot.length === 0) return true

      // backtracking: for each chosen slot, pick one of its selected skills and assign to a distinct amuletGroup index
      const used = new Set()
      const dfsSlot = (slotIdx) => {
        if (slotIdx >= chosenPerSlot.length) return true
        const options = chosenPerSlot[slotIdx]
        for (let optIdx = 0; optIdx < options.length; optIdx++) {
          const skillKey = options[optIdx]
          const groups = skillToGroupMap[skillKey] || []
          for (let j = 0; j < amuletGroups.length; j++) {
            if (used.has(j)) continue
            if (groups.includes(amuletGroups[j])) {
              used.add(j)
              if (dfsSlot(slotIdx + 1)) return true
              used.delete(j)
            }
          }
        }
        return false
      }

      return dfsSlot(0)
    }

    virtualAmulets.forEach((amulet) => {
      if (canAssignSelectedToAmulet(amulet)) validSet.add(amulet.slotKeyOriginal)
    })

    return slotOptions.filter((k) => validSet.has(k))
  }, [selectedSkills, skillToGroupMap, slotOptions, virtualAmulets])

  // When selectedSkills or selectedSlot change, compute matching amulet combinations
  // and store them into the global store as AvlCharms via setAvlCharms.
  useEffect(() => {
    // Build aggregated matches keyed by rarity + groups
    const chosenPerSlot = selectedSkills.map((s) => (Array.isArray(s) ? s.slice() : s ? [s] : [])).filter((arr) => arr.length > 0)

    const canAssignSelectedToAmulet = (amulet) => {
      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)
      if (chosenPerSlot.length === 0) return true
      const used = new Set()
      const dfs = (slotIdx) => {
        if (slotIdx >= chosenPerSlot.length) return true
        const options = chosenPerSlot[slotIdx]
        for (let oi = 0; oi < options.length; oi++) {
          const skillKey = options[oi]
          const groups = skillToGroupMap[skillKey] || []
          for (let j = 0; j < amuletGroups.length; j++) {
            if (used.has(j)) continue
            if (groups.includes(amuletGroups[j])) {
              used.add(j)
              if (dfs(slotIdx + 1)) return true
              used.delete(j)
            }
          }
        }
        return false
      }
      return dfs(0)
    }

    // map key -> { rarity, groups, matchingSkills:Set, slotKeys:Set }
    const matchMap = new Map()

    virtualAmulets.forEach((amulet) => {
      if (selectedSlot && normalizeSlotKey(selectedSlot) !== amulet.slotKeyNormalized) return
      // We'll enumerate concrete assignments of selected skills to this amulet's groups
      const groups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)

      // if no selected skills, treat as a single assignment with empty matchingSkills
      const selectedFlat = selectedSkills.flatMap((s) => (Array.isArray(s) ? s : s ? [s] : []))
      if (selectedFlat.length === 0) {
        // only include if amulet can be used (no constraint)
        if (!canAssignSelectedToAmulet(amulet)) return
        const mapKey = `${amulet.Rarity}|${JSON.stringify(groups)}|[]`
        if (!matchMap.has(mapKey)) {
          matchMap.set(mapKey, {
            rarity: amulet.Rarity,
            groups: groups.slice(),
            matchingSkills: new Set(),
            slotKeys: new Set(),
          })
        }
        matchMap.get(mapKey).slotKeys.add(amulet.slotKeyOriginal)
        return
      }

      // build per-slot arrays (preserve original per-slot grouping order)
      const perSlot = selectedSkills.map((s) => (Array.isArray(s) ? s.slice() : s ? [s] : [])).filter((arr) => arr.length > 0)
      if (perSlot.length === 0) return

      // enumerate assignments: for each earlier slot choose one selected skill and assign it to a distinct amulet group index
      const assignments = []
      const usedIdx = []
      const chosenSoFar = []
      const dfsAssign = (si) => {
        if (si >= perSlot.length) {
          assignments.push({ chosen: chosenSoFar.slice(), used: new Set(usedIdx) })
          return
        }
        const options = perSlot[si]
        for (let oi = 0; oi < options.length; oi++) {
          const optSkillKey = options[oi]
          const groupsForSkill = skillToGroupMap[optSkillKey] || []
          for (let j = 0; j < groups.length; j++) {
            if (usedIdx.includes(j)) continue
            if (groupsForSkill.includes(groups[j])) {
              usedIdx.push(j)
              chosenSoFar.push(optSkillKey)
              dfsAssign(si + 1)
              chosenSoFar.pop()
              usedIdx.pop()
            }
          }
        }
      }

      dfsAssign(0)

      if (assignments.length === 0) return

      // For each distinct chosen-skills set, aggregate an entry (so different assignments that pick different
      // selected skills produce separate AvlCharms entries even if rarity+groups are same)
      assignments.forEach((assignment) => {
        const chosenSet = Array.from(new Set(assignment.chosen)).slice().sort()
        const mapKey = `${amulet.Rarity}|${JSON.stringify(groups)}|${JSON.stringify(chosenSet)}`
        if (!matchMap.has(mapKey)) {
          matchMap.set(mapKey, {
            rarity: amulet.Rarity,
            groups: groups.slice(),
            matchingSkills: new Set(chosenSet),
            slotKeys: new Set(),
          })
        }
        matchMap.get(mapKey).slotKeys.add(amulet.slotKeyOriginal)
      })
    })

    // convert map entries to final array shape, converting Sets to arrays
    const aggregated = Array.from(matchMap.values()).map((e) => ({
      rarity: e.rarity,
      groups: e.groups,
      matchingSkills: Array.from(e.matchingSkills).sort(),
      slotKeys: Array.from(e.slotKeys),
    }))

    setAvlCharms(aggregated)
  }, [selectedSkills, selectedSlot, virtualAmulets, skillToGroupMap, normalizeSlotKey, setAvlCharms])

  // when filteredSlotOptions changes, ensure selectedSlot is still valid
  // (moved below getAvailableSkills to avoid referencing it before initialization)

  const getAvailableSkills = useCallback(
    (slotIndex) => {
      // normalize current slot selections
      // (not used directly here but kept for clarity)

      // if slotIndex is 0: show all skills if no slot filter; otherwise only skills appearing in amulets for that slot
      if (slotIndex === 0) {
        if (!selectedSlot) return getAllUniqueSkills

        const possible = new Set()
        const matchingAmulets = virtualAmulets.filter((a) => normalizeSlotKey(selectedSlot) === a.slotKeyNormalized)
        matchingAmulets.forEach((amulet) => {
          const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)
          amuletGroups.forEach((groupNumber) => {
            const groupKey = `Group${groupNumber}`
            if (SkillGroupsData.SkillGroups[groupKey]) {
              SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
                possible.add(`${skill.SkillName} Lv.${skill.SkillLevel}`)
              })
            }
          })
        })

        return Array.from(possible).sort()
      }

      // For slotIndex 1 or 2: build available skills that can coexist with already selected skills in earlier slots
      // We'll collect possible skills by checking amulets that contain matches for already chosen skill-sets
      const earlierChosen = []
      for (let i = 0; i < slotIndex; i++) {
        const arr = Array.isArray(selectedSkills[i]) ? selectedSkills[i] : selectedSkills[i] ? [selectedSkills[i]] : []
        earlierChosen.push(...arr)
      }

      // if no earlier choice, return [] (we require previous slots to be chosen to show dependent options)
      if (earlierChosen.length === 0) return []

      // exclude already chosen earlier skills by base name to catch same skills with different levels
      const earlierBaseSet = new Set(earlierChosen.map(baseName))

      const possibleSkills = new Set()
      const matchingAmulets = virtualAmulets.filter((a) => {
        if (!isAmuletGroupsValid(a)) return false
        if (!selectedSlot) return true
        return normalizeSlotKey(selectedSlot) === a.slotKeyNormalized
      })

      matchingAmulets.forEach((amulet) => {
        const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null)
        // check if amulet can assign all earlierChosen items

        // Treat earlierChosen per-slot as OR; build perSlot options
        const perSlot = []
        for (let si = 0; si < slotIndex; si++) {
          const arr = Array.isArray(selectedSkills[si]) ? selectedSkills[si] : selectedSkills[si] ? [selectedSkills[si]] : []
          if (arr.length > 0) perSlot.push(arr.slice())
        }

        if (perSlot.length === 0) {
          // nothing chosen earlier; shouldn't reach here due to earlier guard, but skip
          return
        }

        // enumerate all valid assignments (map each earlier slot to a distinct amulet group index)
        // We record both which group indices are used AND the chosen base skill names for that assignment.
        // A candidate skill from a remaining group is only allowed if there exists at least one
        // assignment where the candidate's base name is NOT among the chosen bases in that assignment.
        const assignments = []
        const usedIdx = []
        const chosenSoFar = []
        const dfsAssign = (si) => {
          if (si >= perSlot.length) {
            // store used indexes set and chosen base names set for this assignment
            assignments.push({ used: new Set(usedIdx), bases: new Set(chosenSoFar.map((k) => baseName(k))) })
            return
          }
          const options = perSlot[si]
          for (let oi = 0; oi < options.length; oi++) {
            const optSkillKey = options[oi]
            const groups = skillToGroupMap[optSkillKey] || []
            for (let j = 0; j < amuletGroups.length; j++) {
              if (usedIdx.includes(j)) continue
              if (groups.includes(amuletGroups[j])) {
                usedIdx.push(j)
                chosenSoFar.push(optSkillKey)
                dfsAssign(si + 1)
                chosenSoFar.pop()
                usedIdx.pop()
              }
            }
          }
        }

        dfsAssign(0)

        if (assignments.length === 0) return

        // For each assignment, consider remaining groups and add candidate skills only if
        // the candidate's base name is not present among chosen bases for that assignment.
        const candidateSkills = new Set()
        assignments.forEach((assignment) => {
          for (let gi = 0; gi < amuletGroups.length; gi++) {
            if (assignment.used.has(gi)) continue
            const groupNumber = amuletGroups[gi]
            const groupKey = `Group${groupNumber}`
            if (SkillGroupsData.SkillGroups[groupKey]) {
              SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
                const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
                // allow candidate if its base name isn't already chosen in this assignment
                if (!assignment.bases.has(baseName(skillKey))) candidateSkills.add(skillKey)
              })
            }
          }
        })

        // For each assignment, we must ensure there exists at least one way to
        // pick one skill from each remaining group such that no base skill name
        // is duplicated when combined with the already chosen bases in the assignment.
        assignments.forEach((assignment) => {
          const remIdxs = []
          for (let gi = 0; gi < amuletGroups.length; gi++) {
            if (!assignment.used.has(gi)) remIdxs.push(gi)
          }

          // DFS over remaining groups to find any full selection of skills without base duplicates
          const chosenBasesStart = new Set(assignment.bases)
          const dfsRem = (ri, chosenBases, chosenSkills) => {
            if (ri >= remIdxs.length) {
              // record all chosen skills from this successful selection
              chosenSkills.forEach((s) => possibleSkills.add(s))
              return
            }
            const groupIdx = remIdxs[ri]
            const groupNumber = amuletGroups[groupIdx]
            const groupKey = `Group${groupNumber}`
            if (!SkillGroupsData.SkillGroups[groupKey]) return
            const data = SkillGroupsData.SkillGroups[groupKey].data
            for (let si = 0; si < data.length; si++) {
              const skill = data[si]
              const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
              const b = baseName(skillKey)
              if (chosenBases.has(b)) continue
              chosenBases.add(b)
              chosenSkills.push(skillKey)
              dfsRem(ri + 1, chosenBases, chosenSkills)
              chosenSkills.pop()
              chosenBases.delete(b)
            }
          }

          dfsRem(0, new Set(chosenBasesStart), [])
        })
      })

      // NOTE: previously we filtered out skills whose base name matched an earlier
      // chosen skill (to prevent selecting the same skill at different levels).
      // That exclusion has been removed so the select will include already-selected
      // skills. Keep sorting but do not exclude by base name.
      const filtered = Array.from(possibleSkills).sort()

      // debug logs in dev to help trace why select3 appears when expected empty
      try {
        if (import.meta.env && import.meta.env.DEV) {
          console.debug("getAvailableSkills debug", {
            slotIndex,
            earlierChosen,
            earlierBaseSet: Array.from(earlierBaseSet),
            matchingAmuletsCount: matchingAmulets.length,
            possibleSkillsCount: possibleSkills.size,
            filteredCount: filtered.length,
            filteredSample: filtered.slice(0, 10),
          })
        }
      } catch {
        /* ignore */
      }

      return filtered
    },
    [selectedSkills, skillToGroupMap, getAllUniqueSkills, virtualAmulets, selectedSlot, normalizeSlotKey, isAmuletGroupsValid, baseName]
  )

  const getSkillGroupInfo = (skillKey) => {
    const groups = skillToGroupMap[skillKey]
    return groups ? groups.join(", ") : "Unknown"
  }

  const selected0 = selectedSkills[0]
  const selected1 = selectedSkills[1]

  // Ensure downstream selected skills remain valid when earlier selections change.
  useEffect(() => {
    // Validate slots 1 and 2 (indexes 1 and 2)
    {
      const copy = [...selectedSkills]
      let changed = false

      for (let i = 1; i < 3; i++) {
        const arr = Array.isArray(copy[i]) ? copy[i] : copy[i] ? [copy[i]] : []
        if (arr.length > 0) {
          const available = getAvailableSkills(i)
          // if any selected item is no longer available, clear this and later slots
          const anyInvalid = arr.some((it) => !available.includes(it))
          if (anyInvalid) {
            for (let j = i; j < 3; j++) {
              if (Array.isArray(copy[j]) ? copy[j].length > 0 : copy[j]) {
                copy[j] = []
                changed = true
              }
            }
            break
          }
        }
      }

      if (changed) setSelectedSkills(copy)
    }
  }, [getAvailableSkills, setSelectedSkills, selected0, selected1, selectedSkills])

  return (
    <section className='w-full p-5 mb-8 bg-white md:p-10 rounded-xl'>
      <h2 className='mb-4 text-xl font-semibold'>
        {t("skillSelector.title")} {t("skillSelector.maxSkills")}
      </h2>

      <div className='grid grid-cols-1 gap-4 mb-4 xl:grid-cols-3'>
        {[0, 1, 2].map((i) => {
          const available = getAvailableSkills(i).length > 0
          const prev = selectedSkills[i - 1]
          const prevHas = Array.isArray(prev) ? prev.length > 0 : !!prev
          const shouldShow = i === 0 ? available : prevHas && available
          if (!shouldShow) return null

          const SkillSelectSlot = () => {
            const [localSearch, setLocalSearch] = React.useState("")

            const selectedArray = Array.isArray(selectedSkills[i]) ? selectedSkills[i] : selectedSkills[i] ? [selectedSkills[i]] : []

            return (
              <div className='flex flex-col' key={i}>
                <label className='mb-2 text-sm font-medium'>{t(`skillSelector.skill${i + 1}`)}</label>
                <div className='flex items-center gap-2'>
                  <Select value={""} onValueChange={() => {}}>
                    <SelectTrigger className='w-full h-auto min-h-[40px] px-3 text-base md:min-h-[56px] md:px-4 md:text-lg'>
                      <div className='flex items-center w-full'>
                        {/* When nothing selected show the placeholder SelectValue; otherwise show badges */}
                        {selectedArray.length === 0 ? (
                          <SelectValue placeholder={t("skillSelector.selectSkill")} />
                        ) : (
                          <div className='flex flex-wrap items-center w-full max-w-full gap-2 overflow-hidden'>
                            {selectedArray.map((sel) => {
                              const selName = sel.split(" Lv.")[0]
                              const selLevel = sel.split(" Lv.")[1] || ""
                              const translatedSel = t(`skillTranslations.${selName}`, selName)

                              const useFullwidthParens = i18n.language && (i18n.language.startsWith("zh") || i18n.language === "jaJP")
                              const imgSrc = `${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(selName.replace(/\//g, "-"))}.png`
                              const nameNode = useFullwidthParens ? `${translatedSel} ${t("common.level")}${selLevel}` : sel
                              return (
                                <div key={sel} className='flex items-center gap-2 px-2 py-1 bg-gray-100 rounded'>
                                  <img
                                    src={imgSrc}
                                    alt={selName}
                                    className='object-contain w-5 h-5'
                                    onError={(e) => (e.currentTarget.src = SKILL_PLACEHOLDER_SVG)}
                                  />
                                  <span className='text-sm truncate max-w-[10rem] md:max-w-[14rem]'>{nameNode}</span>
                                  {/* remove button for this selected skill badge */}
                                  <button
                                    type='button'
                                    aria-label={t("skillSelector.removeSelected", "Remove")}
                                    onPointerDown={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }} /* prevent blur and stop Select from handling */
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const copy = selectedSkills.slice()
                                      const arr = Array.isArray(copy[i]) ? copy[i].slice() : copy[i] ? [copy[i]] : []
                                      const idx = arr.indexOf(sel)
                                      if (idx !== -1) arr.splice(idx, 1)
                                      copy[i] = arr
                                      // clear later slots when removing earlier ones
                                      if (i < 2 && arr.length === 0) {
                                        for (let j = i + 1; j < 3; j++) copy[j] = []
                                      }
                                      setSelectedSkills(copy)
                                    }}
                                    className=' px-2 py-0.5 rounded text-sm hover:bg-gray-200'>
                                    ×
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </SelectTrigger>
                    <SelectContent side='bottom' position='popper'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Input
                          ref={React.createRef()}
                          type='text'
                          value={localSearch}
                          onChange={(e) => setLocalSearch(e.target.value)}
                          // avoid stopping propagation so Radix can manage focus while allowing typing
                          placeholder={t("skillSelector.searchSkill")}
                          className='flex-1'
                        />
                        <button
                          type='button'
                          aria-label={t("skillSelector.clearSelection", "Clear selection")}
                          className='p-1 text-sm rounded hover:bg-gray-100'
                          onMouseDown={(e) => e.preventDefault()} /* prevent blur */
                          onClick={(e) => {
                            e.stopPropagation()
                            const copy = selectedSkills.slice()
                            copy[i] = []
                            for (let j = i + 1; j < 3; j++) copy[j] = []
                            setSelectedSkills(copy)
                            setLocalSearch("")
                          }}>
                          ×
                        </button>
                      </div>

                      <div className='flex flex-col gap-1 p-1 overflow-auto max-h-48 md:max-h-96'>
                        {getAvailableSkills(i)
                          .filter((skillKey) => {
                            const skillName = skillKey.split(" Lv.")[0]
                            const translatedName = t(`skillTranslations.${skillName}`, skillName)
                            return (
                              skillKey.toLowerCase().includes(localSearch.toLowerCase()) ||
                              translatedName.toLowerCase().includes(localSearch.toLowerCase())
                            )
                          })
                          .map((skillKey) => {
                            const skillName = skillKey.split(" Lv.")[0]
                            const skillLevel = skillKey.split(" Lv.")[1]
                            const translatedName = t(`skillTranslations.${skillName}`, skillName)
                            const useFullwidth = i18n.language && (i18n.language.startsWith("zh") || i18n.language === "jaJP")
                            const displayName = useFullwidth ? `${translatedName} ${t("common.level")}${skillLevel}` : skillKey
                            const groupInfo = getSkillGroupInfo(skillKey)
                            const isSelected = selectedArray.includes(skillKey)
                            return (
                              <button
                                key={`custom-${skillKey}`}
                                type='button'
                                className={`px-2 py-1 text-left rounded hover:bg-gray-100 flex items-center justify-between ${
                                  isSelected ? "bg-blue-50" : ""
                                }`}
                                onPointerDown={(e) => e.preventDefault()} /* prevent blur */
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const copy = selectedSkills.slice()
                                  const arr = Array.isArray(copy[i]) ? copy[i].slice() : copy[i] ? [copy[i]] : []
                                  const idx = arr.indexOf(skillKey)
                                  if (idx === -1) arr.push(skillKey)
                                  else arr.splice(idx, 1)
                                  copy[i] = arr
                                  // clear later slots when toggling earlier ones
                                  if (i < 2 && arr.length === 0) {
                                    for (let j = i + 1; j < 3; j++) copy[j] = []
                                  }
                                  setSelectedSkills(copy)
                                  setLocalSearch("")
                                  // keep the select open to allow multiple selections
                                }}>
                                <div className='flex items-center gap-2'>
                                  <img
                                    src={`${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skillName.replace(/\//g, "-"))}.png`}
                                    alt={skillName}
                                    className='object-contain w-5 h-5 mr-2 md:w-6 md:h-6'
                                    onError={(e) => {
                                      try {
                                        if (!e || !e.currentTarget) return
                                        const el = e.currentTarget
                                        if (el.src && el.src.indexOf("data:image/svg+xml") === -1) {
                                          el.src = SKILL_PLACEHOLDER_SVG
                                        }
                                      } catch {
                                        /* swallow */
                                      }
                                    }}
                                  />
                                  <div>
                                    {displayName}
                                    <span style={{ color: "#888", fontSize: "0.8em", marginLeft: "0.5em" }}>（{groupInfo}）</span>
                                  </div>
                                </div>
                                <div className='ml-2 text-sm'>{isSelected ? "✓" : ""}</div>
                              </button>
                            )
                          })}
                      </div>
                    </SelectContent>
                  </Select>

                  <button
                    type='button'
                    aria-label={t("skillSelector.clearSelection", "Clear selection")}
                    className='h-auto min-h-[40px] px-4 py-2 text-base rounded md:min-h-[56px] md:px-5 md:py-3 md:text-lg bg-gray-50 hover:bg-gray-100'
                    onMouseDown={(e) => e.preventDefault()} /* prevent focus loss */
                    onClick={(e) => {
                      e.stopPropagation()
                      const copy = selectedSkills.slice()
                      copy[i] = []
                      for (let j = i + 1; j < 3; j++) copy[j] = []
                      setSelectedSkills(copy)
                      setLocalSearch("")
                    }}>
                    ×
                  </button>
                </div>
              </div>
            )
          }

          const keySuffix = Array.isArray(selectedSkills[i]) ? selectedSkills[i].join("|") : selectedSkills[i]
          return <SkillSelectSlot key={`${i}-${keySuffix}`} />
        })}
      </div>

      {/* Slot selector row placed below skills, single full-width row */}
      <div className='mt-2 mb-6'>
        <label className='block mb-2 text-sm font-medium'>{t("skillSelector.slotFilter")}</label>
        <div className='flex items-center gap-2'>
          {(() => {
            const selectValueProp = selectedSlot ?? ""
            return (
              <Select
                value={selectValueProp}
                onValueChange={(value) => {
                  setSelectedSlot(value)
                }}>
                <SelectTrigger className='w-56 h-auto min-h-[40px] px-3 text-base md:w-72 md:min-h-[56px] md:px-4 md:text-lg'>
                  {/* keep SelectValue only; selected SelectItem content (including images) will be shown by Radix */}
                  <SelectValue placeholder={t("skillSelector.slotAny")} />
                </SelectTrigger>
                <SelectContent side='bottom' position='popper'>
                  {filteredSlotOptions.map((k) => {
                    // determine display text and image(s) for each slot option
                    let display = k
                    const slotImgSrcs = []
                    try {
                      const arr = JSON.parse(k)
                      if (Array.isArray(arr)) display = `[${arr.join(", ")}]`
                      if (Array.isArray(arr)) {
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
                      if (typeof k === "string" && k.indexOf("W") !== -1) {
                        slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                      } else if (!isNaN(Number(k))) {
                        const idx = Math.min(Math.max(1, Number(k)), 3)
                        slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${idx}.png`)
                      }
                    }

                    return (
                      <SelectItem key={k} value={k}>
                        <div className='flex items-center gap-2'>
                          {slotImgSrcs.length > 0 && (
                            <div className='flex items-center gap-1'>
                              {slotImgSrcs.map((src, idx) => (
                                <img
                                  key={`${src}-${idx}`}
                                  src={src}
                                  alt=''
                                  className='object-contain w-6 h-6 xl:w-8 xl:h-8 '
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          <span>{display}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )
          })()}
          <button
            type='button'
            aria-label={t("skillSelector.clearSlot", "Clear slot")}
            className='h-auto min-h-[40px] px-4 py-2 text-base rounded md:min-h-[56px] md:px-5 md:py-3 md:text-lg bg-gray-50 hover:bg-gray-100'
            onMouseDown={(e) => e.preventDefault()} /* prevent focus loss */
            onClick={(e) => {
              e.stopPropagation()
              setSelectedSlot("")
            }}>
            ×
          </button>
        </div>
      </div>
      <div className='flex justify-end'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setSelectedSkills([[], [], []])
            setSelectedSlot("")
            // local searches are per-slot; resetting selectedSkills will remount slots
            // which clears their internal localSearch state.
          }}>
          {t("skillSelector.reset", "Reset")}
        </Button>
      </div>
    </section>
  )
}
