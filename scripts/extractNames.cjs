const fs = require("fs")
const html = fs.readFileSync("aa.html", "utf8")
const re = /class="name"[^>]*>([^<]+)</g
let m
let arr = []
while ((m = re.exec(html)) !== null) {
  arr.push(m[1].trim())
}
arr = Array.from(new Set(arr))
fs.writeFileSync("tmp-names.json", JSON.stringify(arr, null, 2), "utf8")
console.log("extracted", arr.length, "unique names")
