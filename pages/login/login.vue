<template>
	<view class="login">
		<!-- 顶部品牌区 -->
		<view class="hero">
			<view class="bubble b1"></view>
			<view class="bubble b2"></view>
			<view class="hero-top">
				<view class="hero-mark">
					<text class="hero-mark-t">银铃</text>
				</view>
				<text class="hero-ver">v1.0</text>
			</view>
			<text class="hero-title">银铃守护</text>
			<text class="hero-sub">老年人反诈学堂 · 学得会，用得上，防得住</text>
			<view class="hero-tags">
				<text class="hero-tag">视频学习</text>
				<text class="hero-tag">AI 辨伪</text>
				<text class="hero-tag">一键报警</text>
			</view>
		</view>

		<view class="body">
			<!-- 身份切换 -->
			<view class="tabs">
				<view class="tab" :class="{ 'tab-on': tab === 'user' }" @click="switchTab('user')">
					<text class="tab-t">用户登录</text>
				</view>
				<view class="tab" :class="{ 'tab-on': tab === 'admin' }" @click="switchTab('admin')">
					<text class="tab-t">管理员登录</text>
				</view>
			</view>

			<!-- 用户登录 -->
			<view v-if="tab === 'user'" class="form yl-fade">
				<view class="yl-field">
					<text class="yl-label">用户名</text>
					<input class="yl-input" v-model="user.name" placeholder="请输入用户名" placeholder-class="ph" maxlength="20" />
				</view>

				<view class="yl-field">
					<text class="yl-label">密码</text>
					<view class="pwd">
						<input class="pwd-input" v-model="user.pwd" :password="!showUserPwd" placeholder="请输入密码"
							placeholder-class="ph" maxlength="24" @confirm="doLogin" />
						<view class="pwd-eye" @click="showUserPwd = !showUserPwd">
							<text class="pwd-eye-t">{{ showUserPwd ? '🙈' : '👁' }}</text>
						</view>
					</view>
					<text class="pwd-tip">点右侧眼睛可以查看/隐藏密码</text>
				</view>

				<view class="yl-field">
					<text class="yl-label">我的身份（老师可布置作业，学生/长辈只接受作业）</text>
					<view class="stages">
						<view v-for="s in stageList" :key="s.key" class="stage" :class="{ 'stage-on': stage === s.key }"
							@click="stage = s.key">
							<text class="stage-e">{{ s.emoji }}</text>
							<text class="stage-n">{{ s.name }}</text>
						</view>
					</view>
				</view>

				<view v-if="errMsg" class="err">
					<text class="err-t">⚠ {{ errMsg }}</text>
				</view>

				<button class="yl-btn yl-btn-lg yl-btn-primary yl-btn-block" :loading="loading" @click="doLogin">
					登 录
				</button>

				<view class="demo" @click="fillDemo">
					<text class="demo-t">没有账号？点这里一键填入演示账号</text>
				</view>

				<view class="admin-note">
					<text class="admin-note-t">演示：laonian / 123456（长辈）· xiaoyu / 123456（初中）· laoshi / 123456（老师）</text>
				</view>
			</view>

			<!-- 管理员登录 -->
			<view v-else class="form yl-fade">
				<view class="admin-hint">
					<text class="admin-hint-t">管理员可上传/下架视频、管理判例与作业、查看全站数据</text>
				</view>

				<view class="yl-field">
					<text class="yl-label">管理员账号</text>
					<input class="yl-input" v-model="admin.name" placeholder="请输入管理员账号" placeholder-class="ph"
						maxlength="20" />
				</view>

				<view class="yl-field">
					<text class="yl-label">管理员密码</text>
					<view class="pwd">
						<input class="pwd-input" v-model="admin.pwd" :password="!showAdminPwd" placeholder="请输入管理员密码"
							placeholder-class="ph" maxlength="24" @confirm="doLogin" />
						<view class="pwd-eye" @click="showAdminPwd = !showAdminPwd">
							<text class="pwd-eye-t">{{ showAdminPwd ? '🙈' : '👁' }}</text>
						</view>
					</view>
					<text class="pwd-tip">点右侧眼睛可以查看/隐藏密码</text>
				</view>

				<view v-if="errMsg" class="err">
					<text class="err-t">⚠ {{ errMsg }}</text>
				</view>

				<button class="yl-btn yl-btn-lg yl-btn-primary yl-btn-block" :loading="loading" @click="doLogin">
					进入管理后台
				</button>

				<view class="demo" @click="fillAdmin">
					<text class="demo-t">一键填入管理员演示账号</text>
				</view>

				<view class="admin-note">
					<text class="admin-note-t">演示账号：admin / pcfz2026（登录后可在后台修改）</text>
				</view>
			</view>

			<!-- 紧急提示 -->
			<view class="urgent">
				<view class="urgent-l">
					<text class="urgent-t">已经转账、正在被骗？</text>
					<text class="urgent-s">请立即挂断并拨打 110，越早止付越可能追回</text>
				</view>
				<view class="urgent-btn" @click="call110">
					<text class="urgent-btn-t">拨 110</text>
				</view>
			</view>

			<text class="footer">本平台为公益反诈学习用途，不收集任何真实身份与支付信息</text>
		</view>
	</view>
</template>

<script>
	import db from '@/utils/store.js'

	export default {
		data() {
			return {
				tab: 'user',
				loading: false,
				errMsg: '',
				showUserPwd: false,
				showAdminPwd: false,
				stage: 'elder',
				user: { name: '', pwd: '' },
				admin: { name: '', pwd: '' },
				stageList: [
					{ key: 'elder', name: '我是长辈', emoji: '👴' },
					{ key: 'primary', name: '小学', emoji: '🎒' },
					{ key: 'junior', name: '初中', emoji: '📘' },
					{ key: 'senior', name: '高中', emoji: '🎓' },
					{ key: 'college', name: '大学', emoji: '🏫' },
					{ key: 'teacher', name: '老师', emoji: '🧑‍🏫' }
				]
			}
		},
		onLoad() {
			// 已经登录过就直接进对应首页
			const s = db.getSession()
			if (s && s.role === 'admin') {
				uni.reLaunch({ url: '/pages/admin/admin' })
			} else if (s && s.role === 'user') {
				uni.reLaunch({ url: '/pages/index/index' })
			}
		},
		methods: {
			switchTab(t) {
				if (this.tab === t) return
				this.tab = t
				this.errMsg = ''
				this.loading = false
			},
			fillDemo() {
				this.user.name = 'laonian'
				this.user.pwd = '123456'
				this.stage = 'elder'
				this.errMsg = ''
				uni.showToast({ title: '已填入演示账号', icon: 'none' })
			},
			fillAdmin() {
				this.admin.name = 'admin'
				this.admin.pwd = 'pcfz2026'
				this.errMsg = ''
				uni.showToast({ title: '已填入管理员账号', icon: 'none' })
			},
			doLogin() {
				if (this.loading) return
				this.errMsg = ''
				this.loading = true

				let r
				if (this.tab === 'admin') {
					r = db.loginAdmin(this.admin.name, this.admin.pwd)
				} else {
					r = db.loginUser(this.user.name, this.user.pwd, this.stage)
				}

				if (!r.ok) {
					this.loading = false
					this.errMsg = r.msg
					uni.showToast({ title: r.msg, icon: 'none' })
					return
				}

				uni.showToast({ title: '登录成功', icon: 'success' })
				let url = '/pages/index/index'
				if (this.tab === 'admin') url = '/pages/admin/admin'
				else if (this.stage === 'teacher') url = '/pages/teacher/teacher'
				setTimeout(() => {
					this.loading = false
					uni.reLaunch({
						url: url
					})
				}, 400)
			},
			call110() {
				uni.makePhoneCall({
					phoneNumber: '110',
					fail: () => {
						uni.showToast({ title: '当前设备不支持拨号，请用手机拨打 110', icon: 'none' })
					}
				})
			}
		}
	}
</script>

<style>
	.login {
		min-height: 100vh;
		background: #FBF4EC;
	}

	/* 顶部 */
	.hero {
		position: relative;
		overflow: hidden;
		padding: 22px 22px 40px;
		background: linear-gradient(155deg, #B3271F 0%, #C8332B 42%, #E8622C 78%, #EFA23C 100%);
		border-radius: 0 0 30px 30px;
	}

	.bubble {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, .1);
	}

	.b1 {
		width: 190px;
		height: 190px;
		right: -60px;
		top: -70px;
	}

	.b2 {
		width: 120px;
		height: 120px;
		left: -40px;
		bottom: -50px;
		background: rgba(255, 255, 255, .08);
	}

	.hero-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
	}

	.hero-mark {
		padding: 5px 12px;
		border: 1px solid rgba(255, 255, 255, .55);
		border-radius: 8px;
	}

	.hero-mark-t {
		font-size: 14px;
		color: #fff;
		letter-spacing: 3px;
		font-weight: 600;
	}

	.hero-ver {
		font-size: 12px;
		color: rgba(255, 255, 255, .75);
	}

	.hero-title {
		display: block;
		position: relative;
		margin-top: 26px;
		font-size: 40px;
		font-weight: 800;
		color: #fff;
		letter-spacing: 6px;
		line-height: 1.2;
		text-shadow: 0 3px 10px rgba(120, 20, 10, .28);
	}

	.hero-sub {
		display: block;
		position: relative;
		margin-top: 8px;
		font-size: 15px;
		color: rgba(255, 255, 255, .92);
		letter-spacing: 1px;
	}

	.hero-tags {
		display: flex;
		gap: 8px;
		margin-top: 18px;
		position: relative;
	}

	.hero-tag {
		font-size: 12px;
		color: #fff;
		padding: 4px 10px;
		border-radius: 999px;
		background: rgba(255, 255, 255, .18);
		border: 1px solid rgba(255, 255, 255, .28);
	}

	/* 主体 */
	.body {
		max-width: 480px;
		margin: -26px auto 0;
		padding: 0 16px 40px;
		position: relative;
	}

	.tabs {
		display: flex;
		background: #fff;
		border-radius: 16px;
		padding: 5px;
		box-shadow: 0 8px 24px rgba(160, 110, 70, .14);
		border: 1px solid #F3E5D5;
	}

	.tab {
		flex: 1;
		height: 46px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tab-t {
		font-size: 16px;
		color: #8A7C6D;
		font-weight: 500;
	}

	.tab-on {
		background: linear-gradient(135deg, #E8622C, #C8332B);
	}

	.tab-on .tab-t {
		color: #fff;
		font-weight: 700;
	}

	.form {
		margin-top: 18px;
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 18px;
		padding: 18px 16px 20px;
		box-shadow: 0 4px 16px rgba(160, 120, 80, .07);
	}

	.ph {
		color: #C4B8AB;
		font-size: 16px;
	}

	/* 密码框 */
	.pwd {
		display: flex;
		align-items: center;
		height: 54px;
		background: #fff;
		border: 1px solid #EAD9C6;
		border-radius: 14px;
		padding-right: 8px;
		box-sizing: border-box;
	}

	.pwd-input {
		flex: 1;
		height: 100%;
		padding: 0 16px;
		font-size: 17px;
		box-sizing: border-box;
	}

	.pwd-eye {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		background: #FDF6EE;
	}

	.pwd-eye-t {
		font-size: 18px;
		line-height: 1;
	}

	.pwd-tip {
		display: block;
		margin-top: 6px;
		font-size: 12px;
		color: #B4A697;
	}

	/* 身份 */
	.stages {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.stage {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		border-radius: 12px;
		border: 1px solid #EDDCC8;
		background: #fff;
	}

	.stage-e {
		font-size: 15px;
	}

	.stage-n {
		font-size: 14px;
		color: #6C5C4C;
	}

	.stage-on {
		background: #FDEDE9;
		border-color: #E9A79E;
	}

	.stage-on .stage-n {
		color: #C8332B;
		font-weight: 700;
	}

	.err {
		background: #FCEBE9;
		border: 1px solid #F3C9C3;
		border-radius: 12px;
		padding: 10px 12px;
		margin-bottom: 12px;
	}

	.err-t {
		font-size: 13px;
		color: #C8332B;
	}

	.demo {
		margin-top: 14px;
		text-align: center;
	}

	.demo-t {
		font-size: 13px;
		color: #A07A55;
		text-decoration: underline;
	}

	.admin-hint {
		background: #FBF3E6;
		border-radius: 12px;
		padding: 10px 12px;
		margin-bottom: 14px;
	}

	.admin-hint-t {
		font-size: 13px;
		color: #8A6A4A;
		line-height: 1.5;
	}

	.admin-note {
		margin-top: 10px;
		text-align: center;
	}

	.admin-note-t {
		font-size: 12px;
		color: #B4A697;
	}

	/* 紧急 */
	.urgent {
		margin-top: 18px;
		background: #FFF3EF;
		border: 1px dashed #E9A79E;
		border-radius: 16px;
		padding: 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.urgent-l {
		flex: 1;
		min-width: 0;
	}

	.urgent-t {
		display: block;
		font-size: 15px;
		font-weight: 700;
		color: #A8241C;
	}

	.urgent-s {
		display: block;
		font-size: 12px;
		color: #A07A72;
		margin-top: 2px;
		line-height: 1.5;
	}

	.urgent-btn {
		flex: 0 0 auto;
		height: 44px;
		padding: 0 16px;
		border-radius: 22px;
		background: #C8332B;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.urgent-btn-t {
		color: #fff;
		font-size: 15px;
		font-weight: 700;
	}

	.footer {
		display: block;
		margin-top: 22px;
		text-align: center;
		font-size: 11px;
		color: #BFB2A4;
		line-height: 1.6;
	}
</style>
