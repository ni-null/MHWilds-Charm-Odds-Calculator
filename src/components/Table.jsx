const Table = ({ currentData, handleSort, sortConfig, currentPage, setCurrentPage, itemsPerPage, setItemsPerPage, totalPages, sortedData }) => (
  <div className='overflow-hidden border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-slate-200/60 shadow-slate-200/20'>
    {/* 上方控制列：左側顯示範圍，右側分頁與每頁顯示數量 */}
    <div className='flex flex-col gap-2 px-6 py-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 md:flex-row md:items-center md:justify-between'>
      <span className='text-sm text-slate-600'>
        顯示 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} 項， 共 {sortedData.length} 項
      </span>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-end'>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className='p-2 transition-colors rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
          </button>
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1
            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-white hover:text-slate-800"
                  }`}>
                  {page}
                </button>
              )
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <span key={page} className='px-2 text-slate-400'>
                  ...
                </span>
              )
            }
            return null
          })}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className='p-2 transition-colors rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </button>
        </div>
        <label className='flex items-center gap-2 ml-4 text-sm text-slate-700'>
          每頁顯示
          <select
            className='px-2 py-1 text-sm bg-white border rounded text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400'
            value={itemsPerPage}
            onChange={(e) => {
              const value = e.target.value === "all" ? sortedData.length : Number(e.target.value)
              setItemsPerPage(value)
              setCurrentPage(1) // 切換顯示數量時自動跳到第1頁
            }}>
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value='all'>所有</option>
          </select>
          筆
        </label>
      </div>
    </div>
    <div className='overflow-x-auto'>
      <table className='w-full'>
        <thead className='border-b bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'>
          <tr>
            {[
              { key: "name", label: "軟體包名稱" },
              { key: "version", label: "版本" },
              { key: "license", label: "授權類型" },
              { key: "supplierCopyright", label: "供應商與版權" },
            ].map((column) => (
              <th
                key={column.key}
                className={`px-6 py-4 text-left text-sm font-semibold text-slate-700 ${
                  column.key !== "actions" ? "cursor-pointer hover:bg-slate-100 transition-colors" : ""
                }`}
                onClick={() => column.key !== "actions" && handleSort(column.key)}>
                <div className='flex items-center gap-2'>
                  {column.label}
                  {sortConfig.key === column.key && <span className='text-blue-600'>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-100'>
          {currentData.map((row) => (
            <tr key={row.id} className='transition-colors hover:bg-slate-50/50 group'>
              <td className='px-6 py-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center justify-center w-10 h-10 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-blue-500 to-indigo-500'>
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <a
                      href={row.downloadLocation}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block font-medium text-slate-800 hover:underline max-w-[16rem] truncate'
                      title={row.downloadLocation}>
                      {row.name}
                      <span className='block mt-1 text-xs font-normal text-slate-500'>
                        {row.downloadLocation.length > 50 ? `${row.downloadLocation.substring(0, 50)}...` : row.downloadLocation}
                      </span>
                    </a>
                  </div>
                </div>
              </td>
              <td className='px-6 py-4 max-w-[8rem]'>
                <span className='block px-2 py-1 font-mono text-sm truncate rounded bg-slate-100'>{row.version}</span>
              </td>
              <td className='px-6 py-4'>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLicenseStyle(row.license)}`}>
                  {row.license}
                </span>
              </td>
              <td className='px-6 py-4 text-slate-600 max-w-64'>
                <div className='font-medium truncate' title={row.supplier}>
                  {row.supplier}
                </div>
                <div className='mt-1 text-xs truncate text-slate-500' title={row.copyrightText}>
                  {row.copyrightText}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// 授權類型顏色對照表
const LICENSE_COLOR_MAP = [
  { keyword: "MIT", style: "bg-green-100 text-green-700" },
  { keyword: "ISC", style: "bg-green-100 text-green-700" },
  { keyword: "Apache", style: "bg-blue-100 text-blue-700" },
  { keyword: "BSD", style: "bg-yellow-100 text-yellow-700" },
  { keyword: "GPL", style: "bg-red-100 text-red-700" },
  { keyword: "LGPL", style: "bg-red-100 text-red-700" },
  { keyword: "AGPL", style: "bg-red-100 text-red-700" },
  { keyword: "MPL", style: "bg-purple-100 text-purple-700" },
  { keyword: "Unlicense", style: "bg-gray-100 text-gray-700" },
  { keyword: "Public Domain", style: "bg-gray-100 text-gray-700" },
]

// 根據授權名稱自動匹配顏色
function getLicenseStyle(license) {
  if (!license) return "bg-slate-100 text-slate-700"
  const found = LICENSE_COLOR_MAP.find(({ keyword }) => license.toLowerCase().includes(keyword.toLowerCase()))
  return found ? found.style : "bg-slate-100 text-slate-700"
}

export default Table
