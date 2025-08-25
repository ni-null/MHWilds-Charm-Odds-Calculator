const fs = require("fs")
const path = require("path")
const https = require("https")

const workspaceRoot = path.resolve(__dirname, "..")
const aaHtmlPath = path.join(workspaceRoot, "aa.html")
const zhCNPath = path.join(workspaceRoot, "src", "i18n", "locales", "zh-CN.json")
const outDir = path.join(workspaceRoot, "image", "skills")

function readFile(p) {
  return fs.readFileSync(p, { encoding: "utf8" })
}

function parseImageEntriesFromHtml(html) {
  const regex =
    /<img[^>]+src=["'](https?:)?\/\/image.gamersky.com\/webimg13\/zhuanti\/MonsterHunterAssembler\/colorIcon\/([^"']+)["'][^>]*>\s*<\/div>\s*<div[^>]*class=["']r["'][^>]*>\s*<div[^>]*class=["']name["'][^>]*>([^<]+)<\/div>/g
  const results = []
  let m
  while ((m = regex.exec(html))) {
    const url = (m[1] ? m[1] : "https:") + "//" + "image.gamersky.com/webimg13/zhuanti/MonsterHunterAssembler/colorIcon/" + m[2]
    const chinese = m[3].trim()
    results.push({ url, chinese, filename: m[2] })
  }
  const regex2 = /src=["'](https?:)?\/\/image.gamersky.com\/webimg13\/zhuanti\/MonsterHunterAssembler\/colorIcon\/([^"']+)["']/g
  while ((m = regex2.exec(html))) {
    const url = (m[1] ? m[1] : "https:") + "//" + "image.gamersky.com/webimg13/zhuanti/MonsterHunterAssembler/colorIcon/" + m[2]
    if (!results.find((r) => r.url.endsWith(m[2]))) {
      results.push({ url, chinese: null, filename: m[2] })
    }
  }
  return results
}

function buildReverseMap(translations) {
  const map = {}
  for (const eng of Object.keys(translations.skillTranslations || {})) {
    const cn = translations.skillTranslations[eng]
    map[cn] = eng
  }
  return map
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (res) => {
        if (res.statusCode === 200) {
          res.pipe(file)
          file.on("finish", () => file.close(() => resolve()))
        } else if (res.statusCode === 302 || res.statusCode === 301) {
          const loc = res.headers.location
          if (loc) {
            download(loc, dest).then(resolve).catch(reject)
          } else {
            reject(new Error("Redirect without location"))
          }
        } else {
          reject(new Error("HTTP " + res.statusCode + " for " + url))
        }
      })
      .on("error", (err) => {
        reject(err)
      })
  })
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const html = readFile(aaHtmlPath)
  const zh = JSON.parse(readFile(zhCNPath))
  const rev = buildReverseMap(zh)
  const entries = parseImageEntriesFromHtml(html)
  console.log("Found", entries.length, "icon entries")

  const report = []
  for (const e of entries) {
    const base = path.basename(e.filename)
    const ext = path.extname(base) || ".png"
    const chinese = e.chinese
    const eng = chinese && rev[chinese] ? rev[chinese] : null
    let name
    if (eng) {
      name = eng + ext
    } else {
      name = base
    }
    const outPath = path.join(outDir, name.replace(/[/\\?%*:|"<>]/g, "_"))
    try {
      await download(e.url, outPath)
      report.push({ url: e.url, chinese, eng, outPath, ok: true })
      console.log("Saved", outPath)
    } catch (err) {
      report.push({ url: e.url, chinese, eng, outPath, ok: false, error: err.message })
      console.error("Failed", e.url, err.message)
    }
  }

  fs.writeFileSync(path.join(outDir, "download-report.json"), JSON.stringify(report, null, 2))
  console.log("Report written to", path.join(outDir, "download-report.json"))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
