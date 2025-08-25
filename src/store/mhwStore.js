import { create } from "zustand"

// Simple zustand store to hold selectedSkills so components don't need to prop-drill it
const useMhwStore = create((set) => ({
  selectedSkills: [null, null, null],
  setSelectedSkills: (skills) => set({ selectedSkills: skills }),
  // selectedSlot stores the raw slot key string from Rarity.json (e.g. "[1, 1]")
  selectedSlot: "",
  setSelectedSlot: (slotKey) => set({ selectedSlot: slotKey }),
}))

export default useMhwStore
