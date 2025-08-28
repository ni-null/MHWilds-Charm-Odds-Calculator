import React, { useState, useMemo, useCallback } from "react"
import SkillGroupsData from "../../data/SkillGroups.json"
import RarityData from "../../data/Rarity.json"
import useMhwStore from "../../store/mhwStore"
import AmuletListView from "./components/AmuletListView"

export default function AmuletList() {
  const [expandedIndex, setExpandedIndex] = useState(null)
  // translation handled inside AmuletListView
  const { selectedSkills, selectedSlot } = useMhwStore()

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

  const matchingAmulets = useMemo(() => {
    const selectedSkillsFiltered = (selectedSkills || []).filter(Boolean)
    if (selectedSkillsFiltered.length === 0) return []

    return virtualAmulets.filter((amulet) => {
      if (selectedSlot) {
        const slotObj = amulet.slotObj || {}
        if (!Object.prototype.hasOwnProperty.call(slotObj, selectedSlot)) return false
      }

      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)
      const usedSlots = []

      for (const skillKey of selectedSkillsFiltered) {
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
      const selectedSkillsFiltered = (selectedSkills || []).filter(Boolean)

      if (selectedSkillsFiltered.length === 0) return baseProb * slotProb

      const amuletsOfSameRarity = (rarityBaseProbability[amulet.Rarity] && rarityBaseProbability[amulet.Rarity].Group) || []
      const amuletTypeProb = amuletsOfSameRarity.length > 0 ? 1 / amuletsOfSameRarity.length : 0

      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

      let skillCombinationProb = 1
      const usedSlots = []
      const selectedSkillBaseNamesInGroup = {}

      for (const skillKey of selectedSkillsFiltered) {
        const skillGroups = skillToGroupMap[skillKey] || []
        let assignedSlot = -1
        for (let slotIndex = 0; slotIndex < amuletGroups.length; slotIndex++) {
          if (!usedSlots.includes(slotIndex) && skillGroups.includes(amuletGroups[slotIndex])) {
            assignedSlot = slotIndex
            usedSlots.push(slotIndex)
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
    },
    [rarityBaseProbability, getGroupSkillCountForRarity, selectedSkills, skillToGroupMap, selectedSlot]
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
          possibleSkills.push({
            name: skillKey,
            group: groupNumber,
            isSelected: selectedSkills.includes(skillKey),
          })
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
