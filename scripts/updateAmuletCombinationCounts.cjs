const fs = require("fs")
const path = require("path")

const rarityPath = path.join(__dirname, "../src/data/Rarity.json")
const groupsPath = path.join(__dirname, "../src/data/SkillGroups.json")

const rarityData = JSON.parse(fs.readFileSync(rarityPath, "utf8"))
const groupsData = JSON.parse(fs.readFileSync(groupsPath, "utf8"))

function groupKeyFromValue(g) {
  if (g === null || g === undefined) return null
  return typeof g === "number" ? `Group${g}` : `${g}`
}

function computeForCharm(charm) {
  const rawGroups = [charm.Skill1Group, charm.Skill2Group, charm.Skill3Group].filter((g) => g !== null && g !== undefined)
  if (rawGroups.length === 0) return 0
  const groupKeys = rawGroups.map(groupKeyFromValue)
  const groupsSkills = groupKeys.map((k) => (groupsData.SkillGroups && groupsData.SkillGroups[k] ? groupsData.SkillGroups[k].data : []))

  let count = 0
  function dfs(pos, usedNames) {
    if (pos === groupsSkills.length) {
      count++
      return
    }
    const pool = groupsSkills[pos]
    if (!pool || pool.length === 0) return
    for (let i = 0; i < pool.length; i++) {
      const skill = pool[i]
      const baseName = skill.SkillName
      if (usedNames.has(baseName)) continue
      usedNames.add(baseName)
      dfs(pos + 1, usedNames)
      usedNames.delete(baseName)
    }
  }
  dfs(0, new Set())
  return count
}

// iterate rarityData and compute combinationCount per Group entry
let updated = 0
const totalGroups = Object.values(rarityData).reduce((sum, r) => sum + (Array.isArray(r.Group) ? r.Group.length : 0), 0)
console.log(`Computing combinationCount for ${totalGroups} group entries across rarities...`)
Object.entries(rarityData).forEach(([rarity, data]) => {
  const groups = data.Group || []
  groups.forEach((gObj) => {
    const skills = gObj.skills || []
    const charm = { Skill1Group: skills[0] || null, Skill2Group: skills[1] || null, Skill3Group: skills[2] || null }
    const c = computeForCharm(charm)
    gObj.combinationCount = c
    updated++
  })
})

fs.writeFileSync(rarityPath, JSON.stringify(rarityData, null, 2), "utf8")
console.log(`Updated ${updated} group entries and wrote to ${rarityPath}`)

// print sample
let printed = 0
Object.entries(rarityData).forEach(([rarity, data]) => {
  ;(data.Group || []).slice(0, 3).forEach((g, idx) => {
    if (printed < 10) {
      console.log(`# ${rarity} Group[${idx}] skills:${JSON.stringify(g.skills)} combo:${g.combinationCount}`)
      printed++
    }
  })
})

console.log("Done.")
