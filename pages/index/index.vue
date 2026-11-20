<template>
	<view class="home">
		<yl-header :title="brand" sub="老年人反诈学堂" right="我的" @right="goMine" />

		<view class="yl-app">
			<!-- 欢迎 -->
			<view class="hello">
				<view class="hello-l">
					<text class="hello-t">{{ greeting }}，{{ user.nickname }}</text>
					<text class="hello-s">{{ today }} · 今天也别忘了多留个心眼</text>
				</view>
				<view class="hello-badge" @click="goMine">
					<text class="hello-badge-t">{{ stageName }}</text>
				</view>
			</view>

			<!-- 宣传视频（打开即可见） -->
			<view class="hero">
				<view class="hero-video-box">
					<video v-if="heroVideo" class="hero-video" :src="heroVideo.src" :poster="heroVideo.poster || ''"
						:autoplay="true" :muted="true" :controls="true" object-fit="cover" @play="onHeroPlay"></video>
					<view v-else class="hero-empty">
						<text class="hero-empty-e">🎬</text>
						<text class="hero-empty-t">宣传视频位待上传</text>
						<text class="hero-empty-s">管理员可在后台上传反诈宣传片</text>
					</view>
					<view class="hero-mask"></view>
					<view class="hero-label">
						<text class="hero-label-tag">反诈宣传片</text>
						<text class="hero-label-t">{{ heroVideo ? heroVideo.title : '银铃守护 · 守护每一分养老钱' }}</text>
					</view>
				</view>
			</view>

			<!-- 学习数据 -->
			<view class="stats">
				<view class="stat">
					<text class="stat-n">{{ learnMinutes }}</text>
					<text class="stat-l">累计学习（分钟）</text>
				</view>
				<view class="stat-line"></view>
				<view class="stat">
					<text class="stat-n">{{ doneCount }}/{{ videoCount }}</text>
					<text class="stat-l">已学完视频</text>
				</view>
				<view class="stat-line"></view>
				<view class="stat">
					<text class="stat-n">{{ points }}</text>
					<text class="stat-l">反诈积分</text>
				</view>
			</view>

			<!-- 报警快捷 -->
			<view class="alarm yl-section">
				<view class="alarm-hd">
					<view class="alarm-hd-l">
						<text class="alarm-title">紧急情况 · 一键报警</text>
						<text class="alarm-sub">手机点击直接拨号，不用记号码</text>
					</view>
					<text class="alarm-more" @click="goReport">全部 ›</text>
				</view>
				<view class="alarm-main" @click="call('110')">
					<view class="alarm-main-l">
						<text class="alarm-main-n">110</text>
						<text class="alarm-main-d">已经转账、正在被骗，立刻拨打</text>
					</view>
					<view class="alarm-main-btn">
						<text class="alarm-main-btn-t">拨打</text>
					</view>
				</view>
				<view class="alarm-row">
					<view class="alarm-item" v-for="p in quickLines" :key="p.phone" @click="call(p.phone)">
						<text class="alarm-item-n">{{ p.phone }}</text>
						<text class="alarm-item-d">{{ p.name }}</text>
					</view>
				</view>
			</view>

			<!-- 作业提醒（长辈 / 学生） -->
			<view v-if="!isTeacher && todoCount > 0" class="hw-tip yl-section" @click="goFamily">
				<view class="hw-tip-l">
					<text class="hw-tip-e">📋</text>
					<view class="hw-tip-body">
						<text class="hw-tip-t">你有 {{ todoCount }} 份新作业</text>
						<text class="hw-tip-s">老师布置的反诈作业，点进去看完点“接受”即可</text>
					</view>
				</view>
				<text class="hw-tip-arrow">›</text>
			</view>

			<!-- 教师入口 -->
			<view v-if="isTeacher" class="teacher-tip yl-section" @click="goTeacher">
				<view class="teacher-tip-l">
					<text class="teacher-tip-e">🧑‍🏫</text>
					<view class="teacher-tip-body">
						<text class="teacher-tip-t">进入教师工作台</text>
						<text class="teacher-tip-s">布置作业，看看班里谁接受了</text>
					</view>
				</view>
				<text class="teacher-tip-arrow">›</text>
			</view>

			<!-- 六大板块 -->
			<view class="yl-section">
				<view class="yl-card-hd">
					<text class="yl-h2">开始学习</text>
					<text class="yl-sub">挑一个你最需要的</text>
				</view>
				<view class="entries">
					<view class="entry" v-for="e in entries" :key="e.key" @click="goEntry(e)">
						<view class="entry-ico" :style="{ background: e.bg }">
							<text class="entry-emoji">{{ e.emoji }}</text>
						</view>
						<view class="entry-txt">
							<text class="entry-t">{{ e.title }}</text>
							<text class="entry-s">{{ e.sub }}</text>
						</view>
						<text class="entry-arrow">›</text>
					</view>
				</view>
			</view>

			<!-- 学习进度 -->
			<view class="yl-card yl-section">
				<view class="yl-card-hd">
					<text class="yl-h3">我的学习进度</text>
					<text class="yl-sub" @click="goLearn">去学习 ›</text>
				</view>
				<view class="prog-row">
					<text class="prog-l">已学完 {{ doneCount }} 个视频，共 {{ videoCount }} 个</text>
					<text class="prog-r">{{ progressPct }}%</text>
				</view>
				<view class="yl-progress">
					<view class="yl-pbar" :style="{ width: progressPct + '%' }"></view>
				</view>
				<view class="yl-divider"></view>
				<view class="tip-box">
					<text class="tip-ico">🔔</text>
					<text class="tip-t">{{ tips[tipIndex] }}</text>
				</view>
			</view>

			<!-- 最新判例 -->
			<view class="yl-section">
				<view class="yl-card-hd">
					<text class="yl-h2">最新判例与预警</text>
					<text class="yl-sub" @click="goNews">更多 ›</text>
				</view>
				<view class="news" v-for="n in latestNews" :key="n.id" @click="goNews">
					<view class="news-dot" :class="'dot-' + n.type"></view>
					<view class="news-body">
						<text class="news-t yl-clamp2">{{ n.title }}</text>
						<view class="news-meta">
							<text class="yl-tag" :class="typeClass(n.type)">{{ typeName(n.type) }}</text>
							<text class="news-src">{{ n.source }} · {{ n.date }}</text>
						</view>
					</view>
				</view>
			</view>

			<view class="bottom-note">
				<text class="bottom-note-t">银铃守护 · 公益反诈学习平台</text>
			</view>
		</view>

		<yl-sos />
	</view>
</template>

<script>
	import db from '@/utils/store.js'
	import auth from '@/utils/auth.js'
	import {
		POLICE_LINES,
		TIPS,
		STAGES
	} from '@/utils/seed.js'

	export default {
		data() {
			return {
				brand: '银铃守护',
				user: { nickname: '访客', stage: 'elder' },
				today: '',
				greeting: '您好',
				heroVideo: null,
				tipIndex: 0,
				tips: TIPS,
				quickLines: POLICE_LINES.filter(p => p.phone !== '110'),
				entries: [{
						key: 'learn',
						title: '反诈学习中心',
						sub: '刷单 / 游戏充值 / 返现 / 陪聊 / AI换脸',
						emoji: '📚',
						bg: 'linear-gradient(135deg,#FFE3D2,#FFC9A8)',
						url: '/pages/learn/learn'
					},
					{
						key: 'ai',
						title: 'AI 辨伪实验室',
						sub: '一段视频、一句语音，判断是真是假',
						emoji: '🎭',
						bg: 'linear-gradient(135deg,#F6D7DC,#EFB4BE)',
						url: '/pages/aicheck/aicheck'
					},
					{
						key: 'quiz',
						title: '反诈答题',
						sub: '10 道题测一测，80 分领证书',
						emoji: '📝',
						bg: 'linear-gradient(135deg,#D9EAFB,#B6D4F2)',
						url: '/pages/quiz/quiz'
					},
					{
						key: 'family',
						title: '作业中心',
						sub: '老师布置的作业，看一遍点“接受”',
						emoji: '🤝',
						bg: 'linear-gradient(135deg,#DFF2E7,#B6E3CB)',
						url: '/pages/family/family'
					},
					{
						key: 'news',
						title: '判例与新闻',
						sub: '真实的诈骗判例和最新预警',
						emoji: '📰',
						bg: 'linear-gradient(135deg,#FAF0D3,#F2DCA4)',
						url: '/pages/news/news'
					},
					{
						key: 'report',
						title: '一键报警',
						sub: '110 / 96110 / 银行挂失',
						emoji: '🚨',
						bg: 'linear-gradient(135deg,#FBD9D6,#F3B0AA)',
						url: '/pages/report/report'
					}
				],
				progress: {},
				videoCount: 0,
				doneCount: 0,
				learnSeconds: 0,
				points: 0,
				todoCount: 0,
				latestNews: []
			}
		},
		computed: {
			learnMinutes() {
				return Math.round(this.learnSeconds / 60)
			},
			progressPct() {
				if (!this.videoCount) return 0
				return Math.round(this.doneCount / this.videoCount * 100)
			},
			stageName() {
				const s = this.user.stage
				if (s === 'elder') return '长辈模式'
				if (s === 'teacher') return '教师'
				const f = STAGES.find(x => x.key === s)
				return f ? f.name : '长辈模式'
			},
			isTeacher() {
				return this.user.stage === 'teacher'
			}
		},
		onLoad() {
			const s = auth.requireUser()
			if (!s) return
			this.user = s
			this.buildToday()
			this.loadData()
		},
		onShow() {
			const s = db.getSession()
			if (s && s.role === 'user') this.user = s
			db.trackPage('首页')
			this.loadData()
			this.tipIndex = Math.floor(Math.random() * this.tips.length)
		},
		methods: {
			buildToday() {
				const d = new Date()
				const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
				this.today = (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 星期' + week
				const h = d.getHours()
				this.greeting = h < 6 ? '夜深了' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好'
			},
			loadData() {
				const list = db.getVideos()
				this.videoCount = list.length

				const st = db.getSettings()
				this.heroVideo = db.getVideo(st.heroVideoId) || list[0] || null

				const p = db.getProgress(this.user.username)
				this.progress = p
				let seconds = 0
				let done = 0
				Object.keys(p).forEach(k => {
					seconds += p[k].seconds || 0
					if (p[k].done) done += 1
				})
				this.learnSeconds = seconds
				this.doneCount = done

				this.points = db.getAcceptedPoints(this.user.username)

				// 待接受的作业数量
				const stage = ['primary', 'junior', 'senior', 'college'].indexOf(this.user.stage) > -1 ? this.user.stage : ''
				const audience = this.user.stage === 'elder' ? 'elder' : 'student'
				const mine = db.getAccepts({
					username: this.user.username
				})
				this.todoCount = db.getHomework({
					audience: audience,
					stage: stage
				}).filter(t => !mine.some(a => a.taskId === t.id)).length

				this.latestNews = db.getNews('all').slice(0, 3)
			},
			onHeroPlay() {
				if (this.heroVideo && !this._heroCounted) {
					this._heroCounted = true
					db.incVideoPlay(this.heroVideo.id)
				}
			},
			typeName(t) {
				return t === 'case' ? '司法判例' : t === 'alert' ? '预警' : '新闻'
			},
			typeClass(t) {
				return t === 'case' ? 'yl-tag-blue' : t === 'alert' ? 'yl-tag-red' : 'yl-tag-green'
			},
			call(phone) {
				uni.makePhoneCall({
					phoneNumber: phone,
					fail: () => {
						uni.showToast({
							title: '请用手机拨打 ' + phone,
							icon: 'none'
						})
					}
				})
			},
			goEntry(e) {
				uni.navigateTo({
					url: e.url
				})
			},
			goLearn() {
				uni.navigateTo({
					url: '/pages/learn/learn'
				})
			},
			goNews() {
				uni.navigateTo({
					url: '/pages/news/news'
				})
			},
			goReport() {
				uni.navigateTo({
					url: '/pages/report/report'
				})
			},
			goMine() {
				uni.navigateTo({
					url: '/pages/mine/mine'
				})
			},
			goFamily() {
				uni.navigateTo({
					url: '/pages/family/family'
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
	.home {
		min-height: 100vh;
		background: #FBF4EC;
	}

	/* 欢迎 */
	.hello {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 2px 12px;
		gap: 10px;
	}

	.hello-l {
		flex: 1;
		min-width: 0;
	}

	.hello-t {
		display: block;
		font-size: 22px;
		font-weight: 700;
		line-height: 1.3;
	}

	.hello-s {
		display: block;
		font-size: 12px;
		color: #A2958A;
		margin-top: 3px;
	}

	.hello-badge {
		flex: 0 0 auto;
		padding: 6px 12px;
		border-radius: 999px;
		background: #FDEDE9;
		border: 1px solid #F3C9C3;
	}

	.hello-badge-t {
		font-size: 12px;
		color: #C8332B;
		font-weight: 600;
	}

	/* 宣传视频 */
	.hero-video-box {
		position: relative;
		border-radius: 20px;
		overflow: hidden;
		background: #2A1A14;
		box-shadow: 0 10px 26px rgba(140, 70, 40, .18);
	}

	.hero-video {
		width: 100%;
		height: 210px;
		display: block;
	}

	.hero-empty {
		height: 210px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		background: linear-gradient(150deg, #4A2A20, #2A1A14);
	}

	.hero-empty-e {
		font-size: 34px;
	}

	.hero-empty-t {
		font-size: 16px;
		color: #F6D9BE;
		font-weight: 600;
	}

	.hero-empty-s {
		font-size: 12px;
		color: #B08F74;
	}

	.hero-mask {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 150px;
		background: linear-gradient(to top, rgba(30, 12, 6, .82), rgba(30, 12, 6, 0));
		pointer-events: none;
	}

	/* 底部留给播放控件，标题放在控件上方，避免压住进度条 */
	.hero-label {
		position: absolute;
		left: 14px;
		bottom: 46px;
		right: 14px;
		pointer-events: none;
	}

	.hero-label-tag {
		display: inline-block;
		font-size: 11px;
		color: #FFF0DC;
		background: rgba(200, 51, 43, .9);
		padding: 2px 8px;
		border-radius: 6px;
		margin-bottom: 6px;
	}

	.hero-label-t {
		display: block;
		font-size: 15px;
		color: #fff;
		font-weight: 600;
		line-height: 1.4;
		text-shadow: 0 2px 6px rgba(0, 0, 0, .4);
	}

	/* 数据条 */
	.stats {
		display: flex;
		align-items: center;
		margin-top: 12px;
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 16px;
		padding: 14px 8px;
		box-shadow: 0 2px 10px rgba(160, 120, 80, .06);
	}

	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.stat-n {
		font-size: 22px;
		font-weight: 800;
		color: #C8332B;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.stat-l {
		font-size: 11px;
		color: #A2958A;
	}

	.stat-line {
		width: 1px;
		height: 28px;
		background: #F3E7D8;
	}

	/* 报警 */
	.alarm {
		background: linear-gradient(160deg, #FFF6F3, #FFEDE6);
		border: 1px solid #F6D2C8;
		border-radius: 18px;
		padding: 14px;
	}

	.alarm-hd {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.alarm-title {
		display: block;
		font-size: 16px;
		font-weight: 700;
		color: #9C2019;
	}

	.alarm-sub {
		display: block;
		font-size: 12px;
		color: #B08279;
		margin-top: 2px;
	}

	.alarm-more {
		font-size: 13px;
		color: #C8332B;
	}

	.alarm-main {
		background: linear-gradient(135deg, #D63B2F, #AE251D);
		border-radius: 16px;
		padding: 14px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 8px 18px rgba(180, 40, 32, .28);
	}

	.alarm-main-n {
		display: block;
		font-size: 30px;
		font-weight: 800;
		color: #fff;
		line-height: 1.1;
		letter-spacing: 1px;
	}

	.alarm-main-d {
		display: block;
		font-size: 12px;
		color: rgba(255, 255, 255, .85);
		margin-top: 3px;
	}

	.alarm-main-btn {
		background: #fff;
		border-radius: 999px;
		padding: 9px 20px;
	}

	.alarm-main-btn-t {
		font-size: 15px;
		font-weight: 700;
		color: #C8332B;
	}

	.alarm-row {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}

	.alarm-item {
		flex: 1;
		background: #fff;
		border: 1px solid #F6D2C8;
		border-radius: 12px;
		padding: 9px 4px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
	}

	.alarm-item-n {
		font-size: 16px;
		font-weight: 700;
		color: #B3271F;
		font-variant-numeric: tabular-nums;
	}

	.alarm-item-d {
		font-size: 11px;
		color: #A2958A;
	}

	/* 作业提示 / 教师入口 */
	.hw-tip,
	.teacher-tip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		border-radius: 16px;
		padding: 14px;
	}

	.hw-tip {
		background: linear-gradient(135deg, #EFFAF4, #DFF3E9);
		border: 1px solid #BFE6D3;
	}

	.teacher-tip {
		background: linear-gradient(135deg, #EEF4FB, #DDEAF7);
		border: 1px solid #C2D8EE;
	}

	.hw-tip-l,
	.teacher-tip-l {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
	}

	.hw-tip-e,
	.teacher-tip-e {
		font-size: 24px;
		flex: 0 0 auto;
	}

	.hw-tip-body,
	.teacher-tip-body {
		flex: 1;
		min-width: 0;
	}

	.hw-tip-t,
	.teacher-tip-t {
		display: block;
		font-size: 15px;
		font-weight: 700;
		color: #22624C;
	}

	.teacher-tip-t {
		color: #234E76;
	}

	.hw-tip-s,
	.teacher-tip-s {
		display: block;
		font-size: 12px;
		color: #5D8776;
		margin-top: 2px;
	}

	.teacher-tip-s {
		color: #5A7796;
	}

	.hw-tip-arrow,
	.teacher-tip-arrow {
		font-size: 20px;
		color: #9FB9AC;
	}

	/* 入口 */
	.entries {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.entry {
		flex: 1 1 300px;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 12px;
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 16px;
		padding: 12px;
		box-shadow: 0 2px 8px rgba(160, 120, 80, .05);
	}

	.entry:active {
		transform: scale(.99);
	}

	.entry-ico {
		width: 46px;
		height: 46px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.entry-emoji {
		font-size: 22px;
	}

	.entry-txt {
		flex: 1;
		min-width: 0;
	}

	.entry-t {
		display: block;
		font-size: 16px;
		font-weight: 700;
		line-height: 1.35;
	}

	.entry-s {
		display: block;
		font-size: 12px;
		color: #A2958A;
		line-height: 1.4;
		margin-top: 2px;
	}

	.entry-arrow {
		font-size: 20px;
		color: #D6C4B0;
	}

	/* 进度 */
	.prog-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.prog-l {
		font-size: 13px;
		color: #8A7C6D;
	}

	.prog-r {
		font-size: 15px;
		font-weight: 700;
		color: #C8332B;
	}

	.tip-box {
		display: flex;
		gap: 8px;
		background: #FBF6EE;
		border-radius: 12px;
		padding: 10px 12px;
	}

	.tip-ico {
		font-size: 14px;
		flex: 0 0 auto;
	}

	.tip-t {
		font-size: 13px;
		color: #8A6A4A;
		line-height: 1.6;
	}

	/* 新闻 */
	.news {
		display: flex;
		gap: 10px;
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 14px;
		padding: 12px;
		margin-bottom: 8px;
	}

	.news-dot {
		width: 4px;
		border-radius: 4px;
		flex: 0 0 auto;
	}

	.dot-case {
		background: #185FA5;
	}

	.dot-news {
		background: #1D7F5F;
	}

	.dot-alert {
		background: #C8332B;
	}

	.news-body {
		flex: 1;
		min-width: 0;
	}

	.news-t {
		font-size: 15px;
		font-weight: 600;
		line-height: 1.45;
	}

	.news-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 6px;
	}

	.news-src {
		font-size: 11px;
		color: #B4A697;
	}

	.bottom-note {
		text-align: center;
		padding: 26px 0 8px;
	}

	.bottom-note-t {
		font-size: 11px;
		color: #C6B8A8;
	}
</style>
