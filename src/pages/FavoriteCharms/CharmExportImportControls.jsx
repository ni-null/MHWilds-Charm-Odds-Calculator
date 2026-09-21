import React, { useState } from "react"
import { AlertTriangle, Check, Clipboard, Download, ListChecks, ListFilter, Sparkles, Table2, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslation } from "react-i18next"
import useMhwStore from "../../store/mhwStore"
import {
  buildWikiDbExport,
  formatWikiDbSlotKey,
  getSelectableSkillCounts,
  getWikiDbExportSummary,
  getWikiDbSlotKeys,
  MAX_EXPORT_ROWS,
  WIKI_DB_TEXT_WARNING_BYTES,
  WIKI_DB_NO_SLOT,
} from "../../lib/wikiDbCharmExport"

const getSlotSelectionValue = (slotKey) => (slotKey === null || slotKey === undefined ? WIKI_DB_NO_SLOT : String(slotKey))

const formatByteSize = (byteLength) => {
  if (byteLength < 1024) return `${byteLength} B`
  if (byteLength < 1024 * 1024) return `${(byteLength / 1024).toFixed(1)} KB`
  return `${(byteLength / (1024 * 1024)).toFixed(2)} MB`
}

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
  const { t, i18n } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMessage, setDialogMessage] = useState("")
  const [dialogTitle, setDialogTitle] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [wikiDbDialogOpen, setWikiDbDialogOpen] = useState(false)
  const [wikiDbSelectedIndexes, setWikiDbSelectedIndexes] = useState([])
  const [wikiDbSlotSelections, setWikiDbSlotSelections] = useState({})
  const [wikiDbExpandUnspecified, setWikiDbExpandUnspecified] = useState(true)
  const [wikiDbClipboardCopied, setWikiDbClipboardCopied] = useState(false)

  const { favoriteCharms, setFavoriteCharms } = useMhwStore()
  const wikiDbAnySkillCounts = favoriteCharms.map((charm) => getSelectableSkillCounts(charm))
  const wikiDbAnySkillColumnCount = wikiDbAnySkillCounts.reduce((maxCount, counts) => Math.max(maxCount, counts.length), 0)

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

  const openWikiDbExportDialog = () => {
    setWikiDbSelectedIndexes(favoriteCharms.map((_, index) => index))
    setWikiDbSlotSelections(
      Object.fromEntries(
        favoriteCharms.map((charm, index) => [index, getWikiDbSlotKeys(charm).map(getSlotSelectionValue)])
      )
    )
    setWikiDbExpandUnspecified(true)
    setWikiDbClipboardCopied(false)
    setWikiDbDialogOpen(true)
  }

  const toggleWikiDbCharm = (index) => {
    setWikiDbClipboardCopied(false)
    setWikiDbSelectedIndexes((previous) => (previous.includes(index) ? previous.filter((item) => item !== index) : [...previous, index]))
  }

  const toggleAllWikiDbCharms = () => {
    setWikiDbClipboardCopied(false)
    setWikiDbSelectedIndexes((previous) => (previous.length === favoriteCharms.length ? [] : favoriteCharms.map((_, index) => index)))
  }

  const getSelectedWikiDbSlots = (index, slotKeys) => {
    const configured = wikiDbSlotSelections[index]
    return Array.isArray(configured) ? configured : slotKeys.map(getSlotSelectionValue)
  }

  const toggleWikiDbSlot = (index, value, slotKeys) => {
    setWikiDbClipboardCopied(false)
    setWikiDbSlotSelections((previous) => {
      const selectedSlots = Array.isArray(previous[index]) ? previous[index] : slotKeys.map(getSlotSelectionValue)
      const nextSlots = selectedSlots.includes(value) ? selectedSlots.filter((slot) => slot !== value) : [...selectedSlots, value]
      return { ...previous, [index]: nextSlots }
    })
  }

  const toggleAllWikiDbSlotsForCharm = (index, slotKeys) => {
    setWikiDbClipboardCopied(false)
    const allSlotValues = slotKeys.map(getSlotSelectionValue)
    setWikiDbSlotSelections((previous) => {
      const selectedSlots = Array.isArray(previous[index]) ? previous[index] : allSlotValues
      const allSelected = allSlotValues.length > 0 && allSlotValues.every((value) => selectedSlots.includes(value))
      return { ...previous, [index]: allSelected ? [] : allSlotValues }
    })
  }

  const allWikiDbSlotsSelected =
    favoriteCharms.length > 0 &&
    favoriteCharms.every((charm, index) => {
      const slotKeys = getWikiDbSlotKeys(charm)
      const selectedSlots = getSelectedWikiDbSlots(index, slotKeys)
      const slotValues = slotKeys.map(getSlotSelectionValue)
      return slotValues.length > 0 && slotValues.every((value) => selectedSlots.includes(value))
    })

  const toggleAllWikiDbSlots = () => {
    setWikiDbClipboardCopied(false)
    const shouldSelectAll = !allWikiDbSlotsSelected
    setWikiDbSlotSelections(
      Object.fromEntries(
        favoriteCharms.map((charm, index) => [
          index,
          shouldSelectAll ? getWikiDbSlotKeys(charm).map(getSlotSelectionValue) : [],
        ])
      )
    )
  }

  const selectedWikiDbEntries = wikiDbSelectedIndexes
    .map((index) => ({ charm: favoriteCharms[index], index }))
    .filter((entry) => entry.charm)
  const selectedWikiDbCharms = selectedWikiDbEntries.map((entry) => entry.charm)
  const selectedWikiDbSlotSelections = selectedWikiDbEntries.map(
    (entry) => wikiDbSlotSelections[entry.index] || getWikiDbSlotKeys(entry.charm).map(getSlotSelectionValue)
  )
  const wikiDbExportSummary =
    wikiDbDialogOpen && selectedWikiDbCharms.length > 0
      ? getWikiDbExportSummary(selectedWikiDbCharms, {
          expandUnspecifiedSkills: wikiDbExpandUnspecified,
          maxRows: MAX_EXPORT_ROWS,
          slotSelections: selectedWikiDbSlotSelections,
          locale: i18n.language,
        })
      : { rowCount: 0, textByteLength: 0, truncated: false }

  const createWikiDbExport = () => {
    if (selectedWikiDbCharms.length === 0) {
      showDialog(t("charmExportImport.wikiDbExportFailedTitle", "匯出失敗"), t("charmExportImport.wikiDbNoSelection", "請至少選擇一個收藏護石"))
      return null
    }

    try {
      const result = buildWikiDbExport(selectedWikiDbCharms, {
        expandUnspecifiedSkills: wikiDbExpandUnspecified,
        maxRows: MAX_EXPORT_ROWS,
        slotSelections: selectedWikiDbSlotSelections,
        locale: i18n.language,
      })

      if (!result.text) {
        showDialog(t("charmExportImport.wikiDbExportFailedTitle", "匯出失敗"), t("charmExportImport.wikiDbNoData", "沒有可匯出的資料"))
        return null
      }

      return result
    } catch (error) {
      const message = error instanceof RangeError
        ? t("charmExportImport.wikiDbExportTooLarge", "資料量過大，可能超過瀏覽器或 wiki-db 的匯入限制，請減少選取的護石、槽位或關閉技能展開。")
        : `${t("charmExportImport.wikiDbExportFailed", "wiki-db 匯出失敗")}: ${error.message}`
      showDialog(t("charmExportImport.wikiDbExportFailedTitle", "匯出失敗"), message)
      return null
    }
  }

  const showWikiDbExportSuccess = (result) => {
    const truncatedMessage = result.truncated
      ? ` ${t("charmExportImport.wikiDbExportTruncated", "已達匯出上限 {{count}} 筆", { count: MAX_EXPORT_ROWS })}`
      : ""
    showDialog(
      t("charmExportImport.wikiDbExportSuccessTitle", "wiki-db 匯出成功"),
      t("charmExportImport.wikiDbExportSuccess", "已匯出 {{count}} 筆資料。", { count: result.rowCount }) + truncatedMessage
    )
  }

  const handleWikiDbDownload = () => {
    const result = createWikiDbExport()
    if (!result) return

    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" })
    const dataUrl = URL.createObjectURL(blob)
    const linkElement = document.createElement("a")
    linkElement.href = dataUrl
    linkElement.download = `favoriteCharms_wiki-db_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(linkElement)
    linkElement.click()
    linkElement.remove()
    URL.revokeObjectURL(dataUrl)

    setWikiDbDialogOpen(false)
    showWikiDbExportSuccess(result)
  }

  const handleWikiDbCopy = async () => {
    const result = createWikiDbExport()
    if (!result) return

    try {
      if (!navigator.clipboard?.writeText) throw new Error("目前瀏覽器不支援剪貼簿功能")
      await navigator.clipboard.writeText(result.text)
      setWikiDbClipboardCopied(true)
    } catch (error) {
      showDialog(t("charmExportImport.wikiDbExportFailedTitle", "匯出失敗"), `${t("charmExportImport.wikiDbCopyFailed", "複製到剪貼簿失敗")}: ${error.message}`)
    }
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
        {favoriteCharms.length > 0 && (
          <Button onClick={openWikiDbExportDialog} variant='outline' size='sm' className='flex items-center gap-2'>
            <Download className='w-4 h-4' />
            {t("charmExportImport.wikiDbExportButton", "匯出 wiki-db")}
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

      <Dialog open={wikiDbDialogOpen} onOpenChange={setWikiDbDialogOpen}>
        <DialogContent className='w-[calc(100%-2rem)] max-w-6xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Table2 className='w-5 h-5' />
              {t("charmExportImport.wikiDbExportTitle", "匯出 wiki-db 格式")}
            </DialogTitle>
            <DialogDescription>
              {t("charmExportImport.wikiDbExportDescription", "將護石資料匯出為 wiki-db 可匯入的格式，請確認選取的護石、技能展開與槽位設定。匯出資料中的技能名稱會依目前語言顯示。")}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>

            <div className='overflow-x-auto border rounded-md'>
              <table className='w-full text-sm text-left'>
                <thead className='text-xs text-gray-700 uppercase bg-gray-100'>
                  <tr>
                    <th scope='col' className='w-12 px-3 py-3'>
                      <Checkbox
                        checked={wikiDbSelectedIndexes.length === favoriteCharms.length && favoriteCharms.length > 0}
                        onCheckedChange={toggleAllWikiDbCharms}
                        aria-label={t("charmExportImport.wikiDbSelectAll", "全選收藏護石")}
                      />
                    </th>
                    <th scope='col' className='px-3 py-3 whitespace-nowrap'>{t("charmExportImport.wikiDbRarityColumn", "稀有度")}</th>
                    <th scope='col' className='min-w-[20rem] px-3 py-3'>{t("charmExportImport.wikiDbSkillsColumn", "技能")}</th>
                    {Array.from({ length: wikiDbAnySkillColumnCount }, (_, anySkillIndex) => (
                      <th key={`any-skill-${anySkillIndex}`} scope='col' className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center gap-1'>
                          <Sparkles className='w-4 h-4' />
                          {t("charmExportImport.wikiDbAnySkillColumn", "任意技能 {{index}}", { index: anySkillIndex + 1 })}
                        </span>
                      </th>
                    ))}
                    <th scope='col' className='min-w-[18rem] px-3 py-3'>
                      <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                        <div className='inline-flex items-center gap-1.5 whitespace-nowrap'>
                          <Checkbox
                            id='wiki-db-select-all-slots'
                            checked={allWikiDbSlotsSelected}
                            onCheckedChange={toggleAllWikiDbSlots}
                            aria-label={t("charmExportImport.wikiDbSelectAllSlots", "全選全部槽位")}
                          />
                          <label htmlFor='wiki-db-select-all-slots'>{t("charmExportImport.wikiDbSelectAllSlots", "全選")}</label>
                        </div>
                        <span className='inline-flex items-center gap-1 whitespace-nowrap'>
                          <ListFilter className='w-4 h-4' />
                          {t("charmExportImport.wikiDbSlotsColumn", "槽位選擇")}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
              {favoriteCharms.map((charm, index) => {
                const selectedSkillKeys = Array.isArray(charm.matchingSkills) ? charm.matchingSkills.filter(Boolean) : []
                const selectableSkillCounts = wikiDbAnySkillCounts[index]
                const slotKeys = getWikiDbSlotKeys(charm)
                const selectedSlots = getSelectedWikiDbSlots(index, slotKeys)
                const slotValues = slotKeys.map(getSlotSelectionValue)
                const allSlotsSelected = slotValues.length > 0 && slotValues.every((value) => selectedSlots.includes(value))

                return (
                  <tr key={`${charm.rarity || "unknown"}-${index}`} className='border-t hover:bg-gray-50'>
                    <td className='px-3 py-3 align-top'>
                      <Checkbox
                        aria-label={`選取 ${charm.rarity || "Unknown"}`}
                        checked={wikiDbSelectedIndexes.includes(index)}
                        onCheckedChange={() => toggleWikiDbCharm(index)}
                        className='mt-1'
                      />
                    </td>
                    <td className='px-3 py-3 font-medium align-top whitespace-nowrap'>
                      <div className='flex items-center gap-2'>
                        <img
                          src={`${import.meta.env.BASE_URL}image/charms/${encodeURIComponent(charm.rarity || "unknown")}.png`}
                          alt={charm.rarity || "Unknown"}
                          loading='lazy'
                          className='object-contain w-8 h-8 rounded'
                          onError={(event) => {
                            event.currentTarget.style.display = "none"
                          }}
                        />
                        <span>{charm.rarity || "Unknown"}</span>
                      </div>
                    </td>
                    <td className='max-w-xl px-3 py-3 text-gray-600 break-words align-top'>
                      {selectedSkillKeys.length > 0 ? (
                        <div className='flex flex-wrap gap-2'>
                          {selectedSkillKeys.map((skillKey, skillIndex) => {
                            const skillName = String(skillKey).split(" Lv.")[0]
                            const skillImageName = skillName.replace(/\//g, "-")
                            const translatedSkillName = t(`skillTranslations.${skillName}`, skillName)
                            const skillLevel = String(skillKey).slice(skillName.length)

                            return (
                              <span key={`${skillKey}-${skillIndex}`} className='inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md'>
                                <img
                                  src={`${import.meta.env.BASE_URL}image/skills/${encodeURIComponent(skillImageName)}.png`}
                                  alt={skillName}
                                  loading='lazy'
                                  className='object-contain w-5 h-5'
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none"
                                  }}
                                />
                                <span>{translatedSkillName}{skillLevel}</span>
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <span className='text-gray-500'>未指定技能</span>
                      )}
                    </td>
                    {Array.from({ length: wikiDbAnySkillColumnCount }, (_, anySkillIndex) => (
                      <td key={`any-skill-${anySkillIndex}`} className='px-3 py-3 text-gray-600 align-top whitespace-nowrap'>
                        {selectableSkillCounts[anySkillIndex] ?? "—"}
                      </td>
                    ))}
                    <td className='px-3 py-3 align-top'>
                      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
                        <div className='inline-flex items-center gap-1.5 whitespace-nowrap'>
                          <Checkbox
                            id={`wiki-db-charm-${index}-all-slots`}
                            checked={allSlotsSelected}
                            onCheckedChange={() => toggleAllWikiDbSlotsForCharm(index, slotKeys)}
                            aria-label={`全選 ${charm.rarity || "Unknown"} 的槽位`}
                          />
                          <label htmlFor={`wiki-db-charm-${index}-all-slots`}>{t("charmExportImport.wikiDbSelectAllSlots", "全選")}</label>
                        </div>
                        {slotKeys.map((slotKey, slotIndex) => {
                          const value = getSlotSelectionValue(slotKey)
                          return (
                            <div key={`${value}-${slotIndex}`} className='inline-flex items-center gap-1.5 whitespace-nowrap'>
                              <Checkbox
                                id={`wiki-db-charm-${index}-slot-${slotIndex}`}
                                checked={selectedSlots.includes(value)}
                                onCheckedChange={() => toggleWikiDbSlot(index, value, slotKeys)}
                                aria-label={`選擇 ${charm.rarity || "Unknown"} ${formatWikiDbSlotKey(slotKey)}`}
                              />
                              <label htmlFor={`wiki-db-charm-${index}-slot-${slotIndex}`}>{formatWikiDbSlotKey(slotKey)}</label>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
                </tbody>
              </table>
            </div>

            <div className='flex items-start gap-2 p-3 text-sm border rounded-md'>
              <Checkbox
                id='wiki-db-expand-unspecified'
                checked={wikiDbExpandUnspecified}
                onCheckedChange={(checked) => {
                  setWikiDbClipboardCopied(false)
                  setWikiDbExpandUnspecified(Boolean(checked))
                }}
                className='mt-0.5'
              />
              <label htmlFor='wiki-db-expand-unspecified'>
                <span className='block font-medium'>{t("charmExportImport.wikiDbExpandUnspecified", "展開未指定技能")}</span>
                <span className='block text-gray-600'>
                  {t("charmExportImport.wikiDbExpandUnspecifiedDescription", "關閉時，未指定的技能欄位會以空白匯出；開啟時會產生所有可能組合。")}
                </span>
              </label>
            </div>

            <div className='p-3 space-y-2 text-sm border rounded-md bg-gray-50'>
              <div className='flex flex-wrap items-center gap-2 text-gray-700'>
                <ListChecks className='w-4 h-4' />
                <span>
                  {t("charmExportImport.wikiDbCurrentExportCount", "目前勾選 {{count}} 筆護石，預計匯出 {{exportCount}} 筆資料。", {
                    count: selectedWikiDbCharms.length,
                    exportCount: `${wikiDbExportSummary.rowCount.toLocaleString()}${wikiDbExportSummary.truncated ? "+" : ""}`,
                  })}
                </span>
                <span className='text-gray-500'>
                  {t("charmExportImport.wikiDbEstimatedTextSize", "預估文字大小：{{size}}", {
                    size: formatByteSize(wikiDbExportSummary.textByteLength),
                  })}
                </span>
              </div>
              {(wikiDbExportSummary.truncated || wikiDbExportSummary.textByteLength >= WIKI_DB_TEXT_WARNING_BYTES) && (
                <div className='flex items-start gap-2 text-orange-800'>
                  <AlertTriangle className='flex-shrink-0 w-4 h-4 mt-0.5' />
                  <span>
                    {t(
                      "charmExportImport.wikiDbTextSizeWarning",
                      "預估文字大小已達 {{size}} ，wiki-db 上限大概位於120kb，需要進行分批匯入。",
                      { size: formatByteSize(wikiDbExportSummary.textByteLength) }
                    )}
                  </span>
                </div>
              )}
              {wikiDbClipboardCopied && (
                <div className='flex items-center gap-2 text-green-700'>
                  <Check className='w-4 h-4' />
                  {t("charmExportImport.wikiDbCopied", "已複製到剪貼簿")}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setWikiDbDialogOpen(false)}>
              {t("charmExportImport.cancelButton", "取消")}
            </Button>
            <Button
              variant='outline'
              onClick={handleWikiDbCopy}
              disabled={wikiDbSelectedIndexes.length === 0 || wikiDbExportSummary.rowCount === 0}
              className='flex items-center gap-2'>
              {wikiDbClipboardCopied ? <Check className='w-4 h-4 text-green-600' /> : <Clipboard className='w-4 h-4' />}
              {wikiDbClipboardCopied ? t("charmExportImport.wikiDbCopied", "已複製") : t("charmExportImport.wikiDbCopyButton", "匯出到剪貼簿")}
            </Button>
            <Button
              onClick={handleWikiDbDownload}
              disabled={wikiDbSelectedIndexes.length === 0 || wikiDbExportSummary.rowCount === 0}
              className='flex items-center gap-2'>
              <Download className='w-4 h-4' />
              {t("charmExportImport.wikiDbDownloadButton", "匯出下載")}
            </Button>
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
