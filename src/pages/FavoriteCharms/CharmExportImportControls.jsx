import React, { useState } from "react"
import { Download, Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import useMhwStore from "../../store/mhwStore"

/**
 * 匯出 favoriteCharms 為 JSON 檔案
 * @param {Array} favoriteCharms - 要匯出的收藏護石陣列
 * @returns {Object} 結果物件 { success: boolean, message: string }
 */
function exportFavoriteCharms(favoriteCharms) {
  if (!Array.isArray(favoriteCharms) || favoriteCharms.length === 0) {
    return { success: false, message: "沒有收藏護石可以匯出" }
  }

  try {
    const dataStr = JSON.stringify(favoriteCharms, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `favoriteCharms_${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    return { success: true, message: "收藏護石匯出成功！" }
  } catch (error) {
    return { success: false, message: "匯出失敗: " + error.message }
  }
}

/**
 * 匯入 favoriteCharms 從 JSON 檔案
 * @returns {Promise<Object>} 結果物件 { success: boolean, message: string, data?: Array }
 */
function importFavoriteCharms() {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) {
        resolve({ success: false, message: "沒有選擇檔案" })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          if (!Array.isArray(importedData)) {
            resolve({ success: false, message: "匯入的資料格式不正確" })
            return
          }
          resolve({ success: true, message: "收藏護石匯入成功！", data: importedData })
        } catch (error) {
          resolve({ success: false, message: "解析 JSON 檔案失敗: " + error.message })
        }
      }
      reader.readAsText(file)
    }

    input.click()
  })
}

export default function CharmExportImportControls() {
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
    const result = exportFavoriteCharms(favoriteCharms)
    showDialog(result.success ? "匯出成功" : "匯出失敗", result.message)
  }

  const handleImport = async () => {
    const result = await importFavoriteCharms()
    if (result.success && result.data) {
      setFavoriteCharms(result.data)
    }
    showDialog(result.success ? "匯入成功" : "匯入失敗", result.message)
  }

  const handleClear = () => {
    if (favoriteCharms.length === 0) {
      showDialog("提示", "收藏清單已經是空的了")
      return
    }
    setConfirmDialogOpen(true)
  }

  const confirmClear = () => {
    setFavoriteCharms([])
    setConfirmDialogOpen(false)
    showDialog("清空成功", "已清空所有收藏護石")
  }

  return (
    <>
      <div className='flex gap-4'>
        {favoriteCharms.length > 0 && (
          <Button onClick={handleExport} variant='outline' size='sm' className='flex items-center gap-2'>
            <Download className='w-4 h-4' />
            匯出收藏護石
          </Button>
        )}
        <Button onClick={handleImport} variant='outline' size='sm' className='flex items-center gap-2'>
          <Upload className='w-4 h-4' />
          匯入收藏護石
        </Button>
        {favoriteCharms.length > 0 && (
          <Button
            onClick={handleClear}
            variant='outline'
            size='sm'
            className='flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50'>
            <Trash2 className='w-4 h-4' />
            清空收藏
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
            <Button onClick={() => setDialogOpen(false)}>確定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認清空</DialogTitle>
            <DialogDescription>您確定要清空所有收藏護石嗎？此操作無法復原。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirmDialogOpen(false)}>
              取消
            </Button>
            <Button variant='destructive' onClick={confirmClear}>
              確認清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
