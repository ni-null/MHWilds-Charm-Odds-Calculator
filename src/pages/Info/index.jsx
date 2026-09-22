import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"

const InfoPage = () => {
  const { t } = useTranslation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div>
      <div className='flex min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
        <div className={`flex flex-col flex-1 xl:ml-64  w-full ${isSidebarOpen ? "ml-64" : ""}`}>
          <Header onMenuToggle={handleSidebarToggle} title={t("info.title", { defaultValue: "Info" })} />
          <main className='flex-1 p-4 sm:p-6'>
            <div className='container mx-auto max-w-9xl'>
              <div className='mb-6 sm:mb-8'>
                <h1 className='hidden mb-4 text-4xl font-bold text-gray-800 xl:block'>{t("info.title", { defaultValue: "Info" })}</h1>

                <div className='gap-6 sm:gap-8'>
                  <div className='p-4 bg-white rounded-lg shadow sm:p-6'>
                    <h2 className='mb-2 text-lg font-semibold text-gray-700'>{t("info.datasource.title", { defaultValue: "Data Sources" })}</h2>

                    <p className='mb-4 text-sm text-gray-600 sm:text-base'>
                      {t("info.datasource.description", { defaultValue: "Project data sources" })}
                    </p>
                    <a
                      href='https://docs.google.com/spreadsheets/d/1fpkamu1VzEpX8dZqecygW1GflKyvdY2975Y0d9SUt04/edit?gid=0#gid=0'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block w-full px-4 py-2 text-xs font-medium text-center text-blue-600 break-all border border-blue-200 rounded sm:text-sm bg-blue-50 hover:bg-blue-100'>
                      {t("info.datasource.linkLabel", { defaultValue: "Google Sheets" })}
                    </a>
                    <div className='mt-4 text-xs text-gray-500 sm:text-sm'>
                      {t("info.datasource.note", { defaultValue: "Community-maintained data may contain conversion errors." })}
                    </div>
                  </div>

                  <div className='p-4 mt-6 bg-white rounded-lg shadow sm:p-6 sm:mt-10'>
                    <h2 className='mb-2 text-lg font-semibold text-gray-700'>{t("info.calculation.title", { defaultValue: "Probability Calculation" })}</h2>
                    <p className='mb-4 text-sm text-gray-600 sm:text-base'>{t("info.calculation.description", { defaultValue: "This project uses the following probability formula:" })}</p>
                    <div className='p-4 mb-4 font-mono text-sm rounded-lg bg-gray-50 sm:text-base'>
                      <div className='text-center'>
                        {t("info.calculation.formula", { defaultValue: "P(Specific Charm) = P(Rarity) × P(Template | Rarity) × P(Skill Combination | Template)" })}
                      </div>
                    </div>
                    <p className='mb-4 text-sm text-gray-600 sm:text-base'>{t("info.calculation.reference", { defaultValue: "Reference:" })}</p>
                    <a
                      href='https://forum.gamer.com.tw/C.php?bsn=5786&snA=177107'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block w-full px-4 py-2 text-xs font-medium text-center text-blue-600 break-all border border-blue-200 rounded sm:text-sm bg-blue-50 hover:bg-blue-100'>
                      {t("info.calculation.referenceLink", { defaultValue: "Reference guide" })}
                    </a>
                  </div>

                  <div className='p-4 mt-6 bg-white rounded-lg shadow sm:p-6 sm:mt-10'>
                    <h2 className='mb-2 text-lg font-semibold text-gray-700'>{t("info.project.title", { defaultValue: "Project Repository" })}</h2>
                    <p className='mb-4 text-sm text-gray-600 sm:text-base'>
                      {t("info.project.description", { defaultValue: "Project source code and resources are hosted on GitHub:" })}
                    </p>
                    <a
                      href={t("info.project.linkLabel", { defaultValue: "https://github.com/ni-null/MHWilds-Charm-Odds-Calculator" })}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block w-full px-4 py-2 mb-3 text-xs font-medium text-center text-white break-all bg-gray-800 rounded sm:text-sm hover:bg-gray-900'>
                      https://github.com/ni-null/MHWilds-Charm-Odds-Calculator
                    </a>
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
