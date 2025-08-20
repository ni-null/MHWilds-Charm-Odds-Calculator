import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import { useLanguageSync } from "../../hooks/useLanguageSync"

const InfoPage = () => {
  const { t } = useTranslation()
  useLanguageSync()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <div className='flex flex-col flex-1 lg:ml-64'>
        <Header onMenuToggle={handleSidebarToggle} title={t("info.title") || "資訊"} />
        <main className='flex-1 p-6'>
          <div className='container max-w-4xl mx-auto'>
            <div className='mb-8'>
              <h1 className='mb-4 text-2xl font-bold text-gray-800'>{t("info.title") || "資訊"}</h1>
              <div className='p-6 bg-white rounded-lg shadow'>
                <h2 className='mb-2 text-lg font-semibold text-gray-700'>{t("info.datasource.title") || "資料來源"}</h2>

                <p className='mb-4 text-gray-600'>{t("info.datasource.description") || "以下為本專案主要使用與整理的原始資料（Google Sheets）："}</p>
                <a
                  href='https://docs.google.com/spreadsheets/d/1fpkamu1VzEpX8dZqecygW1GflKyvdY2975Y0d9SUt04/edit?gid=0#gid=0'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-block px-4 py-2 text-sm font-medium text-blue-500 rounded '>
                  {t("info.datasource.linkLabel") ||
                    "https://docs.google.com/spreadsheets/d/1fpkamu1VzEpX8dZqecygW1GflKyvdY2975Y0d9SUt04/edit?gid=0#gid=0"}
                </a>
                <div className='mt-4 text-sm text-gray-500'>
                  {t("info.datasource.note") ||
                    "注意：資料由社群整理與轉換，可能包含手動編輯或轉換錯誤。若發現問題，歡迎回報或在原始資料表提出修正建議。"}
                </div>
              </div>
            </div>
            <div className='mb-8'>
              <div className='p-6 bg-white rounded-lg shadow'>
                <h2 className='mb-2 text-lg font-semibold text-gray-700'>{t("info.project.title") || "專案資料夾"}</h2>
                <p className='mb-4 text-gray-600'>{t("info.project.description") || "本專案程式碼與相關資源已放在 GitHub："}</p>
                <a
                  href={t("info.project.linkLabel") || "https://github.com/ni-null/MHWilds-Charm-Odds-Calculator"}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-block px-4 py-2 mr-3 text-sm font-medium text-white bg-gray-800 rounded hover:bg-gray-900'>
                  {t("info.project.linkLabel") || "https://github.com/ni-null/MHWilds-Charm-Odds-Calculator"}
                </a>
                <div className='mt-4 text-sm text-gray-500'>
                  {t("info.project.encourage") || "如果你覺得這個專案有幫助，歡迎在 GitHub 上給個星星 ⭐️，這會是很大的鼓勵！"}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default InfoPage
