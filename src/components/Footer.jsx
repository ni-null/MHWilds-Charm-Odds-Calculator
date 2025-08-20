import React from "react"

const Footer = () => (
  <footer className='px-6 py-8 mx-auto bg-white border-t border-slate-200/60'>
    <div className='flex flex-col items-center justify-center gap-2 md:flex-row'>
      <p className='text-sm text-slate-500'>© 2025 DataPro Dashboard. 版權所有。</p>
      <span className='hidden md:inline-block text-slate-300'>|</span>
      <p className='text-sm text-slate-500'>Made with by Ninull </p>
    </div>

    <div className='mt-4 text-xs text-center text-slate-400'>
      本網站以 <span className='font-semibold text-blue-600'>Vite + React</span> 建構
    </div>
  </footer>
)

export default Footer
