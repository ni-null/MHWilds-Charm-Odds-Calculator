import React from "react"
import Sidebar from "./components/Sidebar"
import { Link } from "react-router-dom"

const Home = () => {
  return (
    <div className='flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Sidebar />
      <main className='flex flex-col items-center justify-center flex-1 p-12 ml-64'>
        <h1 className='mb-6 text-5xl font-bold text-slate-800'> SPDX TEST Dashboard</h1>
      </main>
    </div>
  )
}

export default Home
