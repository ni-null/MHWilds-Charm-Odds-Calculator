import { computeCharmProb } from "./src/lib/amuletProb.js"
import RarityData from "./src/data/Rarity.json"
import SkillGroups from "./src/data/SkillGroups.json"

// load a sample charm matching the user's first entry
const charm = {
  rarity: "RARE[7]",
  groups: [3, 6, 5],
}

const res = computeCharmProb(charm, [["Adaptability Lv.1"], ["Adaptability Lv.1"], ["Adaptability Lv.1"]], "[1]")
console.log(JSON.stringify(res, null, 2))
