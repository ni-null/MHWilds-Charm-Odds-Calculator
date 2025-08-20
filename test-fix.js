// 測試修正後的邏輯
import { readFileSync } from "fs"

const AmuletData = JSON.parse(readFileSync("./src/data/Amulet.json", "utf8"))
const SkillGroupsData = JSON.parse(readFileSync("./src/data/SkillGroups.json", "utf8"))

// 建立技能到群組的映射
const skillToGroupMap = {}
Object.keys(SkillGroupsData.SkillGroups).forEach((groupKey) => {
  const groupNumber = parseInt(groupKey.replace("Group", ""))
  SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
    const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
    if (!skillToGroupMap[skillKey]) {
      skillToGroupMap[skillKey] = []
    }
    skillToGroupMap[skillKey].push(groupNumber)
  })
})

// 測試選擇兩個 "攻擊 Lv.1" 的情況
const selectedSkills = ["Attack Boost Lv.1", "Attack Boost Lv.1"]

console.log("選擇的技能:", selectedSkills)
console.log("Attack Boost Lv.1 所在群組:", skillToGroupMap["Attack Boost Lv.1"])

// 檢查群組6的技能
console.log("\n群組6的技能:")
SkillGroupsData.SkillGroups.Group6.data.forEach((skill) => {
  console.log(`- ${skill.SkillName} Lv.${skill.SkillLevel}`)
})

// 應用修正後的篩選邏輯
const matchingAmulets = AmuletData.filter((amulet) => {
  const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

  // 統計每個技能需要的數量
  const skillCounts = {}
  selectedSkills.forEach((skillKey) => {
    skillCounts[skillKey] = (skillCounts[skillKey] || 0) + 1
  })

  // 檢查護石是否可以提供所有需要的技能
  for (const [skillKey, requiredCount] of Object.entries(skillCounts)) {
    const skillGroups = skillToGroupMap[skillKey] || []

    // 計算護石中有多少個群組可以提供這個技能
    const availableCount = amuletGroups.filter((group) => skillGroups.includes(group)).length

    // 如果可用數量少於需要數量，則此護石不符合
    if (availableCount < requiredCount) {
      return false
    }
  }

  return true
})

console.log("\n符合條件的護石數量:", matchingAmulets.length)
console.log("\n前5個符合條件的護石:")
matchingAmulets.slice(0, 5).forEach((amulet, index) => {
  console.log(`${index + 1}. ${amulet.Rarity} - 群組: ${amulet.Skill1Group}, ${amulet.Skill2Group}, ${amulet.Skill3Group}`)
})

// 特別檢查群組1,6,6的護石
const problematicAmulet = AmuletData.find((a) => a.Skill1Group === 1 && a.Skill2Group === 6 && a.Skill3Group === 6)
if (problematicAmulet) {
  const amuletGroups = [1, 6, 6]
  const attackBoostGroups = skillToGroupMap["Attack Boost Lv.1"]
  const availableCount = amuletGroups.filter((group) => attackBoostGroups.includes(group)).length

  console.log("\n問題護石 (群組1,6,6) 分析:")
  console.log("- 護石群組:", amuletGroups)
  console.log("- Attack Boost Lv.1 所在群組:", attackBoostGroups)
  console.log("- 可提供 Attack Boost Lv.1 的群組數量:", availableCount)
  console.log("- 需要的數量:", 2)
  console.log("- 是否符合:", availableCount >= 2 ? "是" : "否")
}
