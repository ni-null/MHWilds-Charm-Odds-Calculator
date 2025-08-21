import React, { useState, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import AmuletData from "../../data/Amulet.json"
import SkillGroupsData from "../../data/SkillGroups.json"
import RarityBaseProbabilityData from "../../data/RarityBaseProbability.json"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import SkillSelector from "./SkillSelector"
import AmuletList from "./AmuletList"
import { useLanguageSync } from "../../hooks/useLanguageSync"

export default function MHWPage() {
  const { t } = useTranslation()
  useLanguageSync() // 同步語言設置
  const [selectedSkills, setSelectedSkills] = useState([null, null, null])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // 建立技能(含等級)到群組號的映射
  const skillToGroupMap = useMemo(() => {
    const map = {}
    Object.keys(SkillGroupsData.SkillGroups).forEach((groupKey) => {
      const groupNumber = parseInt(groupKey.replace("Group", ""))
      SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
        // 建立包含等級的技能鍵值
        const skillKey = `${skill.SkillName} Lv.${skill.SkillLevel}`
        if (!map[skillKey]) {
          map[skillKey] = []
        }
        map[skillKey].push(groupNumber)
      })
    })
    return map
  }, [])

  // 取得所有護石 Skill1Group/Skill2Group/Skill3Group 對應群組的技能
  const getSkillsByGroup = (groupField) => {
    const groupNumbers = Array.from(new Set(AmuletData.map((a) => a[groupField]).filter((g) => g !== null)))
    const skills = []
    groupNumbers.forEach((groupNumber) => {
      const groupKey = `Group${groupNumber}`
      if (SkillGroupsData.SkillGroups[groupKey]) {
        SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
          skills.push({
            key: `${skill.SkillName} Lv.${skill.SkillLevel}`,
            group: groupNumber,
          })
        })
      }
    })
    // 移除重複
    return Array.from(new Set(skills.map((s) => s.key))).sort()
  }

  // 根據已選擇的技能篩選可用技能
  const getAvailableSkills = (slotIndex) => {
    if (slotIndex === 0) {
      return getSkillsByGroup("Skill1Group")
    }
    if (slotIndex === 1) {
      // 依據第一個選擇，找出所有護石 Skill2Group 可用技能
      if (!selectedSkills[0]) return []
      // 找出所有護石 Skill1Group 包含第一個技能的 Skill2Group
      const firstSkillGroups = skillToGroupMap[selectedSkills[0]]
      const amulets = AmuletData.filter((a) => firstSkillGroups.includes(a.Skill1Group))
      const groupNumbers = Array.from(new Set(amulets.map((a) => a.Skill2Group).filter((g) => g !== null)))
      const skills = []
      groupNumbers.forEach((groupNumber) => {
        const groupKey = `Group${groupNumber}`
        if (SkillGroupsData.SkillGroups[groupKey]) {
          SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
            skills.push({
              key: `${skill.SkillName} Lv.${skill.SkillLevel}`,
              group: groupNumber,
            })
          })
        }
      })
      return Array.from(new Set(skills.map((s) => s.key))).sort()
    }
    if (slotIndex === 2) {
      // 依據前兩個選擇，找出所有護石 Skill3Group 可用技能
      if (!selectedSkills[0] || !selectedSkills[1]) return []
      const firstSkillGroups = skillToGroupMap[selectedSkills[0]]
      const secondSkillGroups = skillToGroupMap[selectedSkills[1]]
      const amulets = AmuletData.filter((a) => firstSkillGroups.includes(a.Skill1Group) && secondSkillGroups.includes(a.Skill2Group))
      const groupNumbers = Array.from(new Set(amulets.map((a) => a.Skill3Group).filter((g) => g !== null)))
      const skills = []
      groupNumbers.forEach((groupNumber) => {
        const groupKey = `Group${groupNumber}`
        if (SkillGroupsData.SkillGroups[groupKey]) {
          SkillGroupsData.SkillGroups[groupKey].data.forEach((skill) => {
            skills.push({
              key: `${skill.SkillName} Lv.${skill.SkillLevel}`,
              group: groupNumber,
            })
          })
        }
      })
      return Array.from(new Set(skills.map((s) => s.key))).sort()
    }
    return []
  }

  // 根據選擇的技能篩選護石
  const matchingAmulets = useMemo(() => {
    const selectedSkillsFiltered = selectedSkills.filter(Boolean)
    if (selectedSkillsFiltered.length === 0) return []

    return AmuletData.filter((amulet) => {
      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

      // 嘗試為每個選擇的技能分配槽位（不是群組號碼）
      const usedSlots = []

      for (const skillKey of selectedSkillsFiltered) {
        const skillGroups = skillToGroupMap[skillKey] || []

        // 找到一個未使用的槽位，且該槽位的群組可以提供此技能
        let foundSlot = false
        for (let slotIndex = 0; slotIndex < amuletGroups.length; slotIndex++) {
          if (!usedSlots.includes(slotIndex) && skillGroups.includes(amuletGroups[slotIndex])) {
            usedSlots.push(slotIndex)
            foundSlot = true
            break
          }
        }

        if (!foundSlot) {
          // 如果找不到可用的槽位，此護石不符合
          return false
        }
      }

      return true
    })
  }, [selectedSkills, skillToGroupMap])

  const handleSkillChange = (slotIndex, skillKey) => {
    const newSelectedSkills = [...selectedSkills]
    newSelectedSkills[slotIndex] = skillKey || null

    // 清除後面的選擇
    for (let i = slotIndex + 1; i < 3; i++) {
      newSelectedSkills[i] = null
    }

    setSelectedSkills(newSelectedSkills)
  }

  // 取得技能所在的群組資訊
  const getSkillGroupInfo = (skillKey) => {
    const groups = skillToGroupMap[skillKey]
    return groups ? groups.join(", ") : "Unknown"
  }

  // 根據護石群組取得可能的技能
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

  // 稀有度基礎機率設定
  const rarityBaseProbability = RarityBaseProbabilityData

  // 計算每個群組在特定稀有度下的技能數量
  const getGroupSkillCountForRarity = useCallback((groupNumber, rarity) => {
    // 對於Monster Hunter護石系統：
    // 每個群組的技能數量在所有稀有度下都是相同的
    // 稀有度主要影響基礎出現機率，而不是技能選擇池
    const groupKey = `Group${groupNumber}`
    const totalGroupSkills = SkillGroupsData.SkillGroups[groupKey] ? SkillGroupsData.SkillGroups[groupKey].data.length : 1

    // 檢查該稀有度是否實際包含此群組
    const hasGroupInRarity = AmuletData.some(
      (amulet) =>
        amulet.Rarity === rarity && (amulet.Skill1Group === groupNumber || amulet.Skill2Group === groupNumber || amulet.Skill3Group === groupNumber)
    )

    return hasGroupInRarity ? totalGroupSkills : 1
  }, [])

  // 計算護石的精確出現機率
  const calculateAmuletProbability = useCallback(
    (amulet) => {
      const baseProb = rarityBaseProbability[amulet.Rarity] || 0.01
      const selectedSkillsFiltered = selectedSkills.filter(Boolean)

      if (selectedSkillsFiltered.length === 0) return baseProb

      // 計算該稀有度下護石類型的總數
      const amuletsOfSameRarity = AmuletData.filter((a) => a.Rarity === amulet.Rarity)
      const amuletTypeProb = 1 / amuletsOfSameRarity.length

      // 獲取護石的群組
      const amuletGroups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

      // 計算技能組合機率：基於實際分配給每個技能的槽位
      let skillCombinationProb = 1
      const usedSlots = []

      for (const skillKey of selectedSkillsFiltered) {
        const skillGroups = skillToGroupMap[skillKey] || []

        // 找到一個未使用的槽位，且該槽位的群組可以提供此技能
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
          const skillCount = getGroupSkillCountForRarity(groupNumber, amulet.Rarity)
          skillCombinationProb *= 1 / skillCount
        }
      }

      // 最終機率 = 基礎機率 × 護石類型機率 × 技能組合機率
      return baseProb * amuletTypeProb * skillCombinationProb
    },
    [rarityBaseProbability, getGroupSkillCountForRarity, selectedSkills, skillToGroupMap]
  )

  // 計算匹配護石的機率分布
  const amuletProbabilities = useMemo(() => {
    if (matchingAmulets.length === 0) return {}

    const probabilities = {}
    matchingAmulets.forEach((amulet, index) => {
      const probability = calculateAmuletProbability(amulet)
      const percentageProb = probability * 100

      // 更智能的小數位數格式化，避免科學記號
      let formattedProb
      if (percentageProb >= 0.01) {
        formattedProb = percentageProb.toFixed(4)
      } else if (percentageProb >= 0.001) {
        formattedProb = percentageProb.toFixed(6)
      } else if (percentageProb >= 0.0001) {
        formattedProb = percentageProb.toFixed(8)
      } else {
        // 對於非常小的數字，使用更多小數位數並移除尾隨的零
        formattedProb = percentageProb.toFixed(12).replace(/\.?0+$/, "")
        // 如果還是會變成科學記號，則使用 toPrecision
        if (formattedProb.includes("e")) {
          formattedProb = percentageProb.toPrecision(8)
          if (formattedProb.includes("e")) {
            // 手動格式化避免科學記號
            const str = percentageProb.toString()
            if (str.includes("e")) {
              formattedProb = percentageProb.toFixed(15).replace(/\.?0+$/, "")
            } else {
              formattedProb = str
            }
          }
        }
      }

      probabilities[index] = formattedProb
    })

    return probabilities
  }, [matchingAmulets, calculateAmuletProbability])

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <div className='flex flex-col flex-1 lg:ml-64'>
        <Header onMenuToggle={handleSidebarToggle} title={t("title")} />
        <main className='flex-1 p-6'>
          <div className='container mx-auto max-w-7xl'>
            {/* 頁面標題 */}
            <div className='mb-8'>
              <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 lg:block'>{t("title")}</h1>
            </div>

            <SkillSelector
              selectedSkills={selectedSkills}
              onSkillChange={handleSkillChange}
              getAvailableSkills={getAvailableSkills}
              getSkillGroupInfo={getSkillGroupInfo}
            />

            <AmuletList
              matchingAmulets={matchingAmulets}
              amuletProbabilities={amuletProbabilities}
              rarityBaseProbability={rarityBaseProbability}
              selectedSkills={selectedSkills}
              getSkillsFromAmulet={getSkillsFromAmulet}
              getGroupSkillCountForRarity={getGroupSkillCountForRarity}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
