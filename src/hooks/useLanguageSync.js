import { useTranslation } from "react-i18next"

// Hook 用於獲取當前語言，現在直接使用 i18n 的語言狀態
export const useLanguageSync = () => {
  const { i18n } = useTranslation()

  return {
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage,
  }
}
