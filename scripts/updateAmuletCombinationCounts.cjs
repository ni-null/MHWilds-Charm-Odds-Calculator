const fs = require("fs")
const path = require("path")

const amuletPath = path.join(__dirname, "../src/data/Amulet.json")
const groupsPath = path.join(__dirname, "../src/data/SkillGroups.json")

const amulets = JSON.parse(fs.readFileSync(amuletPath, "utf8"))
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

console.log("Computing combinationCount for", amulets.length, "amulets...")
let updated = 0
for (let i = 0; i < amulets.length; i++) {
  const charm = amulets[i]
  const c = computeForCharm(charm)
  amulets[i].combinationCount = c
  updated++
}

fs.writeFileSync(amuletPath, JSON.stringify(amulets, null, 2), "utf8")
console.log(`Updated ${updated} amulets and wrote to ${amuletPath}`)

amulets.slice(0, 10).forEach((a, idx) => {
  console.log(
    `#${idx} Rarity:${a.Rarity} Groups:[${[a.Skill1Group, a.Skill2Group, a.Skill3Group].filter((g) => g !== null)}] combo:${a.combinationCount}`
  )
})

console.log("Done.")
