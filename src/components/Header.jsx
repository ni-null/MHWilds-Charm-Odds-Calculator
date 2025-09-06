import React from "react"

const Header = ({ onMenuToggle, title = "MHWilds Calculator" }) => (
  <header className='sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md border-slate-200/60 xl:hidden'>
    <div className='px-4 py-3'>
      <div className='flex items-center justify-between'>
        {/* 左側漢堡按鈕 */}
        <button
          onClick={onMenuToggle}
          className='p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
          aria-label='開啟選單'>
          <svg className='w-6 h-6 text-gray-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
          </svg>
        </button>

        {/* 中間標題 */}
        <h1 className='text-lg font-semibold text-gray-800 truncate'>{title}</h1>

        {/* 右側預留空間 */}
        <div className='w-10'></div>
      </div>
    </div>
  </header>
)

export default Header
