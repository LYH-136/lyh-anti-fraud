<template>
	<view class="quiz">
		<yl-header title="反诈答题" sub="10 道题，80 分领证书" back right="我的" @right="goMine" />

		<view class="yl-app">
			<!-- 开始页 -->
			<view v-if="stage === 'ready'" class="ready">
				<view class="ready-card">
					<view class="ready-badge">
						<text class="ready-badge-t">反诈能力自测</text>
					</view>
					<text class="ready-t">测一测，你能识破几个骗局？</text>
					<text class="ready-s">共 10 道题，覆盖刷单、返现、陪聊、冒充公检法、AI 换脸等类型</text>

					<view class="ready-stats">
						<view class="rs">
							<text class="rs-n">10</text>
							<text class="rs-l">题目数量</text>
						</view>
						<view class="rs-line"></view>
						<view class="rs">
							<text class="rs-n">80</text>
							<text class="rs-l">及格分数</text>
						</view>
						<view class="rs-line"></view>
						<view class="rs">
							<text class="rs-n">{{ bestScore }}</text>
							<text class="rs-l">我的最高分</text>
						</view>
					</view>

					<button class="yl-btn yl-btn-lg yl-btn-primary yl-btn-block" @click="start">开始答题</button>

					<view v-if="lastRecord" class="last" @click="viewCert(lastRecord.certNo)">
						<text class="last-t">上次成绩 {{ lastRecord.score }} 分 · 查看证书 ›</text>
					</view>
				</view>

				<view class="yl-card rules-card">
					<text class="yl-h3">答题说明</text>
					<view class="rule-item" v-for="(r, i) in rules" :key="i">
						<text class="rule-dot">{{ i + 1 }}</text>
						<text class="rule-t">{{ r }}</text>
					</view>
				</view>
			</view>

			<!-- 答题中 -->
			<view v-if="stage === 'doing' && cur" class="doing">
				<view class="bar">
					<view class="bar-l">
						<text class="bar-t">{{ idx + 1 }} / {{ list.length }}</text>
						<text class="bar-s">已答对 {{ rightCount }} 题</text>
					</view>
					<text class="bar-time">{{ mmss(elapsed) }}</text>
				</view>
				<view class="yl-progress">
					<view class="yl-pbar" :style="{ width: ((idx + 1) / list.length * 100) + '%' }"></view>
				</view>

				<view class="qcard">
					<view class="qcard-hd">
						<text class="yl-tag" :style="{ background: catColor(cur.cat) + '18', color: catColor(cur.cat) }">
							{{ catName(cur.cat) }}
						</text>
						<text class="qcard-no">第 {{ idx + 1 }} 题</text>
					</view>
					<text class="qcard-q">{{ cur.q }}</text>

					<view class="opts">
						<view class="opt" v-for="(o, oi) in cur.options" :key="oi" :class="optClass(oi)"
							@click="choose(oi)">
							<text class="opt-k">{{ ['A', 'B', 'C', 'D'][oi] }}</text>
							<text class="opt-t">{{ o }}</text>
							<text v-if="picked !== null && oi === cur.answer" class="opt-mark">✓</text>
						</view>
					</view>

					<view v-if="picked !== null" class="explain" :class="{ 'explain-bad': picked !== cur.answer }">
						<text class="explain-hd">{{ picked === cur.answer ? '✅ 回答正确' : '❌ 回答错误，正确答案是 ' + ['A', 'B',
							'C', 'D'][cur.answer] }}</text>
						<text class="explain-t">{{ cur.explain }}</text>
					</view>

					<button v-if="picked !== null" class="yl-btn yl-btn-primary yl-btn-block next-btn" @click="next">
						{{ idx + 1 < list.length ? '下一题' : '查看成绩' }}
					</button>
				</view>
			</view>

			<!-- 结果 -->
			<view v-if="stage === 'done'" class="done yl-fade">
				<view class="done-card">
					<view class="done-ring">
						<text class="done-n">{{ score }}</text>
						<text class="done-u">分</text>
					</view>
					<text class="done-t">{{ pass ? '恭喜通过！' : '还没到 80 分' }}</text>
					<text class="done-s">
						{{ pass ? '你已具备基本的反诈识别能力，可以领取电子证书了。' : '别灰心，先回学习中心看两个视频再来挑战。' }}
					</text>

					<view class="done-stats">
						<view class="ds">
							<text class="ds-n">{{ rightCount }}</text>
							<text class="ds-l">答对</text>
						</view>
						<view class="ds-line"></view>
						<view class="ds">
							<text class="ds-n">{{ list.length - rightCount }}</text>
							<text class="ds-l">答错</text>
						</view>
						<view class="ds-line"></view>
						<view class="ds">
							<text class="ds-n">{{ mmss(elapsed) }}</text>
							<text class="ds-l">用时</text>
						</view>
					</view>

					<button v-if="pass" class="yl-btn yl-btn-lg yl-btn-primary yl-btn-block" @click="viewCert(certNo)">
						领取电子证书
					</button>
					<button v-else class="yl-btn yl-btn-lg yl-btn-primary yl-btn-block" @click="start">再考一次</button>
					<button class="yl-btn yl-btn-ghost yl-btn-block again" @click="goLearn">回学习中心补课</button>
				</view>

				<view class="yl-card review">
					<text class="yl-h3">错题回顾</text>
					<view v-if="!wrongList.length" class="review-empty">
						<text class="review-empty-t">全对，一道没错 👍</text>
					</view>
					<view class="rv" v-for="(r, i) in wrongList" :key="i">
						<text class="rv-q">{{ i + 1 }}. {{ r.q }}</text>
						<text class="rv-a">正确答案：{{ r.options[r.answer] }}</text>
						<text class="rv-e">{{ r.explain }}</text>
					</view>
				</view>
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
		QUIZ_BANK
	} from '@/utils/seed.js'

	export default {
		data() {
			return {
				user: null,
				stage: 'ready',
				list: [],
				idx: 0,
				picked: null,
				answers: [],
				startAt: 0,
				elapsed: 0,
				tick: null,
				score: 0,
				pass: false,
				certNo: '',
				bestScore: 0,
				lastRecord: null,
				rules: [
					'共 10 道题，从题库中随机抽取，每次都不一样。',
					'每题选完立即显示对错和解释，答错也没关系，记住才是目的。',
					'满分 100 分，80 分及以上即可领取电子证书。',
					'证书上有姓名、分数和唯一编号，可保存为图片分享给家人。'
				]
			}
		},
		computed: {
			cur() {
				return this.list[this.idx] || null
			},
			rightCount() {
				return this.answers.filter(a => a && a.right).length
			},
			wrongList() {
				return this.answers.filter(a => a && !a.right).map(a => a.q)
			}
		},
		onLoad() {
			const s = auth.requireUser()
			if (!s) return
			this.user = s
			this.loadHistory()
		},
		onShow() {
			db.trackPage('反诈答题')
		},
		onUnload() {
			if (this.tick) clearInterval(this.tick)
		},
		methods: {
			loadHistory() {
				const recs = db.getRecords(this.user.username)
				this.lastRecord = recs[0] || null
				this.bestScore = recs.reduce((m, r) => Math.max(m, r.score), 0)
			},
			mmss(s) {
				return fmt.mmss(s)
			},
			start() {
				const pool = QUIZ_BANK.slice()
				// 洗牌
				for (let i = pool.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1))
					const t = pool[i]
					pool[i] = pool[j]
					pool[j] = t
				}
				this.list = pool.slice(0, 10)
				this.idx = 0
				this.picked = null
				this.answers = []
				this.score = 0
				this.pass = false
				this.elapsed = 0
				this.stage = 'doing'
				this.startAt = Date.now()
				if (this.tick) clearInterval(this.tick)
				this.tick = setInterval(() => {
					this.elapsed = Math.round((Date.now() - this.startAt) / 1000)
				}, 1000)
			},
			choose(oi) {
				if (this.picked !== null) return
				this.picked = oi
				const right = oi === this.cur.answer
				this.$set(this.answers, this.idx, {
					q: this.cur,
					pick: oi,
					right: right
				})
				if (right) this.score += 10
			},
			optClass(oi) {
				if (this.picked === null) return ''
				if (oi === this.cur.answer) return 'opt-right'
				if (oi === this.picked) return 'opt-wrong'
				return 'opt-dim'
			},
			next() {
				if (this.idx + 1 < this.list.length) {
					this.idx += 1
					this.picked = null
					return
				}
				this.finish()
			},
			finish() {
				if (this.tick) clearInterval(this.tick)
				this.score = Math.round(this.rightCount / this.list.length * 100)
				this.pass = this.score >= 80
				const rec = db.addQuizRecord({
					username: this.user.username,
					nickname: this.user.nickname,
					stage: this.user.stage,
					score: this.score,
					total: this.list.length,
					right: this.rightCount,
					pass: this.pass
				})
				this.certNo = rec.certNo
				this.lastRecord = rec
				this.bestScore = Math.max(this.bestScore, this.score)
				this.stage = 'done'
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 200
				})
			},
			catName(k) {
				const c = db.getCategories().find(x => x.key === k)
				return c ? c.name : '反诈常识'
			},
			catColor(k) {
				const c = db.getCategories().find(x => x.key === k)
				return c ? c.color : '#C8332B'
			},
			viewCert(no) {
				if (!no) {
					uni.showToast({
						title: '暂无证书',
						icon: 'none'
					})
					return
				}
				uni.navigateTo({
					url: '/pages/quiz/cert?no=' + no
				})
			},
			goLearn() {
				uni.navigateTo({
					url: '/pages/learn/learn'
				})
			},
			goMine() {
				uni.navigateTo({
					url: '/pages/mine/mine'
				})
			}
		}
	}
</script>

<style>
	.quiz {
		min-height: 100vh;
		background: #FBF4EC;
	}

	/* 开始页 */
	.ready {
		padding-top: 16px;
	}

	.ready-card {
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 20px;
		padding: 22px 18px;
		box-shadow: 0 6px 20px rgba(160, 120, 80, .08);
	}

	.ready-badge {
		display: inline-flex;
		padding: 4px 10px;
		border-radius: 999px;
		background: #FDEDE9;
	}

	.ready-badge-t {
		font-size: 11px;
		color: #C8332B;
		font-weight: 600;
	}

	.ready-t {
		display: block;
		font-size: 23px;
		font-weight: 800;
		line-height: 1.35;
		margin-top: 12px;
	}

	.ready-s {
		display: block;
		font-size: 13px;
		color: #8A7C6D;
		line-height: 1.7;
		margin-top: 8px;
	}

	.ready-stats {
		display: flex;
		align-items: center;
		background: #FBF6EE;
		border-radius: 14px;
		padding: 14px 8px;
		margin: 18px 0;
	}

	.rs {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.rs-n {
		font-size: 21px;
		font-weight: 800;
		color: #C8332B;
		font-variant-numeric: tabular-nums;
	}

	.rs-l {
		font-size: 11px;
		color: #A2958A;
	}

	.rs-line {
		width: 1px;
		height: 26px;
		background: #EFE0CE;
	}

	.last {
		margin-top: 14px;
		text-align: center;
	}

	.last-t {
		font-size: 13px;
		color: #A07A55;
		text-decoration: underline;
	}

	.rules-card {
		margin-top: 16px;
	}

	.rule-item {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}

	.rule-dot {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #F6EEE4;
		color: #8A6A4A;
		font-size: 11px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		margin-top: 2px;
	}

	.rule-t {
		flex: 1;
		font-size: 13px;
		color: #5C5349;
		line-height: 1.65;
	}

	/* 答题 */
	.doing {
		padding-top: 16px;
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.bar-l {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.bar-t {
		font-size: 16px;
		font-weight: 700;
		color: #2B2B2B;
		font-variant-numeric: tabular-nums;
	}

	.bar-s {
		font-size: 12px;
		color: #A2958A;
	}

	.bar-time {
		font-size: 12px;
		color: #A2958A;
		font-variant-numeric: tabular-nums;
	}

	.qcard {
		margin-top: 14px;
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 18px;
		padding: 16px;
		box-shadow: 0 4px 16px rgba(160, 120, 80, .07);
	}

	.qcard-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.qcard-no {
		font-size: 11px;
		color: #B4A697;
	}

	.qcard-q {
		display: block;
		font-size: 17px;
		font-weight: 600;
		line-height: 1.65;
		margin: 12px 0 16px;
	}

	.opts {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.opt {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 13px 14px;
		border: 1px solid #EFE0CE;
		border-radius: 14px;
		background: #fff;
	}

	.opt-k {
		width: 24px;
		height: 24px;
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
		font-size: 15px;
		line-height: 1.5;
		color: #4A4038;
	}

	.opt-mark {
		font-size: 16px;
		color: #1D7F5F;
		font-weight: 700;
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
		opacity: .5;
	}

	.explain {
		margin-top: 14px;
		background: #F1F9F5;
		border-radius: 12px;
		padding: 12px;
	}

	.explain-bad {
		background: #FDF1EF;
	}

	.explain-hd {
		display: block;
		font-size: 13px;
		font-weight: 700;
		color: #2F5A46;
		margin-bottom: 4px;
	}

	.explain-bad .explain-hd {
		color: #A8241C;
	}

	.explain-t {
		display: block;
		font-size: 13px;
		color: #5C6B60;
		line-height: 1.7;
	}

	.next-btn {
		margin-top: 16px;
	}

	/* 结果 */
	.done {
		padding-top: 16px;
	}

	.done-card {
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 20px;
		padding: 24px 18px;
		text-align: center;
		box-shadow: 0 6px 20px rgba(160, 120, 80, .08);
	}

	.done-ring {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		margin: 0 auto;
		display: flex;
		align-items: baseline;
		justify-content: center;
		background: linear-gradient(150deg, #FFF3E6, #FFE0CB);
		border: 4px solid #F3C9A6;
	}

	.done-n {
		font-size: 44px;
		font-weight: 800;
		color: #C8332B;
		line-height: 120px;
	}

	.done-u {
		font-size: 14px;
		color: #A07A55;
	}

	.done-t {
		display: block;
		font-size: 20px;
		font-weight: 700;
		margin-top: 16px;
	}

	.done-s {
		display: block;
		font-size: 13px;
		color: #8A7C6D;
		line-height: 1.7;
		margin-top: 6px;
	}

	.done-stats {
		display: flex;
		align-items: center;
		background: #FBF6EE;
		border-radius: 14px;
		padding: 12px 8px;
		margin: 18px 0;
	}

	.ds {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.ds-n {
		font-size: 18px;
		font-weight: 800;
		color: #4A4038;
		font-variant-numeric: tabular-nums;
	}

	.ds-l {
		font-size: 11px;
		color: #A2958A;
	}

	.ds-line {
		width: 1px;
		height: 24px;
		background: #EFE0CE;
	}

	.again {
		margin-top: 10px;
	}

	.review {
		margin-top: 16px;
	}

	.review-empty {
		padding: 16px 0;
		text-align: center;
	}

	.review-empty-t {
		font-size: 14px;
		color: #1D7F5F;
	}

	.rv {
		border-top: 1px solid #F5EADB;
		padding: 12px 0;
	}

	.rv-q {
		display: block;
		font-size: 14px;
		font-weight: 600;
		line-height: 1.6;
	}

	.rv-a {
		display: block;
		font-size: 13px;
		color: #1D7F5F;
		margin-top: 6px;
	}

	.rv-e {
		display: block;
		font-size: 12px;
		color: #8A7C6D;
		line-height: 1.6;
		margin-top: 4px;
	}
</style>
