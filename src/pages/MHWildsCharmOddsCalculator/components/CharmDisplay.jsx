import React from "react"
import clsx from "clsx"
import SkillGroupsData from "../../../data/SkillGroups.json"
import { Ban } from "lucide-react"

export default function CharmDisplay({ charm, groups, t, mode }) {
  return (
    <div className='flex flex-col'>
      <div className='flex flex-col items-center justify-center'>
        <img
          src={`${import.meta.env.BASE_URL}image/Charm/${encodeURIComponent(charm.rarity || "unknown")}.png`}
          alt={charm.rarity}
          style={{ width: 56, height: 56, objectFit: "contain" }}
          className='rounded'
          loading='lazy'
          onError={(e) => {
            try {
              if (!e || !e.currentTarget) return
              e.currentTarget.style.display = "none"
            } catch (err) {
              console.debug("img onError hide failed", err)
            }
          }}
        />
        <div className='text-base font-medium md:mt-1'>{charm.rarity}</div>
      </div>

      <div className={clsx("flex gap-1 w-28", mode !== "simple" && "md:gap-2 md:mt-3 md:w-52")}>
        {groups.map((g, i) => {
          const groupKey = `Group${g}`
          const gd = (SkillGroupsData.SkillGroups && SkillGroupsData.SkillGroups[groupKey]) || {}
          const bg = gd.bgColor || "#374151"
          const text = gd.color || "#ffffff"

          const hexToRgba = (hex, alpha) => {
            let cleanHex = hex.replace("#", "")
            if (cleanHex.length === 3) {
              cleanHex = cleanHex
                .split("")
                .map((c) => c + c)
                .join("")
            }
            const r = parseInt(cleanHex.slice(0, 2), 16)
            const g = parseInt(cleanHex.slice(2, 4), 16)
            const b = parseInt(cleanHex.slice(4, 6), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
          }

          return (
            <div
              key={i}
              className='inline-flex items-center justify-center w-16 gap-1 px-1 py-1 text-sm text-center rounded'
              style={{ backgroundColor: hexToRgba(text, 0.5), color: bg }}>
              {mode !== "simple" && <span className='hidden font-semibold md:block'>{t("amulet.group", "群組")}</span>}
              <span>{g}</span>
            </div>
          )
        })}

        {groups.length < 3 && (
          <div className='inline-flex bg-[#2f2f2f] items-center justify-center w-16 gap-1 px-1 py-1 text-sm text-center rounded'>
            <Ban className='w-4 h-4' />
          </div>
        )}
      </div>
    </div>
  )
}
