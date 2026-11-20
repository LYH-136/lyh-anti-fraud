<template>
	<view class="family">
		<yl-header title="家校联合" sub="老师布置的作业，看一遍点接受" back right="我的" @right="goMine" />

		<view class="yl-app">
			<!-- 数据 -->
			<view class="board">
				<view class="board-top">
					<view class="board-top-l">
						<text class="board-t">反诈宣传 · 家校同行</text>
						<text class="board-s">{{ roleTip }}</text>
					</view>
					<view v-if="isTeacher" class="board-badge" @click="goTeacher">
						<text class="board-badge-t">教师工作台 ›</text>
					</view>
				</view>
				<view class="board-stats">
					<view class="bs">
						<text class="bs-n">{{ joinCount }}</text>
						<text class="bs-l">累计参与人数</text>
					</view>
					<view class="bs-line"></view>
					<view class="bs">
						<text class="bs-n">{{ acceptCount }}</text>
						<text class="bs-l">作业接受次数</text>
					</view>
					<view class="bs-line"></view>
					<view class="bs">
						<text class="bs-n">{{ myPoints }}</text>
						<text class="bs-l">我的积分</text>
					</view>
				</view>
			</view>

			<!-- 当前身份 -->
			<view class="ident">
				<text class="ident-e">{{ roleEmoji }}</text>
				<view class="ident-body">
					<text class="ident-t">{{ roleName }}</text>
					<text class="ident-s">{{ identTip }}</text>
				</view>
			</view>

			<!-- 筛选 -->
			<view class="filters">
				<view class="filter" v-for="f in filters" :key="f.key" :class="{ 'filter-on': tab === f.key }"
					@click="tab = f.key">
					<text class="filter-t">{{ f.name }}</text>
					<text v-if="f.key === 'todo' && todoCount" class="filter-n">{{ todoCount }}</text>
				</view>
			</view>

			<!-- 作业列表 -->
			<view class="list">
				<view class="hw" v-for="t in list" :key="t.id" :class="{ 'hw-done': !!acceptOf(t.id) }">
					<view class="hw-hd">
						<view class="hw-hd-l">
							<text class="yl-tag" :class="tagClass(t)">{{ audienceName(t) }}</text>
							<text class="hw-p">+{{ t.points }} 积分</text>
						</view>
						<view v-if="acceptOf(t.id)" class="hw-ok">
							<text class="hw-ok-t">✓ 已接受</text>
						</view>
					</view>

					<text class="hw-t">{{ t.title }}</text>
					<text class="hw-d">{{ t.desc }}</text>

					<view class="hw-teacher">
						<view class="hw-avatar">
							<text class="hw-avatar-t">{{ firstChar(t.teacher) }}</text>
						</view>
						<text class="hw-teacher-t">{{ t.teacher }}</text>
						<text v-if="t.teacherTitle" class="hw-teacher-s">{{ t.teacherTitle }}</text>
						<text class="hw-date">{{ t.createdAt }} 布置</text>
					</view>

					<view class="hw-ft">
						<text class="hw-meta">建议 {{ t.minutes }} 分钟<text v-if="t.deadline"> · 截止 {{ t.deadline }}</text></text>

						<view v-if="isTeacher" class="hw-btn hw-btn-done">
							<text class="hw-btn-t2">老师已布置</text>
						</view>
						<view v-else-if="!acceptOf(t.id)" class="hw-btn" @click="accept(t)">
							<text class="hw-btn-t">接受作业</text>
						</view>
						<view v-else class="hw-btn hw-btn-done">
							<text class="hw-btn-t2">{{ timeStr(acceptOf(t.id).at) }} 接受</text>
						</view>
					</view>
				</view>

				<view v-if="!list.length" class="yl-empty">{{ emptyText }}</view>
			</view>

			<view class="note">
				<text class="note-t">本页只需点“接受作业”，不用上传照片、不用写总结。完成情况由老师或家人在线下确认。</text>
			</view>

			<view class="yl-safe-bottom"></view>
		</view>

		<yl-sos />
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
				tab: 'all',
				tick: 0,
				filters: [{
					key: 'all',
					name: '全部作业'
				}, {
					key: 'todo',
					name: '待接受'
				}, {
					key: 'done',
					name: '已接受'
				}]
			}
		},
		computed: {
			isTeacher() {
				return !!this.user && this.user.stage === 'teacher'
			},
			audience() {
				if (!this.user) return 'elder'
				return this.user.stage === 'elder' ? 'elder' : 'student'
			},
			myStage() {
				const s = this.user ? this.user.stage : 'elder'
				return ['primary', 'junior', 'senior', 'college'].indexOf(s) > -1 ? s : ''
			},
			roleEmoji() {
				if (this.isTeacher) return '🧑‍🏫'
				if (this.audience === 'elder') return '👴'
				const f = STAGES.find(x => x.key === this.myStage)
				return f ? f.emoji : '🎒'
			},
			roleName() {
				if (this.isTeacher) return '老师 · ' + (this.user.nickname || '')
				if (this.audience === 'elder') return '长辈模式'
				const f = STAGES.find(x => x.key === this.myStage)
				return (f ? f.name : '学生') + ' · ' + (this.user.nickname || '')
			},
			roleTip() {
				if (this.isTeacher) return '这里可以看到全校作业的接受情况'
				return this.audience === 'elder' ? '老人端：看一遍，点接受即可' : '学生端：看完点接受，带回家和长辈一起做'
			},
			identTip() {
				if (this.isTeacher) return '老师不需要接受作业，去“教师工作台”布置作业、查看谁接受了'
				if (this.audience === 'elder') return '下面的作业都不用提交材料，点“接受作业”就算完成'
				return '下面只显示布置给你这个学段的作业，点“接受作业”即可'
			},
			all() {
				// tick 变化会触发重算（localStorage 不是响应式数据）
				const _ = this.tick
				return db.getHomework({
					audience: this.audience,
					stage: this.myStage
				})
			},
			myAccepts() {
				const _ = this.tick
				return db.getAccepts({
					username: this.user ? this.user.username : ''
				})
			},
			list() {
				return this.all.filter(t => {
					const done = !!this.acceptOf(t.id)
					if (this.tab === 'todo') return !done
					if (this.tab === 'done') return done
					return true
				})
			},
			todoCount() {
				return this.all.filter(t => !this.acceptOf(t.id)).length
			},
			myPoints() {
				const _ = this.tick
				return db.getAcceptedPoints(this.user ? this.user.username : '')
			},
			joinCount() {
				const _ = this.tick
				const stats = db.getStats()
				return (stats.familyUsers || []).length
			},
			acceptCount() {
				const _ = this.tick
				return db.getAccepts({}).length
			},
			emptyText() {
				if (this.tab === 'todo') return '这个学段的作业都接受了，等老师布置新的吧'
				if (this.tab === 'done') return '还没有接受过作业，去“全部作业”里看看'
				return '这个学段暂时没有作业，等老师布置'
			}
		},
		onLoad() {
			const s = auth.requireUser()
			if (!s) return
			this.user = s
		},
		onShow() {
			db.trackPage('家校联合')
			const s = db.getSession()
			if (s && s.role === 'user') this.user = s
			this.tick += 1
		},
		methods: {
			timeStr(t) {
				return fmt.timeStr(t)
			},
			firstChar(s) {
				return (s || '老').slice(0, 1)
			},
			acceptOf(taskId) {
				return this.myAccepts.find(a => a.taskId === taskId) || null
			},
			audienceName(t) {
				if (t.target === 'elder') return '长辈专属'
				if (t.target === 'all') return '全家一起'
				const list = t.stages || []
				if (!list.length) return '全体学生'
				return list.map(k => (STAGES.find(x => x.key === k) || {}).name || '').filter(Boolean).join('/') + '生'
			},
			tagClass(t) {
				if (t.target === 'elder') return 'yl-tag-red'
				if (t.target === 'all') return 'yl-tag-green'
				return 'yl-tag-blue'
			},
			accept(t) {
				if (!this.user) return
				const r = db.acceptHomework(t.id, this.user)
				if (!r.ok) {
					uni.showToast({
						title: r.msg,
						icon: 'none'
					})
					return
				}
				this.tick += 1
				uni.showToast({
					title: '已接受，记得和长辈一起完成',
					icon: 'none'
				})
			},
			goMine() {
				uni.navigateTo({
					url: '/pages/mine/mine'
				})
			},
			goTeacher() {
				uni.navigateTo({
					url: '/pages/teacher/teacher'
				})
			}
		}
	}
</script>

<style>
	.family {
		min-height: 100vh;
		background: #FBF4EC;
	}

	/* 数据 */
	.board {
		margin-top: 14px;
		background: linear-gradient(150deg, #1D5E4A, #2A8A6A 60%, #47B189);
		border-radius: 20px;
		padding: 18px;
		box-shadow: 0 10px 24px rgba(30, 110, 80, .22);
	}

	.board-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 16px;
	}

	.board-top-l {
		flex: 1;
		min-width: 0;
	}

	.board-t {
		display: block;
		font-size: 18px;
		font-weight: 800;
		color: #EAFFF6;
	}

	.board-s {
		display: block;
		font-size: 12px;
		color: rgba(234, 255, 246, .75);
		margin-top: 3px;
	}

	.board-badge {
		flex: 0 0 auto;
		background: rgba(255, 255, 255, .18);
		border: 1px solid rgba(255, 255, 255, .3);
		border-radius: 999px;
		padding: 6px 12px;
	}

	.board-badge-t {
		font-size: 12px;
		color: #fff;
	}

	.board-stats {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, .12);
		border-radius: 14px;
		padding: 12px 6px;
	}

	.bs {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.bs-n {
		font-size: 22px;
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
		height: 26px;
		background: rgba(255, 255, 255, .2);
	}

	/* 身份 */
	.ident {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 12px;
		background: #EFF9F4;
		border: 1px solid #CFEBDD;
		border-radius: 14px;
		padding: 10px 12px;
	}

	.ident-e {
		font-size: 20px;
		flex: 0 0 auto;
	}

	.ident-body {
		flex: 1;
		min-width: 0;
	}

	.ident-t {
		display: block;
		font-size: 14px;
		font-weight: 700;
		color: #22624C;
	}

	.ident-s {
		display: block;
		font-size: 11px;
		color: #4E8571;
		line-height: 1.5;
		margin-top: 2px;
	}

	/* 筛选 */
	.filters {
		display: flex;
		gap: 8px;
		margin-top: 14px;
	}

	.filter {
		flex: 1;
		height: 40px;
		border-radius: 12px;
		background: #fff;
		border: 1px solid #EFE0CE;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.filter-t {
		font-size: 13px;
		color: #6C5C4C;
	}

	.filter-on {
		background: #2A8A6A;
		border-color: #2A8A6A;
	}

	.filter-on .filter-t {
		color: #fff;
		font-weight: 700;
	}

	.filter-n {
		min-width: 16px;
		height: 16px;
		line-height: 16px;
		text-align: center;
		border-radius: 8px;
		background: #C8332B;
		color: #fff;
		font-size: 10px;
		padding: 0 4px;
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
		border: 1px solid #F2E4D4;
		border-radius: 16px;
		padding: 14px;
		box-shadow: 0 3px 12px rgba(160, 120, 80, .06);
	}

	.hw-done {
		background: #FCFEFC;
		border-color: #CFEBDD;
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

	.hw-ok {
		background: #E7F7EE;
		border-radius: 999px;
		padding: 3px 10px;
	}

	.hw-ok-t {
		font-size: 11px;
		color: #1D7F5F;
		font-weight: 700;
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

	.hw-teacher {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px dashed #F0E2D2;
	}

	.hw-avatar {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #EFF4FB;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.hw-avatar-t {
		font-size: 11px;
		color: #3A6EA5;
		font-weight: 700;
	}

	.hw-teacher-t {
		font-size: 12px;
		color: #4A4038;
		font-weight: 600;
	}

	.hw-teacher-s {
		font-size: 11px;
		color: #A2958A;
		font-weight: 400;
	}

	.hw-date {
		font-size: 11px;
		color: #B4A697;
		margin-left: auto;
	}

	.hw-ft {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 12px;
		gap: 10px;
	}

	.hw-meta {
		font-size: 11px;
		color: #B4A697;
		flex: 1;
		min-width: 0;
	}

	.hw-btn {
		flex: 0 0 auto;
		height: 38px;
		padding: 0 18px;
		border-radius: 19px;
		background: #C8332B;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hw-btn-t {
		font-size: 14px;
		font-weight: 700;
		color: #fff;
	}

	.hw-btn-done {
		background: #F4EDE3;
	}

	.hw-btn-t2 {
		font-size: 12px;
		color: #8A7C6D;
	}

	.note {
		margin-top: 16px;
		background: #FBF6EE;
		border-radius: 12px;
		padding: 12px;
	}

	.note-t {
		font-size: 12px;
		color: #8A6A4A;
		line-height: 1.7;
	}
</style>
