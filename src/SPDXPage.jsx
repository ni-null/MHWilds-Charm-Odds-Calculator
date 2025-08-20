import React from "react"
import Sidebar from "./components/Sidebar"
import SampleSPDX from "./sampleSPDX"

const SPDXPage = () => {
  return (
    <div className='flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Sidebar />
      <main className='flex-1 ml-64'>
        <SampleSPDX />
      </main>
    </div>
  )
}

export default SPDXPage
