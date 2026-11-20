/** 格式化工具 */

export function pad(n) {
	return String(n).padStart(2, '0')
}

/** 秒 -> 03:12 */
export function mmss(sec) {
	const s = Math.max(0, Math.round(sec || 0))
	return pad(Math.floor(s / 60)) + ':' + pad(s % 60)
}

/** 秒 -> 3 分 12 秒 / 1 小时 5 分 */
export function humanSec(sec) {
	const s = Math.max(0, Math.round(sec || 0))
	if (s < 60) return s + ' 秒'
	const m = Math.floor(s / 60)
	if (m < 60) return m + ' 分 ' + (s % 60) + ' 秒'
	const h = Math.floor(m / 60)
	return h + ' 小时 ' + (m % 60) + ' 分'
}

/** 秒 -> 小时数（一位小数） */
export function toHours(sec) {
	return ((sec || 0) / 3600).toFixed(1)
}

/** 时间戳 / 日期串 -> 2026-11-20 */
export function dateStr(v) {
	if (!v) return ''
	if (typeof v === 'string') return v.slice(0, 10)
	const d = new Date(v)
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

/** 时间戳 -> 11-20 18:30 */
export function timeStr(v) {
	const d = new Date(v)
	return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

/** 12000 -> 1.2 万 */
export function bigNum(n) {
	const v = Number(n) || 0
	if (v >= 10000) return (v / 10000).toFixed(1) + ' 万'
	return String(v)
}

/** 天数 -> 今天 / 昨天 / 3 天前 */
export function relDay(v) {
	const t = typeof v === 'string' ? new Date(v.replace(/-/g, '/')) : new Date(v)
	const diff = Math.floor((Date.now() - t.getTime()) / 86400000)
	if (diff <= 0) return '今天'
	if (diff === 1) return '昨天'
	if (diff < 30) return diff + ' 天前'
	return dateStr(v)
}

/** 手机号脱敏 */
export function maskPhone(p) {
	const s = String(p || '')
	if (s.length < 7) return s
	return s.slice(0, 3) + '****' + s.slice(-4)
}

export default {
	mmss,
	humanSec,
	toHours,
	dateStr,
	timeStr,
	bigNum,
	relDay,
	maskPhone
}
