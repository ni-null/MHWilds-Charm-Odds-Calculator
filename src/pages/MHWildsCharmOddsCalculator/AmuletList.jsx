import React from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import AmuletMainContent from "./components/AmuletMainContent"
import useMhwStore from "../../store/mhwStore"
import AmuletDetails from "./components/AmuletDetails"

export default function AmuletList() {
  const { AvlCharms } = useMhwStore()

  const charms = Array.isArray(AvlCharms) ? AvlCharms : []

  const SKILL_PLACEHOLDER_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'>" +
        "<rect fill='%23efefef' width='100%' height='100%'/>" +
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23999'>?" +
        "</text></svg>"
    )

  const { t } = useTranslation()

  // 動畫變體設定
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // 每個子元素延遲 0.1 秒
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }

  function AmuletListView() {
    return (
      <div>
        <div className=''>
          <motion.ul variants={containerVariants} initial='hidden' whileInView='visible' viewport={{ once: false, margin: "100px" }}>
            {charms.map((charm, idx) => {
              const key = `${charm.rarity || "unknown"}-${idx}`

              return (
                <React.Fragment key={key}>
                  <motion.li
                    variants={itemVariants}
                    initial='hidden'
                    whileInView='visible'
                    exit='hidden'
                    viewport={{ once: false, margin: "50px" }}
                    className='flex flex-col bg-[#251d12] px-3 sm:px-4 md:px-6 my-10 text-white rounded-lg items-start justify-between gap-4 py-4 border-b xl:flex-row md:items-center md:gap-6'>
                    <div className='flex-1 w-full'>
                      <AmuletMainContent charm={charm} t={t} SKILL_PLACEHOLDER_SVG={SKILL_PLACEHOLDER_SVG} />
                    </div>

                    <AmuletDetails charm={charm} t={t} />
                  </motion.li>
                </React.Fragment>
              )
            })}
          </motion.ul>
        </div>
      </div>
    )
  }

  if (!charms || charms.length === 0) return null

  return <AmuletListView />
}
