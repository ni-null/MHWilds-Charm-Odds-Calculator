import React, { useState, useMemo, useCallback } from "react"
import SkillGroupsData from "../../data/SkillGroups.json"
import RarityData from "../../data/Rarity.json"
import useMhwStore from "../../store/mhwStore"
import AmuletListView from "./components/AmuletListView"

export default function AmuletList() {
  const [expandedIndex, setExpandedIndex] = useState(null)
  // translation handled inside AmuletListView
  const { selectedSkills, selectedSlot, AvlCharms } = useMhwStore()

  const rarityBaseProbability = RarityData

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

  const virtualAmulets = useMemo(() => {
    const arr = []
    Object.entries(rarityBaseProbability).forEach(([rarity, data]) => {
      const groups = data.Group || []
      groups.forEach((gObj) => {
        const skills = gObj.skills || []
        const amu = {
          Rarity: rarity,
          Skill1Group: skills[0] || null,
          Skill2Group: skills[1] || null,
          Skill3Group: skills[2] || null,
          combinationCount: gObj.combinationCount || 0,
          slotObj: (gObj && gObj.slot) || {},
        }
        arr.push(amu)
      })
    })
    return arr
  }, [rarityBaseProbability])

  // helper: build cartesian product of chosen options per slot
  const buildCombinations = React.useCallback((perSlotArrays) => {
    const arrays = perSlotArrays.map((a) => (Array.isArray(a) ? a : a ? [a] : []))
    // remove empty trailing slots (we only consider contiguous prefix choices)
    const nonEmpty = arrays.filter((a) => a.length > 0)
    if (nonEmpty.length === 0) return []
    const res = []
    const dfs = (idx, acc) => {
      if (idx >= arrays.length) {
        res.push(acc.slice())
        return
      }
      if (!arrays[idx] || arrays[idx].length === 0) {
        dfs(idx + 1, acc)
        return
      }
      for (const v of arrays[idx]) {
        acc.push(v)
        dfs(idx + 1, acc)
        acc.pop()
      }
    }
    dfs(0, [])
    // Filter out combos that contain duplicate base skill names (e.g. "Adaptability Lv.1" and "Adaptability Lv.2")
    const filtered = res.filter((combo) => {
      const baseNames = combo.map((s) => {
        if (!s) return s
        const parts = String(s).split(" Lv.")
        return parts[0]
      })
      return new Set(baseNames).size === baseNames.length
    })
    return filtered
  }, [])

  const matchingAmulets = useMemo(() => {
    const combos = buildCombinations(selectedSkills || [])
    if (combos.length === 0) return []

    return virtualAmulets.filter((amulet) => {
      if (selectedSlot) {
        const slotObj = amulet.slotObj || {}
        if (!Object.prototype.hasOwnProperty.call(slotObj, selectedSlot)) return false
      }

      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

      // amulet matches if any combination can be assigned to the amulet groups
      const anyComboMatches = combos.some((combo) => {
        const usedSlots = []
        for (const skillKey of combo) {
          const skillGroups = skillToGroupMap[skillKey] || []
          let foundSlot = false
          for (let slotIndex = 0; slotIndex < amuletGroups.length; slotIndex++) {
            if (!usedSlots.includes(slotIndex) && skillGroups.includes(amuletGroups[slotIndex])) {
              usedSlots.push(slotIndex)
              foundSlot = true
              break
            }
          }
          if (!foundSlot) return false
        }
        return true
      })

      return anyComboMatches
    })
  }, [selectedSkills, skillToGroupMap, virtualAmulets, selectedSlot])

  const getGroupSkillCountForRarity = useCallback(
    (groupNumber, rarity) => {
      const groupKey = `Group${groupNumber}`
      const totalGroupSkills = SkillGroupsData.SkillGroups[groupKey] ? SkillGroupsData.SkillGroups[groupKey].data.length : 1
      const rarityGroups = (rarityBaseProbability[rarity] && rarityBaseProbability[rarity].Group) || []
      const hasGroupInRarity = rarityGroups.some((g) => Array.isArray(g.skills) && g.skills.includes(groupNumber))
      return hasGroupInRarity ? totalGroupSkills : 1
    },
    [rarityBaseProbability]
  )

  const calculateAmuletProbability = useCallback(
    (amulet, includeSlot = true) => {
      const baseProb = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].probability) || 0.01
      const slotObj = amulet.slotObj || {}
      const slotProb = includeSlot && selectedSlot && Object.prototype.hasOwnProperty.call(slotObj, selectedSlot) ? slotObj[selectedSlot] : 1
      // Selected skills now are arrays per slot; build combinations
      const combos = buildCombinations(selectedSkills || [])
      if (combos.length === 0) return baseProb * slotProb

      const amuletsOfSameRarity = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].Group) || []
      const amuletTypeProb = amuletsOfSameRarity.length > 0 ? 1 / amuletsOfSameRarity.length : 0

      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

      // For multi-select, compute probability for each concrete combination, then sum
      let totalProb = 0
      combos.forEach((combo) => {
        let skillCombinationProb = 1
        const usedSlotsLocal = []
        const selectedSkillBaseNamesInGroup = {}

        for (const skillKey of combo) {
          const skillGroups = skillToGroupMap[skillKey] || []
          let assignedSlot = -1
          for (let slotIndex = 0; slotIndex < amuletGroups.length; slotIndex++) {
            if (!usedSlotsLocal.includes(slotIndex) && skillGroups.includes(amuletGroups[slotIndex])) {
              assignedSlot = slotIndex
              usedSlotsLocal.push(slotIndex)
              break
            }
          }

          if (assignedSlot !== -1) {
            const groupNumber = amuletGroups[assignedSlot]
            const totalSkillCount = getGroupSkillCountForRarity(groupNumber, amulet.Rarity)

            if (!selectedSkillBaseNamesInGroup[groupNumber]) selectedSkillBaseNamesInGroup[groupNumber] = new Set()

            const currentSkillBaseName = skillKey.split(" Lv.")[0]

            const groupKey = `Group${groupNumber}`
            let excludedSkillCount = 0
            if (SkillGroupsData.SkillGroups[groupKey]) {
              const allSelectedBaseNames = new Set()
              Object.values(selectedSkillBaseNamesInGroup).forEach((baseNameSet) => {
                baseNameSet.forEach((baseName) => allSelectedBaseNames.add(baseName))
              })
              allSelectedBaseNames.forEach((baseName) => {
                const sameBaseNameSkills = SkillGroupsData.SkillGroups[groupKey].data.filter((skill) => skill.SkillName === baseName)
                excludedSkillCount += sameBaseNameSkills.length
              })
            }

            const availableSkillCount = totalSkillCount - excludedSkillCount
            skillCombinationProb *= 1 / availableSkillCount
            selectedSkillBaseNamesInGroup[groupNumber].add(currentSkillBaseName)
          }
        }

        totalProb += baseProb * slotProb * amuletTypeProb * skillCombinationProb
      })

      return totalProb
    },
    [rarityBaseProbability, getGroupSkillCountForRarity, selectedSkills, skillToGroupMap, selectedSlot, buildCombinations]
  )

  const amuletProbabilities = useMemo(() => {
    if (matchingAmulets.length === 0) return {}
    const probabilities = {}
    matchingAmulets.forEach((amulet, index) => {
      const probNoSlot = calculateAmuletProbability(amulet, false)
      const probWithSlot = calculateAmuletProbability(amulet, true)
      const pctNoSlot = probNoSlot * 100
      const pctWithSlot = probWithSlot * 100
      const formatPct = (percentageProb) => {
        if (percentageProb >= 0.01) return percentageProb.toFixed(4)
        if (percentageProb >= 0.001) return percentageProb.toFixed(6)
        if (percentageProb >= 0.0001) return percentageProb.toFixed(8)
        return percentageProb.toFixed(12).replace(/\.?0+$/, "")
      }

      probabilities[index] = {
        noSlot: { formatted: formatPct(pctNoSlot), rawPercent: pctNoSlot },
        withSlot: { formatted: formatPct(pctWithSlot), rawPercent: pctWithSlot },
      }
    })
    return probabilities
  }, [matchingAmulets, calculateAmuletProbability])

  // expandedMatches: list of { amulet, combo, probNoSlot, probWithSlot }
  const expandedMatches = useMemo(() => {
    const combos = buildCombinations(selectedSkills || [])
    if (combos.length === 0) return []

    const results = []

    // helper to compute probability for a single combo
    const computeComboProb = (amulet, combo, includeSlot) => {
      const baseProb = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].probability) || 0.01
      const slotObj = amulet.slotObj || {}
      const slotProb = includeSlot && selectedSlot && Object.prototype.hasOwnProperty.call(slotObj, selectedSlot) ? slotObj[selectedSlot] : 1
      const amuletsOfSameRarity = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].Group) || []
      const amuletTypeProb = amuletsOfSameRarity.length > 0 ? 1 / amuletsOfSameRarity.length : 0
      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

      let skillCombinationProb = 1
      const usedSlotsLocal = []
      const selectedSkillBaseNamesInGroup = {}

      for (const skillKey of combo) {
        const skillGroups = skillToGroupMap[skillKey] || []
        let assignedSlot = -1
        for (let slotIndex = 0; slotIndex < amuletGroups.length; slotIndex++) {
          if (!usedSlotsLocal.includes(slotIndex) && skillGroups.includes(amuletGroups[slotIndex])) {
            assignedSlot = slotIndex
            usedSlotsLocal.push(slotIndex)
            break
          }
        }
        if (assignedSlot !== -1) {
          const groupNumber = amuletGroups[assignedSlot]
          const totalSkillCount = getGroupSkillCountForRarity(groupNumber, amulet.Rarity)

          if (!selectedSkillBaseNamesInGroup[groupNumber]) selectedSkillBaseNamesInGroup[groupNumber] = new Set()

          const currentSkillBaseName = skillKey.split(" Lv.")[0]

          const groupKey = `Group${groupNumber}`
          let excludedSkillCount = 0
          if (SkillGroupsData.SkillGroups[groupKey]) {
            const allSelectedBaseNames = new Set()
            Object.values(selectedSkillBaseNamesInGroup).forEach((baseNameSet) => {
              baseNameSet.forEach((baseName) => allSelectedBaseNames.add(baseName))
            })
            allSelectedBaseNames.forEach((baseName) => {
              const sameBaseNameSkills = SkillGroupsData.SkillGroups[groupKey].data.filter((skill) => skill.SkillName === baseName)
              excludedSkillCount += sameBaseNameSkills.length
            })
          }

          const availableSkillCount = totalSkillCount - excludedSkillCount
          skillCombinationProb *= 1 / availableSkillCount
          selectedSkillBaseNamesInGroup[groupNumber].add(currentSkillBaseName)
        }
      }

      return baseProb * slotProb * amuletTypeProb * skillCombinationProb
    }

    virtualAmulets.forEach((amulet) => {
      if (selectedSlot) {
        const slotObj = amulet.slotObj || {}
        if (!Object.prototype.hasOwnProperty.call(slotObj, selectedSlot)) return
      }
      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

      combos.forEach((combo) => {
        // check assignability
        const usedSlots = []
        let ok = true
        for (const skillKey of combo) {
          const skillGroups = skillToGroupMap[skillKey] || []
          let found = false
          for (let slotIndex = 0; slotIndex < amuletGroups.length; slotIndex++) {
            if (!usedSlots.includes(slotIndex) && skillGroups.includes(amuletGroups[slotIndex])) {
              usedSlots.push(slotIndex)
              found = true
              break
            }
          }
          if (!found) {
            ok = false
            break
          }
        }
        if (ok) {
          const probNoSlot = computeComboProb(amulet, combo, false)
          const probWithSlot = computeComboProb(amulet, combo, true)
          results.push({ amulet, combo, probNoSlot, probWithSlot })
        }
      })
    })

    return results
  }, [selectedSkills, selectedSlot, buildCombinations, virtualAmulets, skillToGroupMap, getGroupSkillCountForRarity, rarityBaseProbability])

  const hasSelection = (selectedSkills || []).filter(Boolean).length > 0

  const visibleAmulets = React.useMemo(() => {
    if (!selectedSlot) return matchingAmulets
    return matchingAmulets.filter((amulet) => {
      const rarityData = rarityBaseProbability[amulet.Rarity] || {}
      const groups = rarityData.Group || []
      return groups.some((g) => {
        const gSlotObj = (g && g.slot) || {}
        return Object.prototype.hasOwnProperty.call(gSlotObj, selectedSlot)
      })
    })
  }, [matchingAmulets, selectedSlot, rarityBaseProbability])

  const getSkillsFromAmulet = (amulet) => {
    const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)
    const possibleSkills = []

    amuletGroups.forEach((groupNumber) => {
      const groupKey = `Group${groupNumber}`
      if (SkillGroupsData.SkillGroups[groupKey]) {
        SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
          const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
          // check across per-slot arrays for selection
          const isSelected = Array.isArray(selectedSkills)
            ? selectedSkills.some((slotArr) => (Array.isArray(slotArr) ? slotArr.includes(skillKey) : slotArr === skillKey))
            : selectedSkills === skillKey
          possibleSkills.push({ name: skillKey, group: groupNumber, isSelected })
        })
      }
    })

    return possibleSkills
  }

  if (!hasSelection) return null

  return (
    <AmuletListView
      matchingAmulets={matchingAmulets}
      visibleAmulets={visibleAmulets}
      amuletProbabilities={amuletProbabilities}
      getSkillsFromAmulet={getSkillsFromAmulet}
      expandedMatches={expandedMatches}
      selectedSkills={selectedSkills}
      selectedSlot={selectedSlot}
      expandedIndex={expandedIndex}
      setExpandedIndex={setExpandedIndex}
      rarityBaseProbability={rarityBaseProbability}
      RarityData={RarityData}
      SkillGroupsData={SkillGroupsData}
      getGroupSkillCountForRarity={getGroupSkillCountForRarity}
    />
  )
}
