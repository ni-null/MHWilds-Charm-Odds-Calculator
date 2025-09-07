import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Calculator, Grid3x3, Diamond, Star, Info } from "lucide-react"

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const { t, i18n } = useTranslation()
  // 由 Vite 注入的環境變數（在 CI/CD pipeline 裡設定 VITE_BUILD_TIME）
  const buildTimeRaw = import.meta.env.VITE_BUILD_TIME || import.meta.env.VITE_BUILD_TIMESTAMP || null
  const buildLabel = t("version.buildTime", { defaultValue: "Build Time" })
  const unknownLabel = t("version.unknown", { defaultValue: "N/A" })
  const buildTime = buildTimeRaw
    ? (() => {
        const parsed = Date.parse(buildTimeRaw)
        if (!isNaN(parsed)) {
          // 根據目前語言選擇合適的地區顯示
          if (i18n.language === "zhTW") return new Date(parsed).toLocaleString("zh-TW")
          if (i18n.language === "zhCN") return new Date(parsed).toLocaleString("zh-CN")
          return new Date(parsed).toLocaleString("en-US")
        }
        return buildTimeRaw
      })()
    : null

  const navs = [
    { to: "/", label: t("navigation.mhwSearch"), icon: Calculator },
    { to: "/skill-groups", label: t("navigation.skillGroups"), icon: Grid3x3 },
    { to: "/charm-types", label: t("navigation.charmTypes"), icon: Diamond },
    { to: "/favorites", label: t("navigation.favorites", "收藏護石"), icon: Star },
    { to: "/info", label: t("navigation.info"), icon: Info },
  ]

  return (
    <>
      {/* 移動端遮罩 */}
      {isOpen && <div className='fixed inset-0 z-20 bg-black bg-opacity-50 xl:hidden' onClick={onToggle} />}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-30 flex flex-col w-64 h-screen text-yellow-100 shadow-2xl 
        bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
        border-r border-yellow-600/30
        transition-transform duration-300 ease-in-out
        xl:translate-x-0 xl:z-20
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
            <span className='text-xl font-bold tracking-wider text-yellow-400 drop-shadow-lg'>MH Wilds Charm</span>
            <span className='text-sm font-medium tracking-widest text-yellow-300/80'>ODDS CALCULATOR</span>
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
                  if (window.innerWidth < 1280) {
                    onToggle()
                  }
                }}>
                <div
                  className={`absolute inset-0 rounded-lg transition-opacity ${
                    isActive ? "bg-gradient-to-r from-yellow-500/10 to-yellow-400/10" : ""
                  }`}
                />
                <span className='relative z-10 flex items-center'>
                  <nav.icon className={`flex-shrink-0 w-5 h-5 mr-3 ${isActive ? "text-yellow-400" : "text-yellow-100/70"}`} />
                  {nav.label}
                </span>
              </Link>
            )
          })}
        </nav>
        {/* 語言選擇器 */}
        <div className='px-4 py-4 border-t border-yellow-500/20 bg-black/20 backdrop-blur-sm'>
          <label className='block mb-3 text-sm font-semibold tracking-wide text-yellow-300'>
            {i18n.language && i18n.language.startsWith("zh") ? "語言 / Language" : t("navigation.languageLabel")}
          </label>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className='w-full p-3 text-sm text-yellow-200 transition-colors border rounded-lg shadow-inner cursor-pointer bg-gray-800/80 border-yellow-600/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 hover:bg-gray-700/80'>
            <option value='zhTW' className='bg-gray-800'>
              繁體中文
            </option>
            <option value='zhCN' className='bg-gray-800'>
              简体中文
            </option>
            <option value='enUS' className='bg-gray-800'>
              English
            </option>
            <option value='jaJP' className='bg-gray-800'>
              日本語
            </option>
          </select>
        </div>

        {/* 版本資訊區域 */}
        <div className='px-4 py-2 text-xs border-t text-yellow-400/60 border-yellow-500/20 bg-black/20 backdrop-blur-sm'>
          <div className='space-y-1 text-center'>
            <div className='text-yellow-400/60'>{t("version.logic")} 2.1</div>
            <div className='text-yellow-400/60'>{t("version.data")} 2025.08.20</div>
            <div className='text-yellow-400/60'>
              {buildLabel}: {buildTime ?? unknownLabel}
            </div>
          </div>
        </div>

        <div className='p-4 text-xs border-t text-yellow-400/70 border-yellow-500/20 bg-black/30 backdrop-blur-sm'>
          <div className='text-center'>
            <a
              href='https://github.com/ni-null/MHWilds-Charm-Odds-Calculator'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 font-medium text-yellow-300 transition-colors hover:text-yellow-400'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='inline-block text-yellow-400 align-middle'>
                <path d='M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.048.138 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.654 1.653.243 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.804 5.624-5.475 5.921.43.372.813 1.104.813 2.225 0 1.606-.015 2.898-.015 3.293 0 .32.216.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z' />
              </svg>
              MHWilds-Charm-Odds-Calculator
            </a>
            <div className='text-yellow-500/60'>Built by Ninull</div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
