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
    <div>
      <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
        <div className='flex flex-col flex-1 lg:ml-64'>
          <Header onMenuToggle={handleSidebarToggle} title={t("info.title") || "資訊"} />
          <main className='flex-1 p-4 sm:p-6'>
            <div className='container mx-auto max-w-7xl'>
              <div className='mb-6 sm:mb-8'>
                <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 lg:block'>{t("info.title") || "資訊"}</h1>

                <div className='gap-6 sm:gap-8'>
                  <div className='p-4 bg-white rounded-lg shadow sm:p-6'>
                    <h2 className='mb-2 text-lg font-semibold text-gray-700'>{t("info.datasource.title") || "資料來源"}</h2>

                    <p className='mb-4 text-sm text-gray-600 sm:text-base'>
                      {t("info.datasource.description") || "以下為本專案主要使用與整理的原始資料（Google Sheets）："}
                    </p>
                    <a
                      href='https://docs.google.com/spreadsheets/d/1fpkamu1VzEpX8dZqecygW1GflKyvdY2975Y0d9SUt04/edit?gid=0#gid=0'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block w-full px-4 py-2 text-xs font-medium text-center text-blue-600 break-all border border-blue-200 rounded sm:text-sm bg-blue-50 hover:bg-blue-100'>
                      {t("info.datasource.linkLabel") || "Google Sheets 資料表"}
                    </a>
                    <div className='mt-4 text-xs text-gray-500 sm:text-sm'>
                      {t("info.datasource.note") ||
                        "注意：資料由社群整理與轉換，可能包含手動編輯或轉換錯誤。若發現問題，歡迎回報或在原始資料表提出修正建議。"}
                    </div>
                  </div>

                  <div className='p-4 mt-6 bg-white rounded-lg shadow sm:p-6 sm:mt-10'>
                    <h2 className='mb-2 text-lg font-semibold text-gray-700'>{t("info.calculation.title") || "機率計算"}</h2>
                    <p className='mb-4 text-sm text-gray-600 sm:text-base'>
                      {t("info.calculation.description") || "本專案使用以下機率計算公式："}
                    </p>
                    <div className='p-4 mb-4 text-sm bg-gray-50 rounded-lg sm:text-base font-mono'>
                      <div className='text-center'>
                        {t("info.calculation.formula") || "P(特定護石) = P(稀有度) × P(模板 | 稀有度) × P(技能組合 | 模板)"}
                      </div>
                    </div>
                    <p className='mb-4 text-sm text-gray-600 sm:text-base'>
                      {t("info.calculation.reference") || "參考資料："}
                    </p>
                    <a
                      href='https://www.gamersky.com/handbook/202508/1979751.shtml'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block w-full px-4 py-2 text-xs font-medium text-center text-blue-600 break-all border border-blue-200 rounded sm:text-sm bg-blue-50 hover:bg-blue-100'>
                      {t("info.calculation.referenceLink") || "遊民星空 - rongchingl 攻略"}
                    </a>
                  </div>

                  <div className='p-4 mt-6 bg-white rounded-lg shadow sm:p-6 sm:mt-10'>
                    <h2 className='mb-2 text-lg font-semibold text-gray-700'>{t("info.project.title") || "專案資料夾"}</h2>
                    <p className='mb-4 text-sm text-gray-600 sm:text-base'>
                      {t("info.project.description") || "本專案程式碼與相關資源已放在 GitHub："}
                    </p>
                    <a
                      href={t("info.project.linkLabel") || "https://github.com/ni-null/MHWilds-Charm-Odds-Calculator"}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block w-full px-4 py-2 mb-3 text-xs font-medium text-center text-white break-all bg-gray-800 rounded sm:text-sm hover:bg-gray-900'>
                      https://github.com/ni-null/MHWilds-Charm-Odds-Calculator
                    </a>
                    <div className='mt-4 text-xs text-gray-500 sm:text-sm'>
                      {t("info.project.encourage") || "如果你覺得這個專案有幫助，歡迎在 GitHub 上給個星星 ⭐️，這會是很大的鼓勵！"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default InfoPage
