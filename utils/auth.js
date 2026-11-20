/**
 * 登录态与路由守卫
 * 页面 onLoad 里调用 requireUser() / requireAdmin()，返回 null 表示已被踢回登录页
 */
import db from './store.js'

export function current() {
	return db.getSession()
}

export function requireUser() {
	const s = db.getSession()
	if (!s || s.role !== 'user') {
		uni.reLaunch({
			url: '/pages/login/login'
		})
		return null
	}
	return s
}

export function requireAdmin() {
	const s = db.getSession()
	if (!s || s.role !== 'admin') {
		uni.reLaunch({
			url: '/pages/login/login'
		})
		return null
	}
	return s
}

export function isAdmin() {
	const s = db.getSession()
	return !!s && s.role === 'admin'
}

export function goHome() {
	const s = db.getSession()
	if (s && s.role === 'admin') {
		uni.reLaunch({
			url: '/pages/admin/admin'
		})
	} else {
		uni.reLaunch({
			url: '/pages/index/index'
		})
	}
}

export function logout() {
	db.logout()
	uni.reLaunch({
		url: '/pages/login/login'
	})
}

export default {
	current,
	requireUser,
	requireAdmin,
	isAdmin,
	goHome,
	logout
}
