import React from "react"
import { useTranslation } from "react-i18next"
export default function AmuletListView(props) {
  const {
    matchingAmulets,
    visibleAmulets,
    amuletProbabilities,
    getSkillsFromAmulet,
    expandedMatches: _expandedMatches,
    selectedSkills,
    selectedSlot: _selectedSlot,
    expandedIndex: _expandedIndex,
    setExpandedIndex: _setExpandedIndex,
    rarityBaseProbability: _rarityBaseProbability,
    RarityData,
    SkillGroupsData,
    getGroupSkillCountForRarity: _getGroupSkillCountForRarity,
  } = props

  const { t, i18n: _i18n } = useTranslation()
  // helper: build per-slot cartesian combos but keep slot positions (null for empty)
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

  // helper: map skill string to group numbers available in SkillGroupsData
  const buildSkillToGroupsMap = () => {
    const map = {}
    if (!SkillGroupsData || !SkillGroupsData.SkillGroups) return map
    Object.keys(SkillGroupsData.SkillGroups).forEach((groupKey) => {
      const groupNum = parseInt(groupKey.replace(/^Group/, ""), 10)
      const group = SkillGroupsData.SkillGroups[groupKey]
      if (!group || !Array.isArray(group.data)) return
      group.data.forEach((s) => {
        if (!s || !s.SkillName) return
        const key = `${s.SkillName} Lv.${s.SkillLevel}`
        if (!map[key]) map[key] = []
        map[key].push(groupNum)
      })
    })
    return map
  }

  const skillToGroups = buildSkillToGroupsMap()

  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
        "<rect fill='%23efefef' width='100%' height='100%'/>" +
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23999'>?" +
        "</text></svg>"
    )

  const rarityColorMap = {
    "RARE[8]": "text-orange-600",
    "RARE[7]": "text-purple-600",
    "RARE[6]": "text-blue-800",
    "RARE[5]": "text-green-600",
  }

  // Given an amulet and selectedSkills (per-slot arrays), return valid combos
  const getDisplayableCombosForAmulet = (amulet) => {
    if (!amulet) return []
    const perSlotArrays = selectedSkills.map((a) => (Array.isArray(a) ? a : a ? [a] : []))
    const combos = buildPerSlotCombinations(perSlotArrays)
    const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null && g !== undefined)

    const valid = []
    combos.forEach((combo) => {
      // assign chosen skills (non-null) to amulet group slots without reusing
      const usedGroupIndices = new Set()
      let ok = true
      const assigned = []
      for (const chosenSkill of combo) {
        if (!chosenSkill) {
          assigned.push(null)
          continue
        }
        const groupsForSkill = skillToGroups[chosenSkill] || []
        // find a matching amulet group index that hasn't been used
        let assignedIndex = -1
        for (let idx = 0; idx < amuletGroups.length; idx++) {
          if (usedGroupIndices.has(idx)) continue
          const groupNum = amuletGroups[idx]
          if (groupsForSkill.includes(groupNum)) {
            assignedIndex = idx
            break
          }
        }
        if (assignedIndex === -1) {
          ok = false
          break
        }
        usedGroupIndices.add(assignedIndex)
        assigned.push({ skill: chosenSkill, amuletGroupIndex: assignedIndex, amuletGroup: amuletGroups[assignedIndex] })
      }
      if (ok) {
        // produce displayable skill list (filter nulls)
        const displayList = assigned.filter(Boolean).map((a) => a.skill)
        if (displayList.length > 0) valid.push(displayList)
      }
    })
    // dedupe combos by string
    const uniq = []
    const seen = new Set()
    valid.forEach((c) => {
      const key = c.join("|")
      if (!seen.has(key)) {
        seen.add(key)
        uniq.push(c)
      }
    })
    return uniq
  }

  // build render items: one entry per combo (if combos exist), otherwise one entry with combo=null
  const renderItems = visibleAmulets.flatMap((amulet, index) => {
    const combos = getDisplayableCombosForAmulet(amulet)
    if (!combos || combos.length === 0) return [{ amulet, combo: null, index, comboIndex: -1 }]
    return combos.map((c, ci) => ({ amulet, combo: c, index, comboIndex: ci }))
  })

  // helper to format percentage numbers (input: percent value, e.g., 0.0123 => 0.0123)
  const formatPct = (percentage) => {
    if (percentage >= 0.01) return percentage.toFixed(4)
    if (percentage >= 0.001) return percentage.toFixed(6)
    if (percentage >= 0.0001) return percentage.toFixed(8)
    return percentage.toFixed(12).replace(/\.?0+$/, "")
  }

  // compute totals for renderItems using expandedMatches when available
  const totals = renderItems.reduce(
    (acc, item) => {
      const { amulet, combo } = item
      // try find in expandedMatches by reference + combo string
      let found = null
      if (Array.isArray(_expandedMatches)) {
        const comboKey = combo && Array.isArray(combo) ? combo.join("|") : combo
        for (const m of _expandedMatches) {
          const mComboKey = m.combo && Array.isArray(m.combo) ? m.combo.join("|") : m.combo
          if (m.amulet === amulet && String(mComboKey) === String(comboKey)) {
            found = m
            break
          }
        }
      }

      if (found) {
        acc.noSlot += (found.probNoSlot || 0) * 100
        acc.withSlot += (found.probWithSlot || 0) * 100
      } else {
        // fallback to amuletProbabilities mapping by original matchingAmulets index
        const originalIndex = matchingAmulets.indexOf(amulet)
        const probs = amuletProbabilities && amuletProbabilities[originalIndex]
        if (probs && probs.noSlot && probs.withSlot) {
          acc.noSlot += probs.noSlot.rawPercent || 0
          acc.withSlot += probs.withSlot.rawPercent || 0
        }
      }
      return acc
    },
    { noSlot: 0, withSlot: 0 }
  )

  return (
    <React.Fragment>
      {/* 顯示所有機率的加總 使用 renderItems 計算的結果 */}
      <div className='p-10 my-10 bg-white rounded-lg'>
        <h2 className='mb-4 text-2xl font-semibold'>機率計算</h2>

        <div className='mb-3 text-sm'>
          <div>
            {t("probability.base")} (no slot total): {formatPct(totals.noSlot)}
            {t("probability.percentage")}
          </div>
          <div>
            {t("probability.individual")} (with slot total): {formatPct(totals.withSlot)}
            {t("probability.percentage")}
          </div>
        </div>
      </div>

      <div className='p-10 bg-white rounded-lg'>
        {/* 顯示所有機率的加總 使用 renderItems 計算的結果 */}

        <h2 className='mb-4 text-2xl font-semibold'>
          {t("amulet.matching")} ({matchingAmulets.length})
        </h2>

        <ul>
          {renderItems.map((item, idx) => {
            const { amulet, combo } = item
            // unique id per rendered row: amulet original index + comboIndex
            const renderedId = `${item.index}-${item.comboIndex}`
            const key = `${amulet.Rarity}-${item.index}-${item.comboIndex}-${idx}`
            const amuletSkills = getSkillsFromAmulet(amulet)
            const originalIndex = matchingAmulets.indexOf(amulet)
            const probability = parseFloat(amuletProbabilities[originalIndex]) || 0
            const probabilityDisplay = amuletProbabilities[originalIndex] ?? probability.toFixed(4)
            const rarityClass = rarityColorMap[amulet.Rarity] || "text-gray-800"

            return (
              <li
                key={key}
                className='flex flex-col flex-wrap items-start justify-between gap-4 px-2 py-4 border-b md:flex-row md:items-center md:gap-6'>
                <div className='flex items-center min-w-[140px] mb-2 md:mb-0 md:mr-4'>
                  <img
                    src={`${import.meta.env.BASE_URL}image/Charm/${encodeURIComponent(amulet.Rarity)}.png`}
                    alt={amulet.Rarity}
                    style={{ width: 40, height: 40, objectFit: "contain" }}
                    className='mr-2 rounded'
                    onError={(e) => {
                      try {
                        if (!e || !e.currentTarget) return
                        const el = e.currentTarget
                        el.style.display = "none"
                      } catch {
                        /* swallow */
                      }
                    }}
                  />
                  <div className='flex flex-col'>
                    <div className={`text-lg font-semibold ${rarityClass}`}>{amulet.Rarity}</div>
                    <div className='flex items-center text-xs font-medium'>
                      {t("amulet.probability")}:{" "}
                      <span className='ml-1'>
                        {typeof probabilityDisplay === "object" ? probabilityDisplay.noSlot.formatted : probabilityDisplay}
                      </span>
                      {t("probability.percentage")}
                    </div>
                  </div>
                </div>

                <div className='flex-1'>
                  <div className='mb-1 text-base'>
                    <span className='font-medium'>{t("amulet.skillGroups")}:</span>
                    <span className='ml-2'>
                      {[amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group]
                        .filter((g) => g !== null && g !== undefined)
                        .map((g, i) => {
                          const groupKey = `Group${g}`
                          const gd = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || {}
                          const bg = gd.bgColor || "#6b7280"
                          const text = gd.color || "#ffffff"
                          return (
                            <span
                              key={i}
                              className='inline-block px-2 py-0.5 rounded text-xs font-medium mr-2'
                              style={{ backgroundColor: bg, color: text }}>
                              {g}
                            </span>
                          )
                        })}
                    </span>
                  </div>

                  <div className='mb-1 text-base'>
                    <span className='font-medium'>{t("amulet.matchingSkills")}:</span>
                    {(!combo || combo.length === 0) && <span className='ml-2 text-sm text-gray-500'>{t("common.none")}</span>}
                    {combo &&
                      combo.map((skillKey, si) => {
                        const match = amuletSkills.find((s) => s.name === skillKey)
                        let displayName = skillKey
                        let bgColor = "#e0e0e0"
                        let textColor = "#38761D"
                        if (match) {
                          const groupKey = `Group${match.group}`
                          if (SkillGroupsData.SkillGroups[groupKey]) {
                            if (SkillGroupsData.SkillGroups[groupKey].bgColor) bgColor = SkillGroupsData.SkillGroups[groupKey].bgColor
                            if (SkillGroupsData.SkillGroups[groupKey].color) textColor = SkillGroupsData.SkillGroups[groupKey].color
                          }
                          // translate skill name and add localized level if present
                          try {
                            const skillBase = match.name.split(" Lv.")[0]
                            const skillLevel = match.name.split(" Lv.")[1]
                            const translated = t(`skillTranslations.${skillBase}`, skillBase)
                            displayName = skillLevel ? `${translated} ${t("common.level")}${skillLevel}` : translated
                          } catch {
                            /* fallback keep original */
                          }
                        }
                        if (!match) {
                          // fallback translate even if skill not present in amuletSkills
                          try {
                            const skillBase = skillKey.split(" Lv.")[0]
                            const skillLevel = skillKey.split(" Lv.")[1]
                            const translated = t(`skillTranslations.${skillBase}`, skillBase)
                            displayName = skillLevel ? `${translated} ${t("common.level")}${skillLevel}` : translated
                          } catch {
                            /* fallback keep original */
                          }
                        }

                        return match ? (
                          <span
                            key={si}
                            className='inline-flex items-center gap-1 mt-2 px-2 py-0.5 ml-2 text-base rounded whitespace-nowrap'
                            style={{ backgroundColor: bgColor, color: textColor, fontWeight: "bold" }}>
                            <img
                              src={`${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(
                                match.name.split(" Lv.")[0].replace(/\//g, "-")
                              )}.png`}
                              alt={match.name.split(" Lv.")[0]}
                              style={{ width: 22, height: 22, objectFit: "contain" }}
                              onError={(e) => {
                                try {
                                  if (!e || !e.currentTarget) return
                                  const el = e.currentTarget
                                  if (el.src && el.src.indexOf("data:image/svg+xml") === -1) el.src = SKILL_PLACEHOLDER_SVG
                                } catch {
                                  /* swallow */
                                }
                              }}
                            />
                            {displayName}
                          </span>
                        ) : (
                          <span key={si} className='inline-block ml-2 text-sm text-gray-600'>
                            {skillKey}
                          </span>
                        )
                      })}
                  </div>
                </div>
                <div className='flex flex-col items-end md:items-end min-w-[80px] mt-2 md:mt-0 md:ml-4'>
                  <button
                    className='px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50'
                    onClick={() => _setExpandedIndex(_expandedIndex === renderedId ? null : renderedId)}>
                    {_expandedIndex === renderedId ? t("common.collapse") : t("common.details")}
                  </button>
                </div>

                {_expandedIndex === renderedId && (
                  <div className='w-full mt-2'>
                    {(() => {
                      const baseProb =
                        (_rarityBaseProbability && _rarityBaseProbability[amulet.Rarity] && _rarityBaseProbability[amulet.Rarity].probability) || 0.01
                      const totalAmuletsOfRarity =
                        _rarityBaseProbability && _rarityBaseProbability[amulet.Rarity] && Array.isArray(_rarityBaseProbability[amulet.Rarity].Group)
                          ? _rarityBaseProbability[amulet.Rarity].Group.length
                          : 0
                      const amuletTypeProb = totalAmuletsOfRarity > 0 ? 1 / totalAmuletsOfRarity : 0

                      const perSlotArraysForCalc = selectedSkills.map((a) => (Array.isArray(a) ? a : a ? [a] : []))
                      const combosForCalc = buildPerSlotCombinations(perSlotArraysForCalc)
                      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((g) => g !== null && g !== undefined)

                      const skillToGroupMapLocal = {}
                      amuletGroups.forEach((groupNum) => {
                        const groupKey = `Group${groupNum}`
                        if (SkillGroupsData && SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) {
                          SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
                            const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
                            if (!skillToGroupMapLocal[skillKey]) skillToGroupMapLocal[skillKey] = []
                            skillToGroupMapLocal[skillKey].push(groupNum)
                          })
                        }
                      })

                      let totalComboProb = 0
                      const skillDrawDetails = []

                      combosForCalc.forEach((c) => {
                        const usedSlotsLocal = []
                        const selectedSkillBaseNamesInGroup = {}
                        let skillCombinationProb = 1

                        for (const skillKey of c) {
                          if (!skillKey) continue
                          const skillGroups = skillToGroupMapLocal[skillKey] || []
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
                            const totalSkillCount =
                              _getGroupSkillCountForRarity && typeof _getGroupSkillCountForRarity === "function"
                                ? _getGroupSkillCountForRarity(groupNumber, amulet.Rarity)
                                : SkillGroupsData && SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[`Group${groupNumber}`]
                                ? SkillGroupsData.SkillGroups[`Group${groupNumber}`].data.length
                                : 1

                            if (!selectedSkillBaseNamesInGroup[groupNumber]) selectedSkillBaseNamesInGroup[groupNumber] = new Set()
                            const currentSkillBaseName = skillKey.split(" Lv.")[0]

                            let excludedSkillCount = 0
                            const excludedBaseNames = new Set()
                            const groupKey = `Group${groupNumber}`
                            if (SkillGroupsData && SkillGroupsData.SkillGroups[groupKey]) {
                              const allSelectedBaseNames = new Set()
                              Object.values(selectedSkillBaseNamesInGroup).forEach((sset) => sset.forEach((v) => allSelectedBaseNames.add(v)))
                              allSelectedBaseNames.forEach((baseName) => {
                                const sameBaseNameSkills = SkillGroupsData.SkillGroups[groupKey].data.filter((sk) => sk.SkillName === baseName)
                                if (sameBaseNameSkills.length > 0) {
                                  excludedSkillCount += sameBaseNameSkills.length
                                  excludedBaseNames.add(baseName)
                                }
                              })
                            }

                            const availableSkillCount = Math.max(1, totalSkillCount - excludedSkillCount)
                            skillCombinationProb *= 1 / availableSkillCount
                            selectedSkillBaseNamesInGroup[groupNumber].add(currentSkillBaseName)

                            skillDrawDetails.push({
                              skill: skillKey,
                              group: groupNumber,
                              total: totalSkillCount,
                              excluded: Array.from(excludedBaseNames),
                              available: availableSkillCount,
                            })
                          }
                        }

                        totalComboProb += baseProb * amuletTypeProb * skillCombinationProb
                      })

                      const finalProb = totalComboProb

                      // sample for human-readable breakdown
                      let sampleSkillCombProb = 1
                      let sampleUsedSkillCounts = []
                      if (combosForCalc && combosForCalc[0]) {
                        const first = combosForCalc[0]
                        const usedSlotsLocal = []
                        const selectedSkillBaseNamesInGroupSample = {}
                        for (const skillKey of first) {
                          if (!skillKey) continue
                          const skillGroups = skillToGroupMapLocal[skillKey] || []
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
                            const totalSkillCount =
                              _getGroupSkillCountForRarity && typeof _getGroupSkillCountForRarity === "function"
                                ? _getGroupSkillCountForRarity(groupNumber, amulet.Rarity)
                                : SkillGroupsData && SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[`Group${groupNumber}`]
                                ? SkillGroupsData.SkillGroups[`Group${groupNumber}`].data.length
                                : 1
                            if (!selectedSkillBaseNamesInGroupSample[groupNumber]) selectedSkillBaseNamesInGroupSample[groupNumber] = new Set()
                            const currentSkillBaseName = skillKey.split(" Lv.")[0]
                            const groupKey = `Group${groupNumber}`
                            let excludedSkillCount = 0
                            if (SkillGroupsData && SkillGroupsData.SkillGroups[groupKey]) {
                              const allSelectedBaseNames = new Set()
                              Object.values(selectedSkillBaseNamesInGroupSample).forEach((sset) => sset.forEach((v) => allSelectedBaseNames.add(v)))
                              allSelectedBaseNames.forEach((baseName) => {
                                const sameBaseNameSkills = SkillGroupsData.SkillGroups[groupKey].data.filter((sk) => sk.SkillName === baseName)
                                if (sameBaseNameSkills.length > 0) excludedSkillCount += sameBaseNameSkills.length
                              })
                            }
                            const availableSkillCount = Math.max(1, totalSkillCount - excludedSkillCount)
                            sampleUsedSkillCounts.push(availableSkillCount)
                            sampleSkillCombProb *= 1 / availableSkillCount
                            selectedSkillBaseNamesInGroupSample[groupNumber].add(currentSkillBaseName)
                          }
                        }
                      }

                      return (
                        <div className='p-2 text-xs text-left border rounded bg-gray-50'>
                          <div className='mb-1 font-medium'>{t("probability.debug.title")}</div>
                          <div className='text-xs'>
                            {t("probability.debug.baseProb")}: {baseProb} ({(baseProb * 100).toFixed(6)}%)
                          </div>
                          <div className='text-xs'>
                            {t("probability.charmTypeProb")}: {amuletTypeProb} (1/{totalAmuletsOfRarity})
                          </div>
                          <div className='text-xs'>
                            {t("probability.debug.skillCombProb")}: {sampleUsedSkillCounts.map((c) => `1/${c}`).join(" × ")} = {sampleSkillCombProb}
                          </div>
                          <div className='text-xs'>
                            {t("probability.debug.finalProb")}: {finalProb} ({(finalProb * 100).toFixed(8)}%)
                          </div>
                          <div className='mt-1 text-xs'>
                            {t("probability.debug.skillGroups")}
                            {(() => {
                              const grouped = {}
                              for (const d of skillDrawDetails) {
                                if (!grouped[d.group]) {
                                  grouped[d.group] = { group: d.group, total: d.total, available: d.available, excluded: new Set(d.excluded || []) }
                                } else {
                                  const cur = grouped[d.group]
                                  cur.total = Math.max(cur.total || 0, d.total || 0)
                                  cur.available = Math.max(cur.available || 0, d.available || 0)
                                  ;(d.excluded || []).forEach((e) => cur.excluded.add(e))
                                }
                              }
                              const displayGroups = amuletGroups
                                .filter((g) => Object.prototype.hasOwnProperty.call(grouped, g))
                                .map((g) => ({ ...grouped[g], excluded: Array.from(grouped[g].excluded) }))

                              return displayGroups.map((d, i) => (
                                <div key={i} className='ml-2'>
                                  {t("common.group")} {d.group}: {t("probability.debug.total")} {d.total} → {t("probability.debug.available")}{" "}
                                  {d.available}
                                  {d.excluded && d.excluded.length > 0 && (
                                    <span className='ml-2 text-gray-600'>
                                      ({t("probability.debug.excluded")}: {d.excluded.map((name) => t(`skillTranslations.${name}`, name)).join(", ")})
                                    </span>
                                  )}
                                </div>
                              ))
                            })()}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </React.Fragment>
  )
}
