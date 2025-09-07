import React from "react"
import RarityData from "../../../data/Rarity.json"
import { decimalToFraction } from "../../../lib/fractionUtils"

export default function SlotList({ charm, t }) {
  return (
    <div className='flex flex-col w-full gap-2 mx-auto mt-5 md:w-auto'>
      {Array.isArray(charm.AllslotKey) && charm.AllslotKey.length > 0 ? (
        charm.AllslotKey.map((slotKey, si) => {
          const slotImgSrcs = []
          let display = String(slotKey)

          try {
            const arr = typeof slotKey === "string" ? JSON.parse(slotKey) : slotKey
            if (Array.isArray(arr)) {
              display = `[${arr.join(", ")}]`
              arr.forEach((v) => {
                if (typeof v === "string" && v.startsWith("W")) slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
                else if (typeof v === "number") slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${Math.min(Math.max(1, v), 3)}.png`)
              })
            }
          } catch {
            if (typeof slotKey === "string" && slotKey.includes("W")) slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/W1.png`)
            else if (!isNaN(Number(slotKey)))
              slotImgSrcs.push(`${import.meta.env.BASE_URL}image/slot/${Math.min(Math.max(1, Number(slotKey)), 3)}.png`)
          }

          const getSlotProbability = (rk, groupsArr, sk) => {
            try {
              const rarityObj = (RarityData && RarityData[rk]) || {}
              const rawKey = String(sk)
              let normKeyJson = rawKey
              let normKeyNoSpace = rawKey.replace(/\s+/g, "")
              try {
                const parsed = typeof sk === "string" ? JSON.parse(sk) : sk
                normKeyJson = JSON.stringify(parsed)
                normKeyNoSpace = normKeyJson.replace(/\s+/g, "")
              } catch {
                return null
              }

              const groups = Array.isArray(rarityObj.Group) ? rarityObj.Group : []
              for (const g of groups) {
                const skills = Array.isArray(g.skills) ? g.skills : []
                if (skills.length === groupsArr.length && skills.every((v, i) => Number(v) === Number(groupsArr[i])) && g.slot) {
                  const keysToTry = [normKeyJson, normKeyNoSpace, rawKey]
                  for (const kk of keysToTry) if (g.slot[kk] != null) return Number(g.slot[kk]) || 0
                }
              }

              let normals = rarityObj.normalslot?.slot || {}
              const keysToTry = [normKeyJson, normKeyNoSpace, rawKey]
              for (const kk of keysToTry) if (normals[kk] != null) return Number(normals[kk]) || 0

              return null
            } catch {
              return null
            }
          }

          const slotProb = getSlotProbability(charm.rarity, charm.groups, slotKey)

          return (
            <div key={si} className='flex items-center gap-2'>
              {slotImgSrcs.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  loading='lazy'
                  alt='slot'
                  className='object-contain w-8 h-8'
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ))}
              <span className='text-sm text-gray-200'>{display}</span>
              <span className='text-sm text-gray-400'>({(slotProb * 100).toFixed(0)}%)</span>
              {slotProb != null &&
                (() => {
                  try {
                    const finalNoSlot = Number(charm?.computed?.finalNoSlot || 0)
                    if (finalNoSlot > 0) {
                      const combined = slotProb * finalNoSlot
                      if (combined > 0)
                        return (
                          <span className='text-sm text-gray-300' title={`combined: ${combined}`}>
                            &nbsp;•&nbsp;{decimalToFraction(combined)}
                          </span>
                        )
                    }
                  } catch {
                    return null
                  }
                  return null
                })()}
            </div>
          )
        })
      ) : (
        <span className='ml-2 text-sm text-gray-400'>{t("common.none", "無")}</span>
      )}
    </div>
  )
}
