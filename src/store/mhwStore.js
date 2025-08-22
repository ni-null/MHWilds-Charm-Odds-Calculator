import { create } from "zustand"

// Simple zustand store to hold selectedSkills so components don't need to prop-drill it
const useMhwStore = create((set) => ({
  selectedSkills: [null, null, null],
  setSelectedSkills: (skills) => set({ selectedSkills: skills }),
}))

export default useMhwStore
