<template>
	<view class="detail">
		<yl-header title="视频学习" :sub="catName" back right="学习中心" @right="goLearn" />

		<view v-if="video" class="yl-app">
			<!-- 播放器 -->
			<view class="player">
				<video v-if="video.src && !videoError" id="mainVideo" class="player-v" :src="video.src"
					:poster="video.poster || ''" :controls="true" :autoplay="false" object-fit="contain"
					@timeupdate="onTime" @play="onPlay" @ended="onEnded" @error="onVideoError"></video>
				<view v-else-if="videoError" class="player-empty">
					<text class="player-empty-e">⚠️</text>
					<text class="player-empty-t">这个视频没能加载出来</text>
					<text class="player-fail-s">{{ videoError }}</text>
					<text class="player-fail-u">{{ video.src }}</text>
					<view class="player-fail-btn" @click="videoError = ''">
						<text class="player-fail-btn-t">重新加载</text>
					</view>
				</view>
				<view v-else class="player-empty">
					<text class="player-empty-e">🎬</text>
					<text class="player-empty-t">该视频尚未上传</text>
				</view>
			</view>

			<!-- 计时条 -->
			<view class="timer">
				<view class="timer-l">
					<view class="timer-dot" :class="{ 'timer-dot-off': !timing }"></view>
					<text class="timer-t">{{ timing ? '正在记录学习时长' : '已暂停计时' }}</text>
				</view>
				<text class="timer-n">本次 {{ mmss(thisSeconds) }}</text>
			</view>

			<!-- 标题 -->
			<view class="head">
				<text class="title">{{ video.title }}</text>
				<view class="head-meta">
					<text class="yl-tag" :style="{ background: catColor + '18', color: catColor }">{{ catName }}</text>
					<text class="head-meta-s">时长 {{ mmss(video.duration) }}</text>
					<text class="head-meta-s">{{ video.views }} 人学过</text>
					<text v-if="done" class="yl-tag yl-tag-green">已学完</text>
				</view>
			</view>

			<!-- 要点 -->
			<view class="yl-card">
				<text class="yl-h3">这节课记住这几点</text>
				<view class="points">
					<view class="point" v-for="(p, i) in video.points" :key="i">
						<view class="point-n">
							<text class="point-n-t">{{ i + 1 }}</text>
						</view>
						<text class="point-t">{{ p }}</text>
					</view>
				</view>
			</view>

			<!-- 随堂小测 -->
			<view class="yl-card quiz" v-if="video.quiz && video.quiz.length">
				<view class="yl-card-hd">
					<text class="yl-h3">随堂小测</text>
					<text class="yl-sub">{{ answeredCount }}/{{ video.quiz.length }} 已完成</text>
				</view>

				<view class="q" v-for="(q, qi) in video.quiz" :key="qi">
					<text class="q-t">{{ qi + 1 }}. {{ q.q }}</text>
					<view class="opts">
						<view class="opt" v-for="(o, oi) in q.options" :key="oi"
							:class="optClass(qi, oi, q.answer)" @click="answer(qi, oi, q.answer)">
							<text class="opt-k">{{ ['A', 'B', 'C', 'D'][oi] }}</text>
							<text class="opt-t">{{ o }}</text>
						</view>
					</view>
					<view v-if="picked[qi] !== undefined" class="explain"
						:class="{ 'explain-bad': picked[qi] !== q.answer }">
						<text class="explain-t">{{ picked[qi] === q.answer ? '✅ 回答正确' : '❌ 回答错误' }}　{{ q.explain }}</text>
					</view>
				</view>

				<view v-if="answeredCount === video.quiz.length" class="quiz-result">
					<text class="quiz-result-t">本次小测得分</text>
					<text class="quiz-result-n">{{ quizScore }}</text>
					<text class="quiz-result-s">分</text>
				</view>
			</view>

			<!-- 底部操作 -->
			<view class="actions">
				<button class="yl-btn yl-btn-ghost" @click="goLearn">返回学习中心</button>
				<button v-if="nextVideo" class="yl-btn yl-btn-primary" @click="goNext">下一课：{{ shortTitle(nextVideo.title) }}</button>
				<button v-else class="yl-btn yl-btn-soft" @click="goQuiz">去答题测一测</button>
			</view>

			<view class="yl-safe-bottom"></view>
		</view>

		<view v-else class="yl-empty">视频不存在或已下架</view>

		<yl-sos />
	</view>
</template>

<script>
	import db from '@/utils/store.js'
	import auth from '@/utils/auth.js'
	import fmt from '@/utils/format.js'

	export default {
		data() {
			return {
				user: null,
				video: null,
				catName: '',
				catColor: '#C8332B',
				done: false,
				timing: true,
				startAt: 0,
				accSeconds: 0,
				thisSeconds: 0,
				tick: null,
				picked: {},
				quizScore: 0,
				maxT: 0,
				nextVideo: null,
				prevVideo: null,
				videoError: ''
			}
		},
		computed: {
			answeredCount() {
				return Object.keys(this.picked).length
			}
		},
		onLoad(opt) {
			const s = auth.requireUser()
			if (!s) return
			this.user = s
			const id = opt && opt.id
			this.video = db.getVideo(id)
			if (!this.video) return

			const cat = db.getCategories().find(c => c.key === this.video.cat)
			this.catName = cat ? cat.name : '反诈'
			this.catColor = cat ? cat.color : '#C8332B'

			const p = db.getProgress(s.username)[id]
			this.done = !!(p && p.done)
			this.picked = {}

			const list = db.getVideos()
			const i = list.findIndex(v => v.id === id)
			this.nextVideo = list[i + 1] || null
			this.prevVideo = list[i - 1] || null

			this.startAt = Date.now()
			this.startTick()
		},
		onShow() {
			db.trackPage('视频学习')
			if (!this.startAt) this.startAt = Date.now()
			this.timing = true
			this.startTick()
		},
		onHide() {
			this.flush()
			this.stopTick()
		},
		onUnload() {
			this.flush()
			this.stopTick()
		},
		methods: {
			mmss(s) {
				return fmt.mmss(s)
			},
			shortTitle(t) {
				return t && t.length > 12 ? t.slice(0, 12) + '…' : t
			},
			startTick() {
				this.stopTick()
				this.tick = setInterval(() => {
					if (!this.timing) return
					const sec = Math.round((Date.now() - this.startAt) / 1000)
					this.thisSeconds = this.accSeconds + sec
				}, 1000)
			},
			stopTick() {
				if (this.tick) {
					clearInterval(this.tick)
					this.tick = null
				}
			},
			flush() {
				if (!this.video || !this.user) return
				const sec = Math.round((Date.now() - this.startAt) / 1000)
				if (sec >= 2) {
					db.addStudyTime(this.user.username, this.video.id, sec, this.video.duration)
					this.accSeconds += sec
					this.startAt = Date.now()
					const p = db.getProgress(this.user.username)[this.video.id]
					if (p && p.done) this.done = true
				}
			},
			onPlay() {
				if (!this.video || this._counted) return
				this._counted = true
				db.incVideoPlay(this.video.id)
				if (this.video) this.video.views = (this.video.views || 0) + 1
			},
			onVideoError(e) {
				const d = (e && e.detail) || {}
				let msg = d.errMsg || d.message || ''
				// #ifdef H5
				try {
					const el = document.querySelector('#mainVideo video') || document.querySelector('video')
					if (el && el.error) {
						const map = {
							1: '加载被中断',
							2: '网络错误，视频没下载下来',
							3: '视频文件已损坏',
							4: '浏览器无法解码这个视频（路径不存在，或不是 H.264 编码）'
						}
						msg = (map[el.error.code] || '加载失败') + '（错误码 ' + el.error.code + '）'
					}
				} catch (err) {}
				// #endif
				this.videoError = msg || '视频加载失败，请检查视频地址'
			},
			onTime(e) {
				const cur = e.detail.currentTime || 0
				if (cur > this.maxT) this.maxT = cur
				// 以视频真实时长为准（种子里的时长只用于列表展示）
				const real = e.detail.duration > 0 ? e.detail.duration : (this.video ? this.video.duration : 0)
				if (!real) return
				if (!this.done && this.maxT / real >= 0.8) {
					this.done = true
					uni.showToast({
						title: '本课已学完，学时已记录',
						icon: 'none'
					})
					this.flush()
				}
			},
			onEnded() {
				this.flush()
			},
			answer(qi, oi, correct) {
				if (this.picked[qi] !== undefined) return
				this.picked = Object.assign({}, this.picked, {
					[qi]: oi
				})
				if (oi === correct) {
					this.quizScore += Math.round(100 / this.video.quiz.length)
				}
				if (Object.keys(this.picked).length === this.video.quiz.length) {
					const score = Math.min(100, this.quizScore)
					db.setVideoQuiz(this.user.username, this.video.id, score)
				}
			},
			optClass(qi, oi, correct) {
				const p = this.picked[qi]
				if (p === undefined) return ''
				if (oi === correct) return 'opt-right'
				if (oi === p) return 'opt-wrong'
				return 'opt-dim'
			},
			goLearn() {
				uni.navigateBack({
					delta: 1,
					fail: () => {
						uni.reLaunch({
							url: '/pages/learn/learn'
						})
					}
				})
			},
			goNext() {
				if (!this.nextVideo) return
				this.flush()
				uni.redirectTo({
					url: '/pages/learn/detail?id=' + this.nextVideo.id
				})
			},
			goQuiz() {
				uni.navigateTo({
					url: '/pages/quiz/quiz'
				})
			}
		}
	}
</script>

<style>
	.detail {
		min-height: 100vh;
		background: #FBF4EC;
	}

	.player {
		margin-top: 12px;
		background: #1D1108;
		border-radius: 16px;
		overflow: hidden;
	}

	.player-v {
		width: 100%;
		height: 220px;
		display: block;
	}

	.player-empty {
		height: 220px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.player-empty-e {
		font-size: 34px;
	}

	.player-empty-t {
		font-size: 14px;
		color: #B08F74;
	}

	.player-fail-s {
		font-size: 12px;
		color: #E8935A;
		line-height: 1.5;
		text-align: center;
		padding: 0 18px;
	}

	.player-fail-u {
		font-size: 11px;
		color: #7A6455;
		word-break: break-all;
		text-align: center;
		padding: 0 18px;
	}

	.player-fail-btn {
		margin-top: 6px;
		padding: 7px 20px;
		border-radius: 999px;
		background: #C8332B;
	}

	.player-fail-btn-t {
		font-size: 13px;
		color: #FFFFFF;
	}

	/* 计时 */
	.timer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 10px;
		background: #FFF8EE;
		border: 1px solid #EFE0CE;
		border-radius: 12px;
		padding: 8px 12px;
	}

	.timer-l {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.timer-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #1D7F5F;
	}

	.timer-dot-off {
		background: #C4B8AB;
	}

	.timer-t {
		font-size: 12px;
		color: #8A6A4A;
	}

	.timer-n {
		font-size: 12px;
		color: #C8332B;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	/* 标题 */
	.head {
		padding: 14px 2px 4px;
	}

	.title {
		display: block;
		font-size: 20px;
		font-weight: 700;
		line-height: 1.45;
	}

	.head-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 8px;
	}

	.head-meta-s {
		font-size: 12px;
		color: #A2958A;
	}

	/* 要点 */
	.points {
		margin-top: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.point {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}

	.point-n {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #FDEDE9;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		margin-top: 1px;
	}

	.point-n-t {
		font-size: 12px;
		font-weight: 700;
		color: #C8332B;
	}

	.point-t {
		flex: 1;
		font-size: 14px;
		line-height: 1.7;
		color: #4A4038;
	}

	/* 小测 */
	.quiz {
		margin-top: 14px;
	}

	.q {
		margin-bottom: 18px;
	}

	.q-t {
		display: block;
		font-size: 15px;
		font-weight: 600;
		line-height: 1.6;
		margin-bottom: 10px;
	}

	.opts {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.opt {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 13px;
		border: 1px solid #EFE0CE;
		border-radius: 12px;
		background: #fff;
	}

	.opt-k {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #F6EEE4;
		color: #8A6A4A;
		font-size: 12px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.opt-t {
		flex: 1;
		font-size: 14px;
		line-height: 1.5;
		color: #4A4038;
	}

	.opt-right {
		border-color: #9FD6BE;
		background: #EFFAF4;
	}

	.opt-right .opt-k {
		background: #1D7F5F;
		color: #fff;
	}

	.opt-wrong {
		border-color: #EBB3A9;
		background: #FEF3F1;
	}

	.opt-wrong .opt-k {
		background: #C8332B;
		color: #fff;
	}

	.opt-dim {
		opacity: .55;
	}

	.explain {
		margin-top: 8px;
		background: #F1F9F5;
		border-radius: 10px;
		padding: 9px 11px;
	}

	.explain-bad {
		background: #FDF1EF;
	}

	.explain-t {
		font-size: 12px;
		color: #5C6B60;
		line-height: 1.6;
	}

	.quiz-result {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 4px;
		background: #FFF6EC;
		border-radius: 12px;
		padding: 12px;
	}

	.quiz-result-t {
		font-size: 13px;
		color: #8A6A4A;
	}

	.quiz-result-n {
		font-size: 24px;
		font-weight: 800;
		color: #C8332B;
	}

	.quiz-result-s {
		font-size: 12px;
		color: #8A6A4A;
	}

	/* 操作 */
	.actions {
		display: flex;
		gap: 10px;
		margin-top: 18px;
	}

	.actions .yl-btn {
		flex: 1;
		font-size: 15px;
		padding: 0 12px;
	}
</style>
