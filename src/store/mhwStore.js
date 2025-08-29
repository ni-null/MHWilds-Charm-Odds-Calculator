import { create } from "zustand"

// Simple zustand store to hold selectedSkills so components don't need to prop-drill it
const useMhwStore = create((set) => ({
  // selectedSkills is now an array-of-arrays: each slot holds zero or more chosen skill keys
  // e.g. [ ["Sk1 Lv.1","Sk2 Lv.1"], ["Sk3 Lv.2"], [] ]
  selectedSkills: [[], [], []],
  setSelectedSkills: (skills) => set({ selectedSkills: skills }),
  // selectedSlot stores the raw slot key string from Rarity.json (e.g. "[1, 1]")
  selectedSlot: "",
  setSelectedSlot: (slotKey) => set({ selectedSlot: slotKey }),
}))

export default useMhwStore
