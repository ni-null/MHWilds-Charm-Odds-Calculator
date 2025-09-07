import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { Calculator } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import AmuletList from "../components/AmuletList"
import HuntTimeCalculator from "../components/HuntTimeCalculator"
import { useLanguageSync } from "../../hooks/useLanguageSync"
import useMhwStore from "../../store/mhwStore"
import { Button } from "@/components/ui/button"
import CharmExportImportControls from "./CharmExportImportControls"

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
        <main className='flex-1 p-2 md:p-6'>
          <div className='container mx-auto max-w-9xl'>
            {/* 頁面標題 */}
            {favoriteCharms.length > 0 && (
              <div className='mb-8'>
                <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 xl:block'>{t("favorites.title", "收藏護石")}</h1>
                <CharmExportImportControls />
              </div>
            )}

            {favoriteCharms.length > 0 ? (
              <>
                <div className='px-2 mb-5 bg-white rounded-md md:px-6'>
                  <HuntTimeCalculator AvlCharms={favoriteCharms} />
                </div>

                <AmuletList charms={favoriteCharms} favoriteCharms={favoriteCharms} />
              </>
            ) : (
              <div className='flex flex-col items-center justify-center px-4 py-16'>
                <div className='mb-6 opacity-50 text-8xl'>⭐</div>
                <h3 className='mb-3 text-2xl font-bold text-gray-700'>{t("favorites.emptyTitle", "收藏清單為空")}</h3>
                <p className='max-w-md mb-8 text-center text-gray-500'>
                  {t("favorites.emptyDescription", "您還沒有收藏任何護石。前往主頁探索並收藏您喜歡的護石吧！")}
                </p>
                <div className='flex gap-4'>
                  <Button
                    onClick={() => (window.location.href = `${import.meta.env.BASE_URL}charm-type`)}
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'>
                    <Calculator className='w-4 h-4' />
                    {t("favorites.goToCalculator", "前往護石計算器")}
                  </Button>

                  <CharmExportImportControls />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
