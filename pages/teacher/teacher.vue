<template>
	<view class="teacher">
		<yl-header title="教师工作台" sub="布置作业 · 看看谁接受了" right="退出" @right="doLogout" />

		<view class="yl-app">
			<!-- 非教师身份提示 -->
			<view v-if="!ready" class="yl-empty" style="padding-top:80px">加载中…</view>
			<view v-else-if="!isTeacher" class="guard">
				<text class="guard-e">🔒</text>
				<text class="guard-t">这里需要教师身份</text>
				<text class="guard-s">请回到登录页，在“我的身份”里选择「老师」后登录。演示账号：laoshi / 123456</text>
				<button class="yl-btn yl-btn-primary yl-btn-block" @click="goLogin">去登录</button>
			</view>

			<view v-else>
				<!-- 老师信息 -->
				<view class="board">
					<view class="board-hd">
						<view class="board-avatar">
							<text class="board-avatar-t">{{ firstChar(user.nickname) }}</text>
						</view>
						<view class="board-info">
							<text class="board-t">{{ user.nickname }}</text>
							<text class="board-s">老师 · 已布置 {{ homeworks.length }} 份作业</text>
						</view>
						<view class="board-btn" @click="openForm">
							<text class="board-btn-t">+ 布置作业</text>
						</view>
					</view>
					<view class="board-stats">
						<view class="bs">
							<text class="bs-n">{{ homeworks.length }}</text>
							<text class="bs-l">布置的作业</text>
						</view>
						<view class="bs-line"></view>
						<view class="bs">
							<text class="bs-n">{{ totalAccepts }}</text>
							<text class="bs-l">累计接受人次</text>
						</view>
						<view class="bs-line"></view>
						<view class="bs">
							<text class="bs-n">{{ acceptRate }}%</text>
							<text class="bs-l">平均接受率</text>
						</view>
					</view>
				</view>

				<!-- 说明 -->
				<view class="tip">
					<text class="tip-t">学生端和老人端只会看到“接受作业”一个按钮，不需要上传照片或写总结；你在下面就能看到谁接受了、什么时候接受的。</text>
				</view>

				<!-- 作业列表 -->
				<view class="yl-card-hd" style="margin-top:16px">
					<text class="yl-h3">我布置的作业</text>
					<text class="yl-sub">{{ homeworks.length }} 份</text>
				</view>

				<view class="list">
					<view class="hw" v-for="t in homeworks" :key="t.id">
						<view class="hw-hd">
							<view class="hw-hd-l">
								<text class="yl-tag" :class="tagClass(t)">{{ audienceName(t) }}</text>
								<text class="hw-p">+{{ t.points }} 积分</text>
							</view>
							<text class="hw-date">{{ t.createdAt }} 布置</text>
						</view>

						<text class="hw-t">{{ t.title }}</text>
						<text class="hw-d">{{ t.desc }}</text>

						<view class="hw-progress">
							<view class="hw-progress-hd">
								<text class="hw-progress-l">已接受 {{ countOf(t.id) }} / {{ expectOf(t) }} 人</text>
								<text class="hw-progress-r">{{ rateOf(t) }}%</text>
							</view>
							<view class="yl-progress">
								<view class="yl-pbar" :style="{ width: rateOf(t) + '%' }"></view>
							</view>
						</view>

						<view class="hw-ft">
							<view class="hw-people" @click="toggle(t.id)">
								<text class="hw-people-t">{{ openId === t.id ? '收起名单 ˄' : '查看接受名单 ˅' }}</text>
							</view>
							<view class="hw-del" @click="remove(t)">
								<text class="hw-del-t">撤回</text>
							</view>
						</view>

						<view v-if="openId === t.id" class="people">
							<view v-if="!peopleOf(t.id).length" class="people-empty">
								<text class="people-empty-t">还没有人接受</text>
							</view>
							<view v-for="a in peopleOf(t.id)" :key="a.id" class="person">
								<view class="person-avatar">
									<text class="person-avatar-t">{{ firstChar(a.nickname) }}</text>
								</view>
								<text class="person-n">{{ a.nickname }}</text>
								<text class="person-s">{{ stageName(a.stage) }}</text>
								<text class="person-t">{{ timeStr(a.at) }}</text>
							</view>
						</view>
					</view>

					<view v-if="!homeworks.length" class="yl-empty">还没有布置作业，点右上角“+ 布置作业”开始</view>
				</view>

				<view class="yl-safe-bottom"></view>
			</view>
		</view>

		<!-- 布置作业 -->
		<view v-if="form" class="mask" @click="form = false">
			<view class="sheet" @click.stop>
				<view class="sheet-hd">
					<text class="sheet-t">布置新作业</text>
					<text class="sheet-x" @click="form = false">✕</text>
				</view>

				<view class="yl-field">
					<text class="yl-label">作业标题</text>
					<input class="yl-input" v-model="f.title" placeholder="例如：和长辈一起看完《AI 换脸》微课"
						maxlength="40" />
				</view>

				<view class="yl-field">
					<text class="yl-label">布置给谁</text>
					<view class="chips">
						<view class="yl-chip" :class="{ 'yl-chip-on': f.target === 'elder' }" @click="f.target = 'elder'">
							长辈端</view>
						<view class="yl-chip" :class="{ 'yl-chip-on': f.target === 'student' }"
							@click="f.target = 'student'">学生端</view>
						<view class="yl-chip" :class="{ 'yl-chip-on': f.target === 'all' }" @click="f.target = 'all'">
							老人 + 学生</view>
					</view>
				</view>

				<view v-if="f.target !== 'elder'" class="yl-field">
					<text class="yl-label">面向学段（可多选）</text>
					<view class="chips">
						<view class="yl-chip" v-for="s in stages" :key="s.key"
							:class="{ 'yl-chip-on': f.stages.indexOf(s.key) > -1 }" @click="toggleStage(s.key)">
							{{ s.emoji }} {{ s.name }}
						</view>
					</view>
					<text class="field-note">{{ f.target === 'all' ? '老人端不受学段限制，不需要选' : '不选则默认全体学生可见' }}</text>
				</view>

				<view class="yl-field">
					<text class="yl-label">作业要求</text>
					<textarea class="yl-textarea" v-model="f.desc" placeholder="写清楚要做什么、和谁一起做、做到什么程度"
						maxlength="200"></textarea>
				</view>

				<view class="row2">
					<view class="yl-field" style="flex:1">
						<text class="yl-label">截止日期</text>
						<input class="yl-input" v-model="f.deadline" placeholder="2026-12-31" />
					</view>
					<view class="yl-field" style="flex:1">
						<text class="yl-label">预计分钟</text>
						<input class="yl-input" type="number" v-model="f.minutes" placeholder="20" />
					</view>
					<view class="yl-field" style="flex:1">
						<text class="yl-label">积分</text>
						<input class="yl-input" type="number" v-model="f.points" placeholder="10" />
					</view>
				</view>

				<view class="sheet-note">
					<text class="sheet-note-t">发布后，老人端和学生端立刻能在“家校联合”里看到，只有“接受作业”按钮。</text>
				</view>

				<view class="sheet-btns">
					<button class="yl-btn yl-btn-ghost" @click="form = false">取消</button>
					<button class="yl-btn yl-btn-primary" @click="publish">发布作业</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import db from '@/utils/store.js'
	import auth from '@/utils/auth.js'
	import fmt from '@/utils/format.js'
	import {
		STAGES
	} from '@/utils/seed.js'

	export default {
		data() {
			return {
				user: null,
				ready: false,
				stages: STAGES,
				homeworks: [],
				accepts: [],
				users: [],
				openId: '',
				tick: 0,
				form: false,
				f: {
					title: '',
					target: 'elder',
					stages: [],
					desc: '',
					deadline: '2026-12-31',
					minutes: 20,
					points: 10
				}
			}
		},
		computed: {
			isTeacher() {
				return !!this.user && this.user.stage === 'teacher'
			},
			totalAccepts() {
				const _ = this.tick
				return this.accepts.length
			},
			acceptRate() {
				const _ = this.tick
				if (!this.homeworks.length) return 0
				let mine = 0
				let expect = 0
				this.homeworks.forEach(t => {
					mine += this.countOf(t.id)
					expect += this.expectOf(t)
				})
				return expect ? Math.round(mine / expect * 100) : 0
			}
		},
		onLoad() {
			const s = auth.requireUser()
			if (!s) return
			this.user = s
			this.ready = true
		},
		onShow() {
			db.trackPage('教师工作台')
			const s = db.getSession()
			if (s && s.role === 'user') {
				this.user = s
				this.ready = true
			}
			this.load()
		},
		methods: {
			load() {
				this.homeworks = db.getHomework({})
				this.accepts = db.getAccepts({})
				this.users = db.getUsers()
				this.tick += 1
			},
			timeStr(t) {
				return fmt.timeStr(t)
			},
			firstChar(s) {
				return (s || '师').slice(0, 1)
			},
			stageName(k) {
				if (k === 'elder') return '长辈'
				if (k === 'teacher') return '老师'
				const f = STAGES.find(x => x.key === k)
				return f ? f.name : '学生'
			},
			audienceName(t) {
				if (t.target === 'elder') return '长辈端'
				if (t.target === 'all') return '老人+学生'
				const list = t.stages || []
				if (!list.length) return '全体学生'
				return list.map(k => (STAGES.find(x => x.key === k) || {}).name || '').filter(Boolean).join('/') + '生'
			},
			tagClass(t) {
				if (t.target === 'elder') return 'yl-tag-red'
				if (t.target === 'all') return 'yl-tag-green'
				return 'yl-tag-blue'
			},
			/** 应接受人数：按已注册用户里符合条件的人数算 */
			expectOf(t) {
				const list = t.stages || []
				return this.users.filter(u => {
					if (t.target === 'elder') return u.stage === 'elder'
					if (t.target === 'all') return u.stage === 'elder' || ['primary', 'junior', 'senior', 'college'].indexOf(u.stage) > -1
					if (u.stage === 'elder' || u.stage === 'teacher') return false
					return !list.length || list.indexOf(u.stage) > -1
				}).length
			},
			countOf(id) {
				return this.accepts.filter(a => a.taskId === id).length
			},
			rateOf(t) {
				const e = this.expectOf(t)
				if (!e) return this.countOf(t.id) ? 100 : 0
				return Math.min(100, Math.round(this.countOf(t.id) / e * 100))
			},
			peopleOf(id) {
				return this.accepts.filter(a => a.taskId === id)
			},
			toggle(id) {
				this.openId = this.openId === id ? '' : id
			},
			openForm() {
				this.f = {
					title: '',
					target: 'elder',
					stages: [],
					desc: '',
					deadline: '2026-12-31',
					minutes: 20,
					points: 10
				}
				this.form = true
			},
			toggleStage(k) {
				const i = this.f.stages.indexOf(k)
				if (i > -1) this.f.stages.splice(i, 1)
				else this.f.stages.push(k)
			},
			publish() {
				const f = this.f
				if (!f.title.trim()) {
					uni.showToast({
						title: '请填写作业标题',
						icon: 'none'
					})
					return
				}
				if (!f.desc.trim()) {
					uni.showToast({
						title: '请写清楚作业要求',
						icon: 'none'
					})
					return
				}
				db.addTask({
					target: f.target,
					stages: f.target === 'elder' ? [] : f.stages.slice(),
					teacher: this.user.nickname || '任课老师',
					teacherTitle: '教师工作台发布',
					title: f.title.trim(),
					desc: f.desc.trim(),
					points: Number(f.points) || 10,
					minutes: Number(f.minutes) || 20,
					deadline: f.deadline
				})
				this.form = false
				this.load()
				uni.showToast({
					title: '已发布，学生端/老人端可见',
					icon: 'none'
				})
			},
			remove(t) {
				uni.showModal({
					title: '撤回作业',
					content: '确定撤回「' + t.title + '」？撤回后老人端和学生端将看不到这条作业。',
					confirmColor: '#C8332B',
					success: (res) => {
						if (!res.confirm) return
						db.deleteTask(t.id)
						this.load()
						uni.showToast({
							title: '已撤回',
							icon: 'none'
						})
					}
				})
			},
			doLogout() {
				uni.showModal({
					title: '退出登录',
					content: '确定退出当前账号？',
					success: (res) => {
						if (res.confirm) auth.logout()
					}
				})
			},
			goLogin() {
				uni.reLaunch({
					url: '/pages/login/login'
				})
			}
		}
	}
</script>

<style>
	.teacher {
		min-height: 100vh;
		background: #F7F3EC;
	}

	.guard {
		margin-top: 60px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		text-align: center;
		padding: 0 24px;
	}

	.guard-e {
		font-size: 40px;
	}

	.guard-t {
		font-size: 18px;
		font-weight: 700;
	}

	.guard-s {
		font-size: 13px;
		color: #8A7C6D;
		line-height: 1.7;
		margin-bottom: 12px;
	}

	/* 老师卡片 */
	.board {
		margin-top: 14px;
		background: linear-gradient(150deg, #1F3A5F, #2E5C8A 60%, #4A87BD);
		border-radius: 20px;
		padding: 16px;
		box-shadow: 0 10px 24px rgba(30, 60, 110, .22);
	}

	.board-hd {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.board-avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(255, 255, 255, .2);
		border: 1px solid rgba(255, 255, 255, .35);
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.board-avatar-t {
		font-size: 18px;
		color: #fff;
		font-weight: 700;
	}

	.board-info {
		flex: 1;
		min-width: 0;
	}

	.board-t {
		display: block;
		font-size: 17px;
		font-weight: 800;
		color: #EAF3FF;
	}

	.board-s {
		display: block;
		font-size: 11px;
		color: rgba(234, 243, 255, .75);
		margin-top: 2px;
	}

	.board-btn {
		flex: 0 0 auto;
		background: #fff;
		border-radius: 999px;
		padding: 9px 14px;
	}

	.board-btn-t {
		font-size: 13px;
		font-weight: 700;
		color: #2E5C8A;
	}

	.board-stats {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, .12);
		border-radius: 14px;
		padding: 12px 6px;
		margin-top: 14px;
	}

	.bs {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.bs-n {
		font-size: 20px;
		font-weight: 800;
		color: #fff;
		font-variant-numeric: tabular-nums;
	}

	.bs-l {
		font-size: 10px;
		color: rgba(255, 255, 255, .75);
	}

	.bs-line {
		width: 1px;
		height: 24px;
		background: rgba(255, 255, 255, .2);
	}

	.tip {
		margin-top: 12px;
		background: #FBF6EE;
		border-left: 3px solid #C08A2E;
		border-radius: 0 10px 10px 0;
		padding: 10px 12px;
	}

	.tip-t {
		font-size: 12px;
		color: #8A6A4A;
		line-height: 1.7;
	}

	/* 作业 */
	.list {
		margin-top: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.hw {
		background: #fff;
		border: 1px solid #EDE6DA;
		border-radius: 16px;
		padding: 14px;
		box-shadow: 0 3px 12px rgba(120, 100, 70, .06);
	}

	.hw-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.hw-hd-l {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.hw-p {
		font-size: 12px;
		color: #C8332B;
		font-weight: 700;
	}

	.hw-date {
		font-size: 11px;
		color: #B4A697;
	}

	.hw-t {
		display: block;
		font-size: 16px;
		font-weight: 700;
		line-height: 1.45;
		margin-top: 10px;
	}

	.hw-d {
		display: block;
		font-size: 13px;
		color: #6C6357;
		line-height: 1.7;
		margin-top: 6px;
	}

	.hw-progress {
		margin-top: 12px;
	}

	.hw-progress-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.hw-progress-l {
		font-size: 12px;
		color: #6C6357;
	}

	.hw-progress-r {
		font-size: 13px;
		font-weight: 700;
		color: #2E5C8A;
	}

	.hw-ft {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 12px;
		padding-top: 10px;
		border-top: 1px dashed #EFE6D8;
	}

	.hw-people-t {
		font-size: 12px;
		color: #2E5C8A;
	}

	.hw-del {
		padding: 4px 10px;
		border-radius: 999px;
		background: #FDF0EE;
	}

	.hw-del-t {
		font-size: 12px;
		color: #C8332B;
	}

	.people {
		margin-top: 10px;
		background: #FAF8F4;
		border-radius: 12px;
		padding: 6px 10px;
	}

	.person {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 0;
		border-bottom: 1px solid #F0EADD;
	}

	.person:last-child {
		border-bottom: none;
	}

	.person-avatar {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #E9F0F8;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.person-avatar-t {
		font-size: 11px;
		color: #2E5C8A;
		font-weight: 700;
	}

	.person-n {
		font-size: 13px;
		font-weight: 600;
	}

	.person-s {
		font-size: 11px;
		color: #A2958A;
	}

	.person-t {
		font-size: 11px;
		color: #B4A697;
		margin-left: auto;
	}

	.people-empty-t {
		font-size: 12px;
		color: #A2958A;
		padding: 8px 0;
		display: block;
	}

	/* 弹层 */
	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(30, 18, 12, .45);
		z-index: 200;
		display: flex;
		align-items: flex-end;
	}

	.sheet {
		width: 100%;
		max-height: 88vh;
		overflow-y: auto;
		background: #FBF4EC;
		border-radius: 22px 22px 0 0;
		padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
		box-sizing: border-box;
		animation: sheetUp .28s ease both;
	}

	@keyframes sheetUp {
		from {
			transform: translateY(30px);
			opacity: .6;
		}

		to {
			transform: none;
			opacity: 1;
		}
	}

	.sheet-hd {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 6px;
	}

	.sheet-t {
		flex: 1;
		font-size: 18px;
		font-weight: 700;
	}

	.sheet-x {
		font-size: 16px;
		color: #A2958A;
		padding: 2px 6px;
	}

	.row2 {
		display: flex;
		gap: 8px;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.field-note {
		display: block;
		font-size: 11px;
		color: #B4A697;
		margin-top: 6px;
		line-height: 1.5;
	}

	.sheet-note {
		background: #EFF9F4;
		border-radius: 12px;
		padding: 10px 12px;
		margin-top: 4px;
	}

	.sheet-note-t {
		font-size: 12px;
		color: #2C6B54;
		line-height: 1.6;
	}

	.sheet-btns {
		display: flex;
		gap: 10px;
		margin-top: 16px;
	}

	.sheet-btns .yl-btn {
		flex: 1;
	}
</style>
