<template>
	<view class="mine">
		<yl-header title="我的" back home="/pages/index/index" right="退出" @right="doLogout" />

		<view class="yl-app yl-narrow">
			<!-- 个人信息 -->
			<view class="profile">
				<view class="avatar">
					<text class="avatar-t">{{ initial }}</text>
				</view>
				<view class="profile-info">
					<text class="profile-n">{{ user.nickname }}</text>
					<view class="profile-row">
						<text class="profile-badge">{{ stageName }}</text>
						<text class="profile-s">账号 {{ user.username }}</text>
					</view>
				</view>
				<view class="profile-edit" @click="changeStage">
					<text class="profile-edit-t">改身份</text>
				</view>
			</view>

			<!-- 数据 -->
			<view class="stats">
				<view class="st">
					<text class="st-n">{{ learnMinutes }}</text>
					<text class="st-l">学习分钟</text>
				</view>
				<view class="st-line"></view>
				<view class="st">
					<text class="st-n">{{ doneCount }}</text>
					<text class="st-l">学完视频</text>
				</view>
				<view class="st-line"></view>
				<view class="st">
					<text class="st-n">{{ bestScore }}</text>
					<text class="st-l">答题最高分</text>
				</view>
				<view class="st-line"></view>
				<view class="st">
					<text class="st-n">{{ points }}</text>
					<text class="st-l">积分</text>
				</view>
			</view>

			<!-- 徽章 -->
			<view class="yl-card yl-section">
				<view class="yl-card-hd">
					<text class="yl-h3">我的徽章</text>
					<text class="yl-sub">已获得 {{ badgeCount }}/{{ badges.length }}</text>
				</view>
				<view class="badges">
					<view class="badge" v-for="b in badges" :key="b.key" :class="{ 'badge-off': !b.on }">
						<text class="badge-e">{{ b.emoji }}</text>
						<text class="badge-n">{{ b.name }}</text>
						<text class="badge-d">{{ b.desc }}</text>
					</view>
				</view>
			</view>

			<!-- 证书 -->
			<view class="yl-card yl-section">
				<view class="yl-card-hd">
					<text class="yl-h3">我的证书</text>
					<text class="yl-sub" @click="goQuiz">去考证 ›</text>
				</view>
				<view v-if="!passRecords.length" class="empty-line">
					<text class="empty-line-t">还没有证书，答对 8 题以上即可领取</text>
				</view>
				<view class="cert-item" v-for="r in passRecords" :key="r.id" @click="goCert(r.certNo)">
					<view class="cert-ico">
						<text class="cert-ico-t">证</text>
					</view>
					<view class="cert-info">
						<text class="cert-t">反诈学习结业证书 · {{ r.score }} 分</text>
						<text class="cert-s">{{ dateStr(r.at) }} · {{ r.certNo }}</text>
					</view>
					<text class="cert-arrow">›</text>
				</view>
			</view>

			<!-- 作业记录 -->
			<view class="yl-card yl-section">
				<view class="yl-card-hd">
					<text class="yl-h3">我接受的作业</text>
					<text class="yl-sub" @click="goFamily">去作业中心 ›</text>
				</view>
				<view v-if="!accepts.length" class="empty-line">
					<text class="empty-line-t">还没有接受过作业</text>
				</view>
				<view class="sub" v-for="s in accepts" :key="s.id">
					<view class="sub-l">
						<text class="sub-t">{{ s.taskTitle }}</text>
						<text class="sub-s">{{ s.teacher }} · {{ timeStr(s.at) }}</text>
					</view>
					<text class="sub-st st-approved">已接受</text>
				</view>
			</view>

			<!-- 学习记录 -->
			<view class="yl-card yl-section">
				<view class="yl-card-hd">
					<text class="yl-h3">最近学习</text>
					<text class="yl-sub" @click="goLearn">全部 ›</text>
				</view>
				<view v-if="!recent.length" class="empty-line">
					<text class="empty-line-t">还没有学习记录，去学习中心看看吧</text>
				</view>
				<view class="rv" v-for="v in recent" :key="v.id" @click="goDetail(v.id)">
					<view class="rv-l">
						<text class="rv-t yl-ellipsis">{{ v.title }}</text>
						<view class="yl-progress" style="margin-top:6px">
							<view class="yl-pbar" :style="{ width: v.pct + '%' }"></view>
						</view>
					</view>
					<text class="rv-p">{{ v.pct }}%</text>
				</view>
			</view>

			<view class="logout" @click="doLogout">
				<text class="logout-t">退出登录</text>
			</view>

			<view class="yl-safe-bottom"></view>
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
				user: { nickname: '', username: '', stage: 'elder' },
				progress: {},
				records: [],
				accepts: [],
				points: 0
			}
		},
		computed: {
			initial() {
				return (this.user.nickname || '访').slice(0, 1)
			},
			stageName() {
				const s = this.user.stage
				if (s === 'elder') return '长辈'
				if (s === 'teacher') return '教师'
				const f = STAGES.find(x => x.key === s)
				return f ? f.name + '生' : '长辈'
			},
			learnMinutes() {
				let s = 0
				Object.keys(this.progress).forEach(k => {
					s += this.progress[k].seconds || 0
				})
				return Math.round(s / 60)
			},
			doneCount() {
				let n = 0
				Object.keys(this.progress).forEach(k => {
					if (this.progress[k].done) n += 1
				})
				return n
			},
			bestScore() {
				return this.records.reduce((m, r) => Math.max(m, r.score), 0)
			},
			passRecords() {
				return this.records.filter(r => r.pass)
			},
			recent() {
				const vids = db.getVideos()
				return vids.map(v => {
					const p = this.progress[v.id]
					if (!p) return null
					const pct = p.done ? 100 : Math.min(99, Math.round((p.seconds || 0) / v.duration * 100))
					return {
						id: v.id,
						title: v.title,
						pct: pct,
						at: p.doneAt || 0
					}
				}).filter(Boolean).sort((a, b) => b.at - a.at).slice(0, 4)
			},
			badges() {
				const ai = db.getStats()
				return [{
						key: 'first',
						emoji: '🌱',
						name: '迈出第一步',
						desc: '学完 1 个视频',
						on: this.doneCount >= 1
					},
					{
						key: 'quiz',
						emoji: '🏅',
						name: '反诈达人',
						desc: '答题 80 分以上',
						on: this.bestScore >= 80
					},
					{
						key: 'family',
						emoji: '🤝',
						name: '家庭宣传员',
						desc: '接受 1 份反诈作业',
						on: this.accepts.length > 0
					},
					{
						key: 'ai',
						emoji: '🧐',
						name: 'AI 慧眼',
						desc: '累计辨伪 5 次',
						on: (ai.aiTimes || 0) >= 5
					}
				]
			},
			badgeCount() {
				return this.badges.filter(b => b.on).length
			}
		},
		onLoad() {
			const s = auth.requireUser()
			if (!s) return
			this.user = s
			this.load()
		},
		onShow() {
			const s = db.getSession()
			if (s && s.role === 'user') this.user = s
			db.trackPage('我的')
			this.load()
		},
		methods: {
			dateStr(t) {
				return fmt.dateStr(t)
			},
			timeStr(t) {
				return fmt.timeStr(t)
			},
			load() {
				if (!this.user.username) return
				this.progress = db.getProgress(this.user.username)
				this.records = db.getRecords(this.user.username)
				this.accepts = db.getAccepts({
					username: this.user.username
				})
				this.points = db.getAcceptedPoints(this.user.username)
			},
			changeStage() {
				const items = ['我是长辈', '小学生', '初中生', '高中生', '大学生', '教师']
				const keys = ['elder', 'primary', 'junior', 'senior', 'college', 'teacher']
				uni.showActionSheet({
					itemList: items,
					success: (res) => {
						const key = keys[res.tapIndex]
						db.updateUserStage(this.user.username, key)
						this.user = db.getSession()
						uni.showToast({
							title: '已切换为' + items[res.tapIndex],
							icon: 'none'
						})
					}
				})
			},
			goQuiz() {
				uni.navigateTo({
					url: '/pages/quiz/quiz'
				})
			},
			goCert(no) {
				uni.navigateTo({
					url: '/pages/quiz/cert?no=' + no
				})
			},
			goFamily() {
				uni.navigateTo({
					url: '/pages/family/family'
				})
			},
			goLearn() {
				uni.navigateTo({
					url: '/pages/learn/learn'
				})
			},
			goDetail(id) {
				uni.navigateTo({
					url: '/pages/learn/detail?id=' + id
				})
			},
			doLogout() {
				uni.showModal({
					title: '退出登录',
					content: '确定要退出当前账号吗？本机学习记录会保留。',
					confirmText: '退出',
					confirmColor: '#C8332B',
					success: (res) => {
						if (res.confirm) auth.logout()
					}
				})
			}
		}
	}
</script>

<style>
	.mine {
		min-height: 100vh;
		background: #FBF4EC;
	}

	/* 个人信息 */
	.profile {
		margin-top: 14px;
		display: flex;
		align-items: center;
		gap: 14px;
		background: linear-gradient(150deg, #2B1A12, #4A2A18);
		border-radius: 20px;
		padding: 18px;
		box-shadow: 0 8px 22px rgba(60, 30, 20, .2);
	}

	.avatar {
		width: 58px;
		height: 58px;
		border-radius: 50%;
		background: linear-gradient(140deg, #E8622C, #C8332B);
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		border: 2px solid rgba(255, 255, 255, .35);
	}

	.avatar-t {
		font-size: 24px;
		font-weight: 700;
		color: #fff;
	}

	.profile-info {
		flex: 1;
		min-width: 0;
	}

	.profile-n {
		display: block;
		font-size: 20px;
		font-weight: 700;
		color: #FFE9D2;
	}

	.profile-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 5px;
	}

	.profile-badge {
		font-size: 11px;
		color: #FFC98C;
		background: rgba(255, 201, 140, .15);
		border-radius: 6px;
		padding: 2px 8px;
	}

	.profile-s {
		font-size: 11px;
		color: #A98C74;
	}

	.profile-edit {
		flex: 0 0 auto;
		border: 1px solid rgba(255, 255, 255, .28);
		border-radius: 999px;
		padding: 6px 12px;
	}

	.profile-edit-t {
		font-size: 12px;
		color: #FFE9D2;
	}

	/* 数据 */
	.stats {
		display: flex;
		align-items: center;
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 16px;
		padding: 14px 6px;
		margin-top: 12px;
	}

	.st {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.st-n {
		font-size: 19px;
		font-weight: 800;
		color: #C8332B;
		font-variant-numeric: tabular-nums;
	}

	.st-l {
		font-size: 10px;
		color: #A2958A;
	}

	.st-line {
		width: 1px;
		height: 24px;
		background: #F3E7D8;
	}

	/* 徽章 */
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.badge {
		flex: 1 1 130px;
		background: linear-gradient(160deg, #FFF8EE, #FFF1E0);
		border: 1px solid #F3DFC6;
		border-radius: 14px;
		padding: 12px 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.badge-off {
		background: #F8F3EC;
		border-color: #EDE3D6;
		opacity: .55;
	}

	.badge-e {
		font-size: 24px;
	}

	.badge-n {
		font-size: 13px;
		font-weight: 700;
		color: #4A4038;
	}

	.badge-d {
		font-size: 10px;
		color: #A2958A;
		text-align: center;
	}

	/* 通用列表 */
	.empty-line {
		padding: 14px 0;
	}

	.empty-line-t {
		font-size: 12px;
		color: #B4A697;
	}

	.cert-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 0;
		border-top: 1px solid #F5EADB;
	}

	.cert-ico {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: #FDF1E2;
		border: 1px solid #EFD9B8;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.cert-ico-t {
		font-size: 15px;
		font-weight: 700;
		color: #B3823C;
	}

	.cert-info {
		flex: 1;
		min-width: 0;
	}

	.cert-t {
		display: block;
		font-size: 14px;
		font-weight: 600;
	}

	.cert-s {
		display: block;
		font-size: 11px;
		color: #A2958A;
		margin-top: 2px;
	}

	.cert-arrow {
		font-size: 18px;
		color: #D6C4B0;
	}

	.sub {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 0;
		border-top: 1px solid #F5EADB;
		gap: 10px;
	}

	.sub-l {
		flex: 1;
		min-width: 0;
	}

	.sub-t {
		display: block;
		font-size: 14px;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sub-s {
		display: block;
		font-size: 11px;
		color: #A2958A;
		margin-top: 2px;
	}

	.sub-st {
		font-size: 12px;
		flex: 0 0 auto;
	}

	.st-approved {
		color: #1D7F5F;
		font-weight: 700;
	}

	.st-pending {
		color: #C08A2E;
		font-weight: 700;
	}

	.st-rejected {
		color: #C8332B;
		font-weight: 700;
	}

	.rv {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 0;
		border-top: 1px solid #F5EADB;
	}

	.rv-l {
		flex: 1;
		min-width: 0;
	}

	.rv-t {
		font-size: 14px;
		color: #4A4038;
	}

	.rv-p {
		font-size: 12px;
		color: #C8332B;
		font-weight: 600;
		flex: 0 0 auto;
	}

	.logout {
		margin-top: 20px;
		height: 50px;
		border-radius: 25px;
		background: #fff;
		border: 1px solid #EFE0CE;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logout-t {
		font-size: 15px;
		color: #8A7C6D;
	}
</style>
