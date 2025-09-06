import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import AmuletList from "../components/AmuletList"
import HuntTimeCalculator from "../components/HuntTimeCalculator"
import { useLanguageSync } from "../../hooks/useLanguageSync"
import useMhwStore from "../../store/mhwStore"

export default function FavoriteCharmsPage() {
  const { t } = useTranslation()
  useLanguageSync() // 同步語言設置

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const { favoriteCharms } = useMhwStore()

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <div className={`flex flex-col flex-1 xl:ml-64 w-full ${isSidebarOpen ? "ml-64" : ""}`}>
        <Header onMenuToggle={handleSidebarToggle} title={t("favorites.title", "收藏護石")} />
        <main className='flex-1 p-6'>
          <div className='container mx-auto max-w-9xl'>
            {/* 頁面標題 */}
            <div className='mb-8'>
              <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 xl:block'>{t("favorites.title", "收藏護石")}</h1>
            </div>

            {favoriteCharms.length > 0 ? (
              <>
                <HuntTimeCalculator AvlCharms={favoriteCharms} />
                <AmuletList charms={favoriteCharms} favoriteCharms={favoriteCharms} />
              </>
            ) : (
              <div className='text-center text-gray-500'>{t("favorites.empty", "沒有收藏的護石")}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
