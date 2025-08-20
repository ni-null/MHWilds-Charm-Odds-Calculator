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

      // 檢查護石是否可以包含所有選擇的技能
      return selectedSkillsFiltered.every((skillKey) => {
        const requiredGroups = skillToGroupMap[skillKey]
        return requiredGroups.some((group) => amuletGroups.includes(group))
      })
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

      // 取得所有非null的群組
      const groups = [amulet.Skill1Group, amulet.Skill2Group, amulet.Skill3Group].filter((group) => group !== null)

      // 計算技能組合機率：考慮該稀有度下每個群組的技能數量
      let skillCombinationProb = 1
      groups.forEach((groupNumber) => {
        const skillCount = getGroupSkillCountForRarity(groupNumber, amulet.Rarity)
        skillCombinationProb *= 1 / skillCount
      })

      // 最終機率 = 基礎機率 × 技能組合機率
      return baseProb * skillCombinationProb
    },
    [rarityBaseProbability, getGroupSkillCountForRarity]
  )

  // 計算匹配護石的機率分布
  const amuletProbabilities = useMemo(() => {
    if (matchingAmulets.length === 0) return {}

    const probabilities = {}
    matchingAmulets.forEach((amulet, index) => {
      const probability = calculateAmuletProbability(amulet)
      // 轉換為百分比並保留適當的小數位數
      if (probability >= 0.01) {
        probabilities[index] = (probability * 100).toFixed(2)
      } else if (probability >= 0.001) {
        probabilities[index] = (probability * 100).toFixed(3)
      } else {
        probabilities[index] = (probability * 100).toFixed(4)
      }
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
