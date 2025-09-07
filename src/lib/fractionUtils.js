/**
 * 將小數轉換為可讀的分數字符串
 * 使用連分數逼近算法產生最佳的有理數近似值
 *
 * @param {number} x - 要轉換的小數值
 * @param {number} maxDen - 分母的最大值，默認為100000000
 * @returns {string} 格式化的分數字符串
 */
export function decimalToFraction(x, maxDen = 100000000) {
  // 輔助函數：格式化整數，添加千位分隔符
  const formatInt = (n) => {
    try {
      return new Intl.NumberFormat(undefined).format(n)
    } catch {
      return String(n)
    }
  }

  // 返回可讀的分數字符串，適用於 0 < x < 1
  // - 快速路徑：如果 x 接近精確倒數 (1/N)，返回 `1/N`
  // - 使用中位數/二分搜索找到分母 <= maxDen 的最佳分數
  if (!x || x <= 0) return "0"
  if (!isFinite(x)) return "0"

  // 如果 x >= 1，返回整數或簡化分數（格式化整數）
  if (x >= 1) {
    const n = Math.round(x)
    return `${formatInt(n)}/1`
  }

  const tol = 1e-12
  // 首先嘗試 1/N 形式以提高可讀性
  const recip = 1 / x
  const rInt = Math.round(recip)
  if (rInt > 0 && rInt <= maxDen && Math.abs(1 / rInt - x) <= Math.max(tol, 1e-8)) {
    return `1/${formatInt(rInt)}`
  }

  // 在 0/1 和 1/1 之間進行中位數搜索
  let lowerN = 0,
    lowerD = 1
  let upperN = 1,
    upperD = 1
  let bestN = 0,
    bestD = 1
  let bestErr = Math.abs(x - 0)

  while (true) {
    const mediantN = lowerN + upperN
    const mediantD = lowerD + upperD
    if (mediantD > maxDen) break
    const mediant = mediantN / mediantD
    const err = Math.abs(x - mediant)
    if (err < bestErr) {
      bestErr = err
      bestN = mediantN
      bestD = mediantD
    }
    if (mediant < x) {
      // 向上移動下限
      // 避免巨大跳躍；單步進行
      lowerN = mediantN
      lowerD = mediantD
    } else if (mediant > x) {
      // 向下移動上限
      upperN = mediantN
      upperD = mediantD
    } else {
      // 精確匹配
      bestN = mediantN
      bestD = mediantD
      break
    }
  }

  // 回退到找到的最佳值，或者如果沒有找到則返回簡單的四捨五入百分比
  if (bestN === 0) {
    // 回退：返回保留6位小數的百分比以保持可讀性
    return `${(x * 100).toFixed(6)}%`
  }

  // 約簡分數
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))
  const g = gcd(bestN, bestD)
  let num = bestN / g
  let den = bestD / g

  // 當分母超過100時，強制轉換為 1/N 的形式
  if (den > 100) {
    const reciprocal = Math.round(1 / x)
    // 限制分母最多8位數字
    const maxDenominator = 99999999 // 8位數字的最大值
    if (reciprocal <= maxDenominator) {
      num = 1
      den = reciprocal
    }
  }

  // 限制分母最多8位數字
  if (den > 99999999) {
    den = 99999999
    num = 1
  }

  // 使用千位分隔符格式化分母以提高可讀性
  try {
    const denFormatted = new Intl.NumberFormat(undefined).format(den)
    return `${num}/${denFormatted}`
  } catch (err) {
    try {
      console.debug && console.debug("denominator format failed", err)
    } catch {
      // 忽略日誌錯誤
    }
    return `${num}/${den}`
  }
}
