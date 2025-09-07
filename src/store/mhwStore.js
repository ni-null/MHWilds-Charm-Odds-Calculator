import { create } from "zustand"
import { persist } from "zustand/middleware"
import { computeCharmProb } from "../lib/amuletProb"
import rarityBaseProbability from "../data/Rarity.json"

const useMhwStore = create(
  persist(
    (set, get) => ({
      // selectedSkills is now an array-of-arrays: each slot holds zero or more chosen skill keys
      selectedSkills: [[], [], []],
      setSelectedSkills: (skills) => {
        set({ selectedSkills: skills })
      },

      // selectedSlot stores the raw slot key string from Rarity.json (e.g. "[1, 1]")
      selectedSlot: "",
      setSelectedSlot: (slotKey) => {
        set({ selectedSlot: slotKey })
      },

      /**
       * AvlCharms: aggregated available charm (amulet) matches computed from data
       */
      AvlCharms: [],
      setAvlCharms: (charms) => {
        try {
          const selectedSkills = get().selectedSkills
          const selectedSlot = get().selectedSlot
          const outCharms = Array.isArray(charms)
            ? charms.map((c) => ({
                ...c,
                computed: computeCharmProb(c, selectedSkills, selectedSlot),
              }))
            : []
          set({ AvlCharms: outCharms })
        } catch {
          set({
            AvlCharms: Array.isArray(charms) ? charms.map((c) => ({ ...c, computed: null })) : [],
          })
        }
      },

      // helper to update computed probs when selected skills/slot change
      recomputeAvlCharms: () => {
        const charms = get().AvlCharms || []
        const selectedSkills = get().selectedSkills
        const selectedSlot = get().selectedSlot
        const updated = charms.map((c) => ({
          ...c,
          computed: computeCharmProb(c, selectedSkills, selectedSlot),
        }))
        set({ AvlCharms: updated })
      },

      amuletListShowMode: "simple", // "all"| "simple"|
      setAmuletListShowMode: (mode) => {
        set({ amuletListShowMode: mode })
      },

      // 最愛護石
      favoriteCharms: [],

      setFavoriteCharms: (charms) => {
        console.log(charms)
        const filteredCharms = Array.isArray(charms)
          ? charms.filter(
              (charm, index, self) =>
                index ===
                self.findIndex(
                  (c) =>
                    c.rarity === charm.rarity &&
                    JSON.stringify(c.groups) === JSON.stringify(charm.groups) &&
                    JSON.stringify(c.slotKeys || []) === JSON.stringify(charm.slotKeys || []) &&
                    JSON.stringify(c.matchingSkills || []) === JSON.stringify(charm.matchingSkills || [])
                )
            )
          : []
        set({ favoriteCharms: filteredCharms })
      },
    }),
    {
      name: "mhw-store", // localStorage key
      partialize: (state) => ({ favoriteCharms: state.favoriteCharms }), // 僅保存 favoriteCharms
    }
  )
)

export default useMhwStore
