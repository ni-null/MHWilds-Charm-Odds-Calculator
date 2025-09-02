import React, { useState } from "react"
import { useTranslation } from "react-i18next"
// AmuletData is now represented inside RarityBaseProbability.json as Group + combinationCount

import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import SkillSelector from "./SkillSelector"
import AmuletList from "./AmuletList"
import SlotProbability from "./SlotProbability"
import { useLanguageSync } from "../../hooks/useLanguageSync"
import ProbabilityExplanation from "./ProbabilityExplanation"
import TotalProbability from "./components/TotalProbability"

export default function MHWPage() {
  const { t } = useTranslation()
  useLanguageSync() // 同步語言設置

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

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

            <SkillSelector />

            <SlotProbability />

            {/* 顯示總機率的組件 */}
            <TotalProbability />

            <AmuletList />
            {/* 機率計算說明（從 AmuletList 提出，集中顯示於頁面） */}

            <ProbabilityExplanation />
          </div>
        </main>
      </div>
    </div>
  )
}
