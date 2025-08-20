import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { HashRouter, Routes, Route } from "react-router-dom"
import MHWPage from "./pages/MHWildsCharmOddsCalculator/index"
import SkillGroupsPage from "./pages/MHWildsCharmSkillGroups/index"
import CharmTypePage from "./pages/MHWildsCharmType/index"
import "./i18n"

// 统一使用 HashRouter，无论开发还是生产环境
// HashRouter 不需要 basename，通过 # 来处理路由
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path='/' element={<MHWPage />} />
        <Route path='/skill-groups' element={<SkillGroupsPage />} />
        <Route path='/charm-types' element={<CharmTypePage />} />
      </Routes>
    </HashRouter>
  </StrictMode>
)
