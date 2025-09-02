import { create } from "zustand"
import { computeCharmProb } from "../lib/amuletProb"

// Simple zustand store to hold selectedSkills so components don't need to prop-drill it
const useMhwStore = create((set, get) => ({
  // selectedSkills is now an array-of-arrays: each slot holds zero or more chosen skill keys
  // e.g. [ ["Sk1 Lv.1","Sk2 Lv.1"], ["Sk3 Lv.2"], [] ]
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
   * Each element is an object with the following shape:
   * {
   *   rarity: string,            // e.g. "RARE[7]"
   *   groups: number[],          // array of group numbers from Rarity.json, e.g. [3,8,5]
   *   matchingSkills: string[],  // array of selected skill keys ("SkillName Lv.X") that were
   *                             // actually assigned to this group combination for the match
   *   slotKeys: string[]         // array of slot key strings (original keys from Rarity.json)
   * }
   *
   * Notes:
   * - `matchingSkills` contains only the user's currently selected skills that
   *   can be assigned to this group's slots (assignments are enumerated so
   *   different selected-skill combinations produce separate entries).
   * - `slotKeys` are the raw slotKey strings from the data (e.g. "[1]", "[1, 1]",
   *   or '["W1", 1]') and may need normalization for comparisons.
   */
  AvlCharms: [],
  setAvlCharms: (charms) => {
    try {
      const selectedSkills = get().selectedSkills
      const selectedSlot = get().selectedSlot
      const outCharms = Array.isArray(charms) ? charms.map((c) => ({ ...c, computed: computeCharmProb(c, selectedSkills, selectedSlot) })) : []
      set({ AvlCharms: outCharms })
    } catch {
      // fallback to raw set
      set({ AvlCharms: Array.isArray(charms) ? charms.map((c) => ({ ...c, computed: null })) : [] })
    }
  },

  // helper to update computed probs when selected skills/slot change
  recomputeAvlCharms: () => {
    const charms = get().AvlCharms || []
    const selectedSkills = get().selectedSkills
    const selectedSlot = get().selectedSlot
    const updated = charms.map((c) => ({ ...c, computed: computeCharmProb(c, selectedSkills, selectedSlot) }))
    set({ AvlCharms: updated })
  },
}))

export default useMhwStore
