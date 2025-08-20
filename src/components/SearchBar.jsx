import React from "react"

const SearchBar = ({ searchTerm, setSearchTerm }) => (
  <div className='p-6 mb-6 border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-slate-200/60 shadow-slate-200/20'>
    <div className='flex flex-col gap-4 sm:flex-row'>
      <div className='relative flex-1'>
        <div className='absolute transform -translate-y-1/2 left-3 top-1/2 text-slate-400'>
          {/* SearchIcon 由父層傳入或直接複製 SVG */}
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
          </svg>
        </div>
        <input
          type='text'
          placeholder='搜尋軟體包名稱、版本、授權類型、供應商...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full py-3 pl-10 pr-4 transition-all bg-white border outline-none border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
      </div>
      <button className='flex items-center gap-2 px-6 py-3 transition-colors bg-white border border-slate-200 rounded-xl hover:bg-slate-50'>
        {/* FilterIcon 由父層傳入或直接複製 SVG */}
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
          />
        </svg>
        篩選
      </button>
    </div>
  </div>
)

export default SearchBar
