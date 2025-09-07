import React, { useState } from "react"
import { Download, Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslation } from "react-i18next"
import useMhwStore from "../../store/mhwStore"

/**
 * 匯出 favoriteCharms 為 JSON 檔案
 * @param {Array} favoriteCharms - 要匯出的收藏護石陣列
 * @returns {Object} 結果物件 { success: boolean, message: string }
 */
function exportFavoriteCharms(favoriteCharms, t) {
  if (!Array.isArray(favoriteCharms) || favoriteCharms.length === 0) {
    return { success: false, message: t("charmExportImport.noFavoritesToExport", "沒有收藏護石可以匯出") }
  }

  try {
    const dataStr = JSON.stringify(favoriteCharms, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `favoriteCharms_${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    return { success: true, message: t("charmExportImport.exportSuccess", "收藏護石匯出成功！") }
  } catch (error) {
    return { success: false, message: t("charmExportImport.exportFailed", "匯出失敗") + ": " + error.message }
  }
}

/**
 * 匯入 favoriteCharms 從 JSON 檔案
 * @returns {Promise<Object>} 結果物件 { success: boolean, message: string, data?: Array }
 */
function importFavoriteCharms(t) {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) {
        resolve({ success: false, message: t("charmExportImport.noFileSelected", "沒有選擇檔案") })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          if (!Array.isArray(importedData)) {
            resolve({ success: false, message: t("charmExportImport.invalidFormat", "匯入的資料格式不正確") })
            return
          }
          resolve({ success: true, message: t("charmExportImport.importSuccess", "收藏護石匯入成功！"), data: importedData })
        } catch (error) {
          resolve({ success: false, message: t("charmExportImport.parseError", "解析 JSON 檔案失敗") + ": " + error.message })
        }
      }
      reader.readAsText(file)
    }

    input.click()
  })
}

export default function CharmExportImportControls() {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMessage, setDialogMessage] = useState("")
  const [dialogTitle, setDialogTitle] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const { favoriteCharms, setFavoriteCharms } = useMhwStore()

  const showDialog = (title, message) => {
    setDialogTitle(title)
    setDialogMessage(message)
    setDialogOpen(true)
  }

  const handleExport = () => {
    const result = exportFavoriteCharms(favoriteCharms, t)
    showDialog(
      result.success ? t("charmExportImport.exportSuccessTitle", "匯出成功") : t("charmExportImport.exportFailedTitle", "匯出失敗"),
      result.message
    )
  }

  const handleImport = async () => {
    const result = await importFavoriteCharms(t)
    if (result.success && result.data) {
      setFavoriteCharms(result.data)
    }
    showDialog(
      result.success ? t("charmExportImport.importSuccessTitle", "匯入成功") : t("charmExportImport.importFailedTitle", "匯入失敗"),
      result.message
    )
  }

  const handleClear = () => {
    if (favoriteCharms.length === 0) {
      showDialog(t("charmExportImport.hint", "提示"), t("charmExportImport.alreadyEmpty", "收藏清單已經是空的了"))
      return
    }
    setConfirmDialogOpen(true)
  }

  const confirmClear = () => {
    setFavoriteCharms([])
    setConfirmDialogOpen(false)
    showDialog(t("charmExportImport.clearSuccess", "清空成功"), t("charmExportImport.clearMessage", "已清空所有收藏護石"))
  }

  return (
    <>
      <div className='flex gap-4'>
        {favoriteCharms.length > 0 && (
          <Button onClick={handleExport} variant='outline' size='sm' className='flex items-center gap-2'>
            <Download className='w-4 h-4' />
            {t("charmExportImport.exportButton", "匯出收藏")}
          </Button>
        )}
        <Button onClick={handleImport} variant='outline' size='sm' className='flex items-center gap-2'>
          <Upload className='w-4 h-4' />
          {t("charmExportImport.importButton", "匯入收藏護石")}
        </Button>
        {favoriteCharms.length > 0 && (
          <Button
            onClick={handleClear}
            variant='outline'
            size='sm'
            className='flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50'>
            <Trash2 className='w-4 h-4' />
            {t("charmExportImport.clearButton", "清空收藏")}
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>{t("charmExportImport.okButton", "確定")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("charmExportImport.clearDialogTitle", "確認清空")}</DialogTitle>
            <DialogDescription>{t("charmExportImport.clearDialogDescription", "您確定要清空所有收藏護石嗎？此操作無法復原。")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirmDialogOpen(false)}>
              {t("charmExportImport.cancelButton", "取消")}
            </Button>
            <Button variant='destructive' onClick={confirmClear}>
              {t("charmExportImport.confirmClearButton", "確認清空")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
