import SkillGroupsData from "../data/SkillGroups.json"
import RarityData from "../data/Rarity.json"

export const charmKey = (charm) => {
  try {
    return (charm && (charm.id ?? charm.name)) || JSON.stringify(charm && charm.groups) || "unknown"
  } catch {
    return "unknown"
  }
}

const buildPerSlotCombinations = (perSlotArrays) => {
  const res = []
  const dfs = (i, acc) => {
    if (i >= perSlotArrays.length) {
      res.push(acc.slice())
      return
    }
    const arr = perSlotArrays[i]
    if (!arr || arr.length === 0) {
      acc.push(null)
      dfs(i + 1, acc)
      acc.pop()
      return
    }
    for (const v of arr) {
      acc.push(v)
      dfs(i + 1, acc)
      acc.pop()
    }
  }
  dfs(0, [])
  return res
}

const getGroupSkillCountForRarity = (groupNumber, rarity) => {
  const groupKey = `Group${groupNumber}`
  const totalGroupSkills = SkillGroupsData.SkillGroups[groupKey] ? SkillGroupsData.SkillGroups[groupKey].data.length : 1
  const rarityGroups = (RarityData[rarity] && RarityData[rarity].Group) || []
  const hasGroupInRarity = rarityGroups.some((g) => Array.isArray(g.skills) && g.skills.includes(groupNumber))
  return hasGroupInRarity ? totalGroupSkills : 1
}

const findGroupsForSkill = (skillKey) => {
  const groups = []
  Object.keys(SkillGroupsData.SkillGroups).forEach((gk) => {
    const gnum = parseInt(gk.replace("Group", ""), 10)
    SkillGroupsData.SkillGroups[gk].data.forEach((sk) => {
      if (`${sk.SkillName} Lv.${sk.SkillLevel}` === skillKey && !groups.includes(gnum)) groups.push(gnum)
    })
  })
  return groups
}

export function computeCharmProb(charm, selectedSkills = [], selectedSlot = "") {
  console.log(charm)
  console.log(selectedSkills)
  console.log(selectedSlot)
  const rarity = charm && charm.rarity
  const baseProb = (RarityData[rarity] && RarityData[rarity].probability) || 0.01

  const rarityGroups = (RarityData[rarity] && RarityData[rarity].Group) || []

  // find matched group entry
  let _matchedGroup = null
  if (Array.isArray(rarityGroups)) {
    for (const g of rarityGroups) {
      if (Array.isArray(g.skills) && Array.isArray(charm.groups) && g.skills.length === charm.groups.length) {
        const same = g.skills.every((v, i) => v === charm.groups[i])
        if (same) {
          _matchedGroup = g
          break
        }
      }
    }
  }

  // amuletTypeProb removed from calculations; charmTypeProb remains 1 / number of types.
  let charmTypeProb = 1
  if (Array.isArray(rarityGroups) && rarityGroups.length > 0) {
    charmTypeProb = 1 / rarityGroups.length
  }

  // groupProb will be computed later based on the actual grouped display (product of 1/available)
  let groupProb = 1

  // normalslot mapping (some rarities nest under a 'slot' key)
  let normalslotObj = (RarityData[rarity] && RarityData[rarity].normalslot) || {}
  if (normalslotObj && normalslotObj.slot) normalslotObj = normalslotObj.slot

  // support selectedSlot being a single key string or an array of keys (slotKeys)
  const slotKeysArr = Array.isArray(selectedSlot) ? selectedSlot : selectedSlot ? [selectedSlot] : []
  // sum probabilities for provided slot keys; if none provided, default multiplier stays 1
  let slotProbFromRarity = 1
  if (slotKeysArr.length > 0) {
    slotProbFromRarity = slotKeysArr.reduce((sum, k) => {
      if (Object.prototype.hasOwnProperty.call(normalslotObj, k)) {
        const v = Number(normalslotObj[k]) || 0
        return sum + v
      }
      return sum
    }, 0)
  }

  // finalWithSlot and finalNoSlot will be computed after groupProb is known
  let finalWithSlotValue = 0
  let finalNoSlotValue = 0

  const perSlotArrays = Array.isArray(selectedSkills) ? selectedSkills.map((a) => (Array.isArray(a) ? a : a ? [a] : [])) : []
  const combos = buildPerSlotCombinations(perSlotArrays)

  const amuletGroups = Array.isArray(charm.groups) ? charm.groups : []

  // deterministic grouped display summary (prepare early so early return can include it)
  // Previously we simply picked the first item from each selected slot which
  // could produce suboptimal assignments when a later option could map to a
  // different amulet group. Try to pick one option per non-empty slot that
  // maximizes the number of distinct amulet positions assigned.
  let deterministicChoices = []
  if (Array.isArray(selectedSkills)) {
    // build per-slot arrays preserving order, but only for non-empty slots
    const perSlot = selectedSkills.map((a) => (Array.isArray(a) ? a.slice() : a ? [a] : [])).filter((arr) => arr.length > 0)

    if (perSlot.length === 0) {
      deterministicChoices = selectedSkills.map((a) => (Array.isArray(a) ? a[0] || null : a || null))
    } else {
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
          const groupsForSkill = findGroupsForSkill(optSkillKey)
          for (let j = 0; j < amuletGroups.length; j++) {
            if (usedIdx.includes(j)) continue
            if (groupsForSkill.includes(amuletGroups[j])) {
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

      if (assignments.length === 0) {
        // fallback to previous simple behavior
        deterministicChoices = selectedSkills.map((a) => (Array.isArray(a) ? a[0] || null : a || null))
      } else {
        // pick assignment with most used positions (prefer fuller coverage)
        assignments.sort((a, b) => b.used.size - a.used.size)
        const best = assignments[0]
        // map chosen results back to the original selectedSkills slots (including empty slots)
        deterministicChoices = []
        let perIdx = 0
        for (let s = 0; s < selectedSkills.length; s++) {
          const arr = Array.isArray(selectedSkills[s]) ? selectedSkills[s] : selectedSkills[s] ? [selectedSkills[s]] : []
          if (arr.length === 0) {
            deterministicChoices.push(null)
          } else {
            deterministicChoices.push(best.chosen[perIdx] || null)
            perIdx++
          }
        }
      }
    }
  } else {
    deterministicChoices = []
  }

  const positionSummaries = amuletGroups.map((groupNumber) => ({
    group: groupNumber,
    total: getGroupSkillCountForRarity(groupNumber, charm.rarity),
    available: getGroupSkillCountForRarity(groupNumber, charm.rarity),
    excluded: [],
  }))

  const usedPositions = new Set()
  const usedBaseNamesGlobal = new Set()

  deterministicChoices.forEach((choice) => {
    if (!choice) return
    const groupsForSkill = findGroupsForSkill(choice)
    let assignedPos = -1
    for (let pos = 0; pos < amuletGroups.length; pos++) {
      if (usedPositions.has(pos)) continue
      const groupNum = amuletGroups[pos]
      if (groupsForSkill.includes(groupNum)) {
        assignedPos = pos
        break
      }
    }
    if (assignedPos === -1) return

    const groupNumber = amuletGroups[assignedPos]
    const groupKey = `Group${groupNumber}`
    const totalSkillCount = getGroupSkillCountForRarity(groupNumber, charm.rarity)

    const excludedBaseNames = new Set()
    if (SkillGroupsData.SkillGroups[groupKey]) {
      usedBaseNamesGlobal.forEach((bn) => {
        const sameBaseNameSkills = SkillGroupsData.SkillGroups[groupKey].data.filter((s) => s.SkillName === bn)
        if (sameBaseNameSkills.length > 0) excludedBaseNames.add(bn)
      })
    }

    let excludedSkillCount = 0
    excludedBaseNames.forEach((bn) => {
      const sameBaseNameSkills = SkillGroupsData.SkillGroups[groupKey]
        ? SkillGroupsData.SkillGroups[groupKey].data.filter((s) => s.SkillName === bn)
        : []
      excludedSkillCount += sameBaseNameSkills.length
    })

    const availableSkillCount = Math.max(1, totalSkillCount - excludedSkillCount)

    positionSummaries[assignedPos].total = Math.max(positionSummaries[assignedPos].total || 0, totalSkillCount)
    positionSummaries[assignedPos].available = availableSkillCount
    excludedBaseNames.forEach((e) => {
      if (!positionSummaries[assignedPos].excluded.includes(e)) positionSummaries[assignedPos].excluded.push(e)
    })

    const currentSkillBaseName = choice.split(" Lv.")[0]
    usedBaseNamesGlobal.add(currentSkillBaseName)
    usedPositions.add(assignedPos)
  })

  const displayGroups = positionSummaries.filter((_, idx) => usedPositions.has(idx))

  // compute groupProb from displayGroups: product of (1 / available) for each used position
  // treat available <= 0 as 1 to avoid division by zero
  if (Array.isArray(displayGroups) && displayGroups.length > 0) {
    groupProb = displayGroups.reduce((acc, g) => {
      const avail = Number(g.available) || 0
      const denom = Math.max(1, avail)
      return acc * (1 / denom)
    }, 1)
  } else {
    groupProb = 1
  }

  // now that groupProb is known, compute finalWithSlot / finalNoSlot
  finalWithSlotValue = baseProb * charmTypeProb * groupProb
  finalNoSlotValue = finalWithSlotValue * slotProbFromRarity

  // early return when no combos: finalWithSlot uses rarity normalslot mapping
  if (!combos || combos.length === 0) {
    return {
      baseProb,
      charmTypeProb,
      groupProb,
      finalNoSlot: finalNoSlotValue,
      finalWithSlot: finalWithSlotValue,
      grouped: displayGroups,
      SlotProb: slotProbFromRarity,
    }
  }

  // per-combo aggregation removed; combos are still computed above for the early-return case

  return {
    baseProb,
    charmTypeProb,
    groupProb,
    finalNoSlot: finalNoSlotValue,
    finalWithSlot: finalWithSlotValue,
    SlotProb: slotProbFromRarity,
    grouped: displayGroups,
  }
}
