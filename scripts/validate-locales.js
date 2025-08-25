const fs = require('fs');
const paths = [
  'c:/Users/S00129/Desktop/code/MHWilds Charm Odds Calculator/src/i18n/locales/en-US.json',
  'c:/Users/S00129/Desktop/code/MHWilds Charm Odds Calculator/src/i18n/locales/ja-JP.json',
  'c:/Users/S00129/Desktop/code/MHWilds Charm Odds Calculator/src/i18n/locales/zh-TW.json',
  'c:/Users/S00129/Desktop/code/MHWilds Charm Odds Calculator/src/i18n/locales/zh-CN.json'
];
let ok = true;
for (const p of paths) {
  try {
    const content = fs.readFileSync(p, 'utf8');
    JSON.parse(content);
    console.log(p + ': OK');
  } catch (e) {
    console.error(p + ': ERR - ' + e.message);
    ok = false;
  }
}
process.exit(ok ? 0 : 1);
