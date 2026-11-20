/**
 * 本地数据层（localStorage 封装）
 * 全部业务数据都通过这里读写，未来接真后端时只需替换本文件里的实现，
 * 页面代码不用改（每个函数都是「取数据 / 存数据」的语义）
 */
import {
	VIDEOS,
	NEWS,
	TASKS,
	CATEGORIES
} from './seed.js'

// 版本变化时只刷新内容类数据（视频/判例/任务），学习记录、作业接受、账号等都保留
const SEED_VERSION = '2026.11.20.4'

const K = {
	ver: 'ylsh_seed_ver',
	videos: 'ylsh_videos',
	news: 'ylsh_news',
	tasks: 'ylsh_tasks',
	accepts: 'ylsh_accepts',
	submissions: 'ylsh_submissions',
	users: 'ylsh_users',
	session: 'ylsh_session',
	progress: 'ylsh_progress',
	records: 'ylsh_records',
	stats: 'ylsh_stats',
	settings: 'ylsh_settings',
	sid: 'ylsh_sid',
	uv: 'ylsh_uv_sessions'
}

/* ---------------- 基础读写 ---------------- */
export function read(key, def) {
	try {
		const v = uni.getStorageSync(key)
		if (v === '' || v === null || v === undefined) return def
		return v
	} catch (e) {
		return def
	}
}

export function write(key, val) {
	try {
		uni.setStorageSync(key, val)
		return true
	} catch (e) {
		console.warn('[store] 写入失败', key, e)
		return false
	}
}

export function uid(prefix) {
	return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function ymd(d) {
	const t = d ? new Date(d) : new Date()
	const m = String(t.getMonth() + 1).padStart(2, '0')
	const day = String(t.getDate()).padStart(2, '0')
	return t.getFullYear() + '-' + m + '-' + day
}

/* ---------------- 会话标识（UV 去重用） ---------------- */
export function touchSession() {
	let sid = read(K.sid, '')
	if (!sid) {
		sid = uid('sid')
		write(K.sid, sid)
	}
	return sid
}

export function isNewSession() {
	const sid = touchSession()
	const list = read(K.uv, [])
	if (list.indexOf(sid) > -1) return false
	list.push(sid)
	// 只保留最近 2000 条，避免占满存储
	write(K.uv, list.slice(-2000))
	return true
}

/* ---------------- 初始化种子 ---------------- */
export function initSeed() {
	const ver = read(K.ver, '')
	if (ver === SEED_VERSION) return false

	// 内容类数据：版本变化时刷新（保留用户产生的数据）
	write(K.videos, JSON.parse(JSON.stringify(VIDEOS)))
	write(K.news, JSON.parse(JSON.stringify(NEWS)))
	write(K.tasks, JSON.parse(JSON.stringify(TASKS)))

	if (!read(K.submissions, null)) write(K.submissions, [])
	if (!read(K.accepts, null)) write(K.accepts, [])
	if (!read(K.progress, null)) write(K.progress, {})
	if (!read(K.records, null)) write(K.records, [])

	// 演示账号
	const users = read(K.users, [])
	if (!users.length) {
		write(K.users, [{
			username: 'laonian',
			password: '123456',
			nickname: '李桂芳',
			stage: 'elder',
			createdAt: Date.now()
		}, {
			username: 'laoshi',
			password: '123456',
			nickname: '王老师',
			stage: 'teacher',
			createdAt: Date.now()
		}, {
			username: 'xiaoyu',
			password: '123456',
			nickname: '陈小雨',
			stage: 'junior',
			createdAt: Date.now()
		}])
	}

	// 管理员配置
	const st = read(K.settings, null)
	if (!st) {
		write(K.settings, {
			adminUser: 'admin',
			adminPwd: 'pcfz2026',
			siteName: '银铃守护',
			heroVideoId: 'v01'
		})
	}

	// 统计基线（让后台看板在首次打开时就有数据可看）
	if (!read(K.stats, null)) {
		write(K.stats, buildStatsSeed())
	}

	write(K.ver, SEED_VERSION)
	return true
}

function buildStatsSeed() {
	const daily = {}
	const pages = {}
	let pv = 0
	let uv = 0
	const base = [318, 402, 286, 511, 468, 375, 214]
	for (let i = 6; i >= 0; i--) {
		const d = new Date()
		d.setDate(d.getDate() - i)
		const key = ymd(d)
		// 今天给一个较低的基线，让 7 日趋势图有完整的 7 根柱子
		const p = i === 0 ? Math.round(base[6] * 0.35) : base[6 - i]
		daily[key] = { pv: p, uv: Math.round(p * 0.42) }
		pv += p
		uv += Math.round(p * 0.42)
	}
	return {
		pv: pv,
		uvBase: uv,
		daily: daily,
		learnSeconds: 128400, // 约 35.6 小时
		learnDone: 386,
		quizTimes: 214,
		quizPass: 173,
		aiTimes: 301,
		aiRight: 227,
		familyUsers: [],
		pages: pages,
		videoPlays: {},
		demo: true
	}
}

/* ---------------- 视频 ---------------- */
export function getCategories() {
	return CATEGORIES
}

/**
 * 视频/图片地址归一化：H5 端 uni 的 video 组件会把相对路径按当前页面路径解析，
 * 必须在最前面补 /，否则 /pages/learn/detail 页里会请求 /pages/learn/static/video/x.mp4。
 */
export function mediaSrc(src) {
	const s = String(src || '').trim()
	if (!s) return ''
	if (/^(https?:)?\/\//i.test(s)) return s
	if (/^(data|blob|file|content):/i.test(s)) return s
	if (s.charAt(0) === '/') return s
	return '/' + s
}

/** 老数据没有 poster 字段时，按 static/video/vXX.mp4 推导 static/poster/vXX.jpg */
function guessPoster(src) {
	const m = String(src || '').match(/\/static\/video\/(v\d+)\.mp4$/i)
	return m ? '/static/poster/' + m[1] + '.jpg' : ''
}

export function getVideos(includeOffline) {
	const list = read(K.videos, [])
	return list
		.filter(v => includeOffline || v.status !== 'offline')
		.map(v => {
			if (!v) return v
			const src = v.src ? mediaSrc(v.src) : ''
			const poster = v.poster ? mediaSrc(v.poster) : guessPoster(src)
			if (src === v.src && poster === v.poster) return v
			return Object.assign({}, v, {
				src: src,
				poster: poster
			})
		})
}

export function getVideo(id) {
	return getVideos(true).find(v => v.id === id) || null
}

export function saveVideo(video) {
	const list = getVideos(true)
	if (video.id) {
		const i = list.findIndex(v => v.id === video.id)
		if (i > -1) {
			const merged = Object.assign({}, list[i], video)
			// 换了视频源就重建封面，避免沿用旧视频的截图
			const newSrc = video.src === undefined ? list[i].src : mediaSrc(video.src)
			if (newSrc !== list[i].src) {
				merged.src = newSrc
				merged.poster = guessPoster(newSrc)
			}
			list[i] = merged
		} else list.unshift(video)
	} else {
		video.id = uid('v')
		video.views = 0
		video.createdAt = Date.now()
		list.unshift(video)
	}
	write(K.videos, list)
	return video
}

export function deleteVideo(id) {
	write(K.videos, getVideos(true).filter(v => v.id !== id))
}

export function toggleVideo(id) {
	const list = getVideos(true)
	const v = list.find(x => x.id === id)
	if (v) {
		v.status = v.status === 'offline' ? 'online' : 'offline'
		write(K.videos, list)
	}
	return v
}

export function incVideoPlay(id) {
	const list = getVideos(true)
	const v = list.find(x => x.id === id)
	if (v) {
		v.views = (v.views || 0) + 1
		write(K.videos, list)
	}
	const s = getStats()
	s.videoPlays[id] = (s.videoPlays[id] || 0) + 1
	saveStats(s)
}

/* ---------------- 新闻 / 判例 ---------------- */
export function getNews(type) {
	const list = read(K.news, [])
	const sorted = list.slice().sort((a, b) => (a.date < b.date ? 1 : -1))
	if (!type || type === 'all') return sorted
	return sorted.filter(n => n.type === type)
}

export function addNews(item) {
	const list = read(K.news, [])
	item.id = item.id || uid('n')
	list.unshift(item)
	write(K.news, list)
	return item
}

export function deleteNews(id) {
	write(K.news, read(K.news, []).filter(n => n.id !== id))
}

/* ---------------- 家校任务 ---------------- */
export function getTasks(stage) {
	const list = read(K.tasks, [])
	if (!stage) return list
	return list.filter(t => t.stage === stage)
}

export function addTask(task) {
	const list = read(K.tasks, [])
	task.id = uid('t')
	task.target = task.target || 'student'
	task.stages = task.stages || []
	task.teacher = task.teacher || '任课老师'
	task.teacherTitle = task.teacherTitle || ''
	task.createdAt = task.createdAt || ymd(new Date())
	task.points = Number(task.points) || 10
	task.minutes = Number(task.minutes) || 20
	task.deadline = task.deadline || ''
	list.unshift(task)
	write(K.tasks, list)
	return task
}

export function deleteTask(id) {
	write(K.tasks, read(K.tasks, []).filter(t => t.id !== id))
	write(K.accepts, read(K.accepts, []).filter(a => a.taskId !== id))
}

/* ---------------- 作业：接受制（不提交、不审核） ---------------- */

/** 判断一条作业是否派给该受众（elder / 学生学段） */
function hit(task, audience, stage) {
	const target = task.target || 'student'
	if (audience === 'elder') return target === 'elder' || target === 'all'
	if (target === 'elder') return false
	const list = task.stages || []
	if (!list.length) return true
	return !!stage && list.indexOf(stage) > -1
}

/** 取作业列表：filter = { audience, stage, id } */
export function getHomework(filter) {
	const f = filter || {}
	let list = read(K.tasks, [])
	if (f.audience) list = list.filter(t => hit(t, f.audience, f.stage))
	if (f.id) list = list.filter(t => t.id === f.id)
	return list
}

/** 接受记录：filter = { username, taskId } */
export function getAccepts(filter) {
	const f = filter || {}
	return read(K.accepts, [])
		.filter(a => (!f.username || a.username === f.username) &&
			(!f.taskId || a.taskId === f.taskId))
		.sort((a, b) => b.at - a.at)
}

/** 某条作业是否已被某人接受 */
export function findAccept(taskId, username) {
	return read(K.accepts, []).find(a => a.taskId === taskId && a.username === username) || null
}

/** 接受作业（老人端、学生端唯一动作） */
export function acceptHomework(taskId, user) {
	if (!user || !user.username) return { ok: false, msg: '请先登录' }
	const task = read(K.tasks, []).find(t => t.id === taskId)
	if (!task) return { ok: false, msg: '作业不存在或已被老师撤回' }
	if (findAccept(taskId, user.username)) return { ok: false, msg: '你已经接受过这份作业了' }
	const list = read(K.accepts, [])
	list.push({
		id: uid('a'),
		taskId: taskId,
		taskTitle: task.title,
		username: user.username,
		nickname: user.nickname,
		stage: user.stage,
		teacher: task.teacher,
		points: task.points,
		at: Date.now()
	})
	write(K.accepts, list)

	const s = getStats()
	if (!s.familyUsers) s.familyUsers = []
	if (s.familyUsers.indexOf(user.username) === -1) {
		s.familyUsers.push(user.username)
		saveStats(s)
	}
	return { ok: true, accept: list[list.length - 1] }
}

/** 某人通过“接受作业”累计的积分 */
export function getAcceptedPoints(username) {
	if (!username) return 0
	const tasks = read(K.tasks, [])
	return read(K.accepts, [])
		.filter(a => a.username === username)
		.reduce((sum, a) => {
			const t = tasks.find(x => x.id === a.taskId)
			return sum + (t ? Number(t.points) || 0 : Number(a.points) || 0)
		}, 0)
}

/** 某学段的作业接受情况：{ total, accepted, people: [] } */
export function getTaskAcceptStat(taskId) {
	const accepts = getAccepts({
		taskId: taskId
	})
	return {
		count: accepts.length,
		people: accepts
	}
}

export function getSubmissions(filter) {
	const list = read(K.submissions, [])
	const f = filter || {}
	return list
		.filter(s => (!f.username || s.username === f.username) &&
			(!f.stage || s.stage === f.stage) &&
			(!f.status || s.status === f.status) &&
			(!f.taskId || s.taskId === f.taskId))
		.sort((a, b) => b.at - a.at)
}

export function addSubmission(sub) {
	const list = read(K.submissions, [])
	sub.id = uid('s')
	sub.status = 'pending'
	sub.at = Date.now()
	list.unshift(sub)
	write(K.submissions, list)

	const s = getStats()
	if (s.familyUsers.indexOf(sub.username) === -1) {
		s.familyUsers.push(sub.username)
		saveStats(s)
	}
	return sub
}

export function reviewSubmission(id, status) {
	const list = read(K.submissions, [])
	const item = list.find(x => x.id === id)
	if (item) {
		item.status = status
		item.reviewAt = Date.now()
		write(K.submissions, list)
	}
	return item
}

/* ---------------- 学习进度 ---------------- */
export function getProgress(username) {
	const all = read(K.progress, {})
	return all[username] || {}
}

export function addStudyTime(username, videoId, seconds, duration) {
	if (!username) return
	const all = read(K.progress, {})
	const mine = all[username] || {}
	const item = mine[videoId] || { seconds: 0, max: 0, done: false }
	item.seconds += seconds
	const ratio = duration ? Math.min(1, (item.seconds || 0) / duration) : 0
	item.max = Math.max(item.max || 0, ratio)
	if (ratio >= 0.8 && !item.done) {
		item.done = true
		item.doneAt = Date.now()
	}
	mine[videoId] = item
	all[username] = mine
	write(K.progress, all)

	const s = getStats()
	s.learnSeconds += seconds
	if (item.done && !item._counted) {
		s.learnDone += 1
	}
	saveStats(s)
}

export function setVideoQuiz(username, videoId, score) {
	const all = read(K.progress, {})
	const mine = all[username] || {}
	mine[videoId] = Object.assign({ seconds: 0, max: 0, done: false }, mine[videoId], { quizScore: score })
	all[username] = mine
	write(K.progress, all)
}

/* ---------------- 答题记录 ---------------- */
export function addQuizRecord(rec) {
	const list = read(K.records, [])
	rec.id = uid('r')
	rec.at = Date.now()
	rec.certNo = 'YLSH' + ymd().replace(/-/g, '') + String(list.length + 1).padStart(4, '0')
	list.unshift(rec)
	write(K.records, list)

	const s = getStats()
	s.quizTimes += 1
	if (rec.pass) s.quizPass += 1
	saveStats(s)
	return rec
}

export function getRecords(username) {
	const list = read(K.records, [])
	if (!username) return list
	return list.filter(r => r.username === username)
}

export function getCert(no) {
	const list = read(K.records, [])
	if (no) return list.find(r => r.certNo === no) || null
	return list.find(r => r.pass) || null
}

export function countAi(right) {
	const s = getStats()
	s.aiTimes += 1
	if (right) s.aiRight += 1
	saveStats(s)
}

/* ---------------- 统计 ---------------- */
export function getStats() {
	return read(K.stats, buildStatsSeed())
}

export function saveStats(s) {
	write(K.stats, s)
}

export function trackPage(name) {
	const s = getStats()
	const today = ymd()
	if (!s.daily[today]) s.daily[today] = { pv: 0, uv: 0 }
	s.pv += 1
	s.daily[today].pv += 1
	s.pages[name] = (s.pages[name] || 0) + 1
	if (isNewSession()) {
		s.daily[today].uv += 1
	}
	saveStats(s)
}

export function totalUv() {
	const s = getStats()
	const sessions = read(K.uv, [])
	return (s.uvBase || 0) + sessions.length
}

/* ---------------- 用户与登录 ---------------- */
export function getSettings() {
	return read(K.settings, {
		adminUser: 'admin',
		adminPwd: 'pcfz2026',
		siteName: '银铃守护',
		heroVideoId: 'v01'
	})
}

export function setSettings(patch) {
	const s = Object.assign(getSettings(), patch)
	write(K.settings, s)
	return s
}

export function getUsers() {
	return read(K.users, [])
}

export function loginUser(username, password, stage) {
	const name = String(username || '').trim()
	if (!name) return { ok: false, msg: '请输入用户名' }
	if (!password) return { ok: false, msg: '请输入密码' }

	const users = getUsers()
	let u = users.find(x => x.username === name)
	if (!u) {
		// 演示环境首次登录自动建档
		u = {
			username: name,
			password: String(password),
			nickname: name,
			stage: stage || 'elder',
			createdAt: Date.now()
		}
		users.push(u)
		write(K.users, users)
	} else {
		if (String(u.password) !== String(password)) {
			return { ok: false, msg: '密码不正确，请重新输入' }
		}
		u.stage = stage || u.stage || 'elder'
		u.lastLoginAt = Date.now()
		write(K.users, users)
	}

	const session = {
		role: 'user',
		username: u.username,
		nickname: u.nickname,
		stage: u.stage || 'elder',
		at: Date.now()
	}
	write(K.session, session)
	return { ok: true, session: session }
}

export function loginAdmin(username, password) {
	const st = getSettings()
	if (String(username).trim() !== st.adminUser || String(password) !== st.adminPwd) {
		return { ok: false, msg: '管理员账号或密码不正确' }
	}
	const session = {
		role: 'admin',
		username: st.adminUser,
		nickname: '管理员',
		at: Date.now()
	}
	write(K.session, session)
	return { ok: true, session: session }
}

export function getSession() {
	return read(K.session, null)
}

export function logout() {
	write(K.session, null)
}

export function updateUserStage(username, stage) {
	const users = getUsers()
	const u = users.find(x => x.username === username)
	if (u) {
		u.stage = stage
		write(K.users, users)
		const s = getSession()
		if (s && s.username === username) {
			s.stage = stage
			write(K.session, s)
		}
	}
}

/** 清空本机所有数据（后台“重置演示数据”用） */
export function resetAll() {
	const keys = Object.keys(K).filter(k => k !== 'sid')
	keys.forEach(k => {
		try {
			uni.removeStorageSync(K[k])
		} catch (e) {}
	})
	initSeed()
}

export default {
	read,
	write,
	uid,
	ymd,
	initSeed,
	touchSession,
	getCategories,
	getVideos,
	getVideo,
	mediaSrc,
	saveVideo,
	deleteVideo,
	toggleVideo,
	incVideoPlay,
	getNews,
	addNews,
	deleteNews,
	getTasks,
	addTask,
	deleteTask,
	getHomework,
	getAccepts,
	findAccept,
	acceptHomework,
	getAcceptedPoints,
	getTaskAcceptStat,
	getSubmissions,
	addSubmission,
	reviewSubmission,
	getProgress,
	addStudyTime,
	setVideoQuiz,
	addQuizRecord,
	getRecords,
	getCert,
	countAi,
	getStats,
	saveStats,
	trackPage,
	totalUv,
	getSettings,
	setSettings,
	getUsers,
	loginUser,
	loginAdmin,
	getSession,
	logout,
	updateUserStage,
	resetAll
}
