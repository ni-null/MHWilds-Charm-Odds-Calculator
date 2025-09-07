import React, { useState } from "react"
import { useTranslation } from "react-i18next"
// AmuletData is now represented inside RarityBaseProbability.json as Group + combinationCount

import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import SkillSelector from "./SkillSelector"
import AmuletList from "../components/AmuletList"
import { useLanguageSync } from "../../hooks/useLanguageSync"
import ProbabilityExplanation from "./ProbabilityExplanation"
import HuntTimeCalculator from "../components/HuntTimeCalculator"
import useMhwStore from "../../store/mhwStore"

export default function MHWPage() {
  const { t } = useTranslation()
  useLanguageSync() // 同步語言設置

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const { AvlCharms, favoriteCharms } = useMhwStore()

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <div className={`flex flex-col flex-1 xl:ml-64 w-full ${isSidebarOpen ? "ml-64" : ""}`}>
        <Header onMenuToggle={handleSidebarToggle} title={t("MHWildsCharmOddsCalculator.title")} />
        <main className='flex-1 p-2 md:p-6'>
          <div className='container mx-auto max-w-9xl'>
            {/* 頁面標題 */}
            <div className='mb-8'>
              <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 xl:block'>{t("MHWildsCharmOddsCalculator.title")}</h1>
            </div>

            <SkillSelector />

            <div className='w-full p-5 mb-8 bg-white md:p-10 rounded-xl'>
              {/* 怪物討伐需要時間計算 */}
              <HuntTimeCalculator AvlCharms={AvlCharms} />
            </div>

            <AmuletList charms={AvlCharms} favoriteCharms={favoriteCharms} />
            {/* 機率計算說明（從 AmuletList 提出，集中顯示於頁面） */}

            <ProbabilityExplanation />
          </div>
        </main>
      </div>
    </div>
  )
}
