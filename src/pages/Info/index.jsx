import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import skillGroupsData from "../../data/SkillGroups.json"
import { SUPPORTED_LANGUAGES } from "../../i18n/languages.js"

const SKILL_PLACEHOLDER_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>" +
      "<rect fill='%23f3f4f6' width='100%' height='100%' rx='4'/>" +
      "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%239ca3af'>?</text>" +
      "</svg>"
  )

const getSkillIconSource = (skillName) =>
  `${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skillName.replace(/\//g, "-"))}.png`

const InfoPage = () => {
  const { t } = useTranslation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [skillSearchTerm, setSkillSearchTerm] = useState("")

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const skills = useMemo(
    () =>
      Array.from(new Set(Object.values(skillGroupsData.SkillGroups).flatMap((group) => group.data.map((skill) => skill.SkillName)))).sort((a, b) =>
        a.localeCompare(b)
      ),
    []
  )

  const filteredSkills = useMemo(() => {
    const normalizedSearch = skillSearchTerm.trim().toLocaleLowerCase()
    if (!normalizedSearch) return skills

    return skills.filter((skillName) =>
      [skillName, ...SUPPORTED_LANGUAGES.map((language) => language.translation.skillTranslations?.[skillName] || skillName)].some((name) =>
        name.toLocaleLowerCase().includes(normalizedSearch)
      )
    )
  }, [skillSearchTerm, skills])

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

                  <section className='p-4 mt-6 bg-white rounded-lg shadow sm:p-6 sm:mt-10' aria-labelledby='skill-names-heading'>
                    <h2 id='skill-names-heading' className='mb-2 text-lg font-semibold text-gray-700'>{t("skillNames.title")}</h2>
                    <p className='text-sm text-gray-600 sm:text-base'>{t("skillNames.description")}</p>
                    <a
                      href='https://github.com/ni-null/MHWilds-Charm-Odds-Calculator/issues/new'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex mt-3 font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900'>
                      {t("skillNames.reportIssue")}
                    </a>

                    <div className='flex flex-col gap-3 mt-5 mb-4 sm:flex-row sm:items-center sm:justify-between'>
                      <label className='sr-only' htmlFor='skill-name-search'>
                        {t("skillNames.search")}
                      </label>
                      <input
                        id='skill-name-search'
                        type='search'
                        value={skillSearchTerm}
                        onChange={(event) => setSkillSearchTerm(event.target.value)}
                        placeholder={t("skillNames.search")}
                        className='w-full max-w-md px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
                      />
                      <p className='text-sm text-gray-600'>{t("skillNames.count", { count: filteredSkills.length })}</p>
                    </div>

                    <div className='overflow-x-auto border border-gray-200 rounded-lg'>
                      <table className='w-full text-sm text-left text-gray-700 whitespace-nowrap'>
                        <thead className='text-xs tracking-wide text-gray-700 uppercase bg-gray-100'>
                          <tr>
                            <th scope='col' className='px-4 py-3'>{t("skillNames.icon")}</th>
                            <th scope='col' className='px-4 py-3'>{t("skillNames.sourceName")}</th>
                            {SUPPORTED_LANGUAGES.map((language) => (
                              <th key={language.code} scope='col' className='px-4 py-3'>{language.nativeName}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSkills.map((skillName) => (
                            <tr key={skillName} className='border-t border-gray-200 hover:bg-amber-50/60'>
                              <td className='px-4 py-2'>
                                <img
                                  src={getSkillIconSource(skillName)}
                                  alt={skillName}
                                  loading='lazy'
                                  className='object-contain w-10 h-10'
                                  onError={(event) => {
                                    event.currentTarget.onerror = null
                                    event.currentTarget.src = SKILL_PLACEHOLDER_SVG
                                  }}
                                />
                              </td>
                              <th scope='row' className='px-4 py-2 font-medium text-gray-900'>{skillName}</th>
                              {SUPPORTED_LANGUAGES.map((language) => (
                                <td key={language.code} className='px-4 py-2'>
                                  {language.translation.skillTranslations?.[skillName] || skillName}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

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
