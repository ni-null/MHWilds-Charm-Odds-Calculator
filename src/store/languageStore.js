import { create } from "zustand"
import { persist } from "zustand/middleware"

// 語言狀態管理
const useLanguageStore = create(
  persist(
    (set) => ({
      lang: "enUS", // 預設語言為英文
      setLang: (lang) => set({ lang }),
    }),
    {
      name: "mhwilds-language", // localStorage 中的 key 名稱
      getStorage: () => localStorage, // 使用 localStorage 持久化
    }
  )
)

export default useLanguageStore
