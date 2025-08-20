import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const navs = [
    { to: "/", label: t("navigation.home") },
    { to: "/skill-groups", label: t("navigation.skillGroups") },
    { to: "/charm-types", label: t("navigation.charmTypes") },
    { to: "/info", label: t("navigation.info") },
  ]

  return (
    <>
      {/* 移動端遮罩 */}
      {isOpen && <div className='fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden' onClick={onToggle} />}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-30 flex flex-col w-64 h-screen text-yellow-100 shadow-2xl 
        bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
        border-r border-yellow-600/30
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:z-20
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
        style={{
          background: `linear-gradient(180deg, 
            #1f2937 0%, 
            #111827 20%, 
            #0f172a 40%, 
            #020617 50%, 
            #0f172a 60%, 
            #111827 80%, 
            #1f2937 100%)`,
        }}>
        <div className='flex items-center justify-center h-20 border-b border-yellow-500/30 bg-black/30'>
          <div className='flex flex-col items-center'>
            <span className='text-xl font-bold tracking-wider text-yellow-400 drop-shadow-lg'>MHWildsCharm</span>
            <span className='text-sm font-medium tracking-widest text-yellow-300/80'>CALCULATOR</span>
          </div>
        </div>
        <nav className='flex-1 px-4 py-8 space-y-3'>
          {navs.map((nav) => {
            const isActive = location.pathname === nav.to || (nav.to === "/" && location.pathname === "")
            return (
              <Link
                key={nav.to}
                to={nav.to}
                className={`
                  group relative block px-4 py-3 font-medium transition-all duration-200 rounded-lg 
                  border border-transparent backdrop-blur-sm
                  hover:bg-yellow-500/10 hover:border-yellow-400/30 hover:shadow-lg hover:scale-105
                  ${
                    isActive
                      ? "bg-yellow-500/20 border-yellow-400/50 font-bold text-yellow-300 shadow-md"
                      : "text-yellow-100/90 hover:text-yellow-200"
                  }
                `}
                onClick={() => {
                  // 在移動端點擊導航後關閉 sidebar
                  if (window.innerWidth < 1024) {
                    onToggle()
                  }
                }}>
                <div
                  className={`absolute inset-0 rounded-lg transition-opacity ${
                    isActive ? "bg-gradient-to-r from-yellow-500/10 to-yellow-400/10" : ""
                  }`}
                />
                <span className='relative z-10 flex items-center'>
                  <div className='flex-shrink-0 w-2 h-2 mr-3 rounded-full'>
                    {isActive && <div className='w-full h-full bg-yellow-400 rounded-full shadow-sm animate-pulse' />}
                  </div>
                  {nav.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* 語言選擇器 */}
        <div className='px-4 py-4 border-t border-yellow-500/20 bg-black/20 backdrop-blur-sm'>
          <label className='block mb-3 text-sm font-semibold tracking-wide text-yellow-300'>
            {i18n.language === "zhTW" ? "語言 / Language" : t("navigation.languageLabel")}
          </label>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className='w-full p-3 text-sm text-yellow-200 transition-colors border rounded-lg shadow-inner cursor-pointer bg-gray-800/80 border-yellow-600/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 hover:bg-gray-700/80'>
            <option value='zhTW' className='bg-gray-800'>
              繁體中文
            </option>
            <option value='enUS' className='bg-gray-800'>
              English
            </option>
          </select>
        </div>

        <div className='p-4 text-xs border-t text-yellow-400/70 border-yellow-500/20 bg-black/30 backdrop-blur-sm'>
          <div className='text-center'>
            <div className='font-medium text-yellow-300'>© 2025 MHWildsCharmCalculator</div>
            <div className='text-yellow-500/60'>Built by Ninull</div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
