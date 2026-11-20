<template>
	<view class="ai">
		<yl-header title="AI 辨伪实验室" sub="看得穿，才不会被骗" back right="学习中心" @right="goLearn" />

		<view class="yl-app">
			<!-- 顶部说明 -->
			<view class="intro">
				<view class="intro-l">
					<text class="intro-t">先看 / 先听，再判断真假</text>
					<text class="intro-s">先看完这段短视频，再判断：画面里的人，是真的吗？</text>
				</view>
				<view class="intro-r">
					<text class="intro-n">{{ sessionRight }}/{{ sessionTotal }}</text>
					<text class="intro-l2">本轮答对</text>
				</view>
			</view>

			<!-- 模式切换 -->
			<view class="modes">
				<view class="mode" :class="{ 'mode-on': mode === 'video' }" @click="setMode('video')">
					<text class="mode-e">🎬</text>
					<text class="mode-t">视频辨伪</text>
				</view>
				<view class="mode" :class="{ 'mode-on': mode === 'voice' }" @click="setMode('voice')">
					<text class="mode-e">🎧</text>
					<text class="mode-t">语音辨伪</text>
				</view>
			</view>

			<!-- 答题区 -->
			<view v-if="!finished && cur" class="stage">
				<view class="stage-hd">
					<text class="stage-no">样本 {{ idx + 1 }} / {{ samples.length }}</text>
					<view v-if="samples.length > 1" class="dots">
						<view v-for="(s, i) in samples" :key="s.id" class="dot" :class="{ 'dot-on': i === idx }"></view>
					</view>
				</view>

				<!-- 视频样本 -->
				<view v-if="mode === 'video'" class="media">
					<video class="media-v" :src="cur.src" :controls="true" :autoplay="false" object-fit="contain"></video>
					<view class="media-cover">
						<text class="media-cover-t">{{ cur.title }}</text>
					</view>
				</view>


				<!-- 语音样本 -->
				<view v-else class="voice">
					<view class="voice-top">
						<view class="voice-btn" :class="{ 'voice-btn-on': speaking }" @click="toggleSpeak">
							<text class="voice-btn-t">{{ speaking ? '■' : '▶' }}</text>
						</view>
						<view class="voice-info">
							<text class="voice-t">{{ cur.title }}</text>
							<text class="voice-s">{{ speaking ? '正在播放，请仔细听语气和停顿' : '点左侧按钮播放这段语音' }}</text>
						</view>
					</view>
					<view class="wave" :class="{ 'wave-on': speaking }">
						<view class="bar" v-for="n in 22" :key="n" :style="{ animationDelay: (n * 60) + 'ms' }"></view>
					</view>
					<view class="transcript" @click="showTranscript = !showTranscript">
						<text class="transcript-t">{{ showTranscript ? '收起文字版 ˄' : '听不清？看文字版 ˅' }}</text>
					</view>
					<view v-if="showTranscript" class="transcript-box">
						<text class="transcript-box-t">{{ cur.lines }}</text>
					</view>
				</view>

				<!-- 判断按钮 -->
				<view v-if="!revealed" class="judge">
					<text class="judge-q">{{ mode === 'video' ? '这段视频里的人是真人吗？' : '这段语音是真人说的吗？' }}</text>
					<view class="judge-btns">
						<view class="judge-btn judge-real" @click="pick(false)">
							<text class="judge-e">🧑</text>
							<text class="judge-t">真人真声</text>
						</view>
						<view class="judge-btn judge-fake" @click="pick(true)">
							<text class="judge-e">🤖</text>
							<text class="judge-t">AI 合成</text>
						</view>
					</view>
					<text class="judge-tip">先完整看（听）完，再作判断</text>
				</view>

				<!-- 揭晓 -->
				<view v-else class="reveal yl-fade">
					<view class="verdict" :class="correct ? 'verdict-ok' : 'verdict-bad'">
						<text class="verdict-ico">{{ correct ? '🎉' : '⚠️' }}</text>
						<view class="verdict-body">
							<text class="verdict-t">{{ correct ? '恭喜，判断正确！' : '判断错了，这很危险' }}</text>
							<text class="verdict-s">
								{{ correct ? '你的眼力和耳朵都在线，继续保持警惕。' : '目前 AI 换脸和拟声越来越真实，需要格外警惕。' }}
							</text>
						</view>
					</view>

					<view class="score">
						<view class="score-hd">
							<text class="score-l">AI 合成含量</text>
							<text class="score-n">{{ cur.aiScore }}%</text>
						</view>
						<view class="score-bar">
							<view class="score-bar-in" :style="{ width: cur.aiScore + '%' }"
								:class="{ 'score-bar-low': cur.aiScore < 40 }"></view>
						</view>
						<text v-if="cur.verdict" class="score-verdict">{{ cur.verdict }}</text>
						<text class="score-tag">{{ cur.isAI ? '本样本为 AI 合成' : '本样本为真实拍摄/录音' }}</text>
					</view>

					<view class="clues">
						<text class="clues-t">破绽在哪里</text>
						<view class="clue" v-for="(c, i) in cur.clues" :key="i">
							<text class="clue-dot">•</text>
							<text class="clue-c">{{ c }}</text>
						</view>
					</view>

					<view class="tipn">
						<text class="tipn-t">🔐 {{ cur.tip }}</text>
					</view>

					<!-- 案例分析（视频样本） -->
					<view v-if="mode === 'video' && cur.cases" class="cases">
						<view class="cases-hd">
							<text class="cases-t">看完视频，再看几个真实的案子</text>
							<text class="cases-s">同一套手法，换到谁家都一样</text>
						</view>

						<view class="case" v-for="(c, i) in cur.cases" :key="i">
							<view class="case-hd">
								<text class="yl-tag yl-tag-red">{{ c.tag }}</text>
								<text class="case-amount">{{ c.amount }}</text>
							</view>
							<text class="case-t">{{ c.title }}</text>
							<text class="case-meta">{{ c.place }} · {{ c.date }}</text>
							<text class="case-story">{{ c.story }}</text>
							<view class="case-lesson">
								<text class="case-lesson-t">记住：{{ c.lesson }}</text>
							</view>
						</view>

						<text class="cases-note">{{ cur.caseNote }}</text>
					</view>

					<button class="yl-btn yl-btn-lg yl-btn-primary yl-btn-block" @click="next">
						{{ idx + 1 < samples.length ? '下一题' : '看本轮结果' }}
					</button>
				</view>
			</view>

			<!-- 本轮结果 -->
			<view v-if="finished" class="result yl-fade">
				<view class="result-top">
					<text class="result-t">本轮辨伪结束</text>
					<text class="result-n">{{ sessionRight }} / {{ sessionTotal }}</text>
					<text class="result-s">{{ resultText }}</text>
				</view>

				<view class="result-tips">
					<view class="rt" v-for="(t, i) in guardTips" :key="i">
						<text class="rt-n">{{ i + 1 }}</text>
						<text class="rt-t">{{ t }}</text>
					</view>
				</view>

				<view class="result-btns">
					<button class="yl-btn yl-btn-primary yl-btn-block" @click="restart">再练一轮</button>
					<button class="yl-btn yl-btn-ghost yl-btn-block" @click="goQuiz">去答题拿证书</button>
				</view>
			</view>

			<!-- 三个动作提示 -->
			<view class="yl-card rules">
				<text class="yl-h3">遇到“亲人借钱”，记住三个动作</text>
				<view class="rules-row">
					<view class="rule">
						<text class="rule-n">1</text>
						<text class="rule-t">挂断</text>
						<text class="rule-s">不继续对话</text>
					</view>
					<view class="rule">
						<text class="rule-n">2</text>
						<text class="rule-t">回拨</text>
						<text class="rule-s">用自己存的号码</text>
					</view>
					<view class="rule">
						<text class="rule-n">3</text>
						<text class="rule-t">核实</text>
						<text class="rule-s">问只有家人知道的事</text>
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
	import {
		AI_VIDEO_SAMPLES,
		AI_VOICE_SAMPLES
	} from '@/utils/seed.js'

	export default {
		data() {
			return {
				mode: 'video',
				idx: 0,
				picked: null,
				revealed: false,
				correct: false,
				sessionRight: 0,
				sessionTotal: 0,
				finished: false,
				speaking: false,
				showTranscript: false,
				videoSamples: AI_VIDEO_SAMPLES,
				voiceSamples: AI_VOICE_SAMPLES,
				guardTips: [
					'任何“亲友借钱”，都要用自己手机里存的号码回拨核实。',
					'让对方面对镜头做动作：转头、摸脸、手掌在脸前晃过。',
					'问一件只有你们知道的小事，答不上来就是假的。',
					'凡是要求“别告诉别人、马上转账”的，一律先挂断。'
				]
			}
		},
		computed: {
			samples() {
				return this.mode === 'video' ? this.videoSamples : this.voiceSamples
			},
			cur() {
				return this.samples[this.idx] || null
			},
			resultText() {
				const r = this.sessionTotal ? this.sessionRight / this.sessionTotal : 0
				if (r >= 0.9) return '眼力很好，但要记住：骗子也在进步，永远先核实。'
				if (r >= 0.6) return '基本能看出来，但仍有疏漏，建议再练一轮。'
				return '容易被骗过，请把下面四条守则记牢，并且一定要回拨核实。'
			}
		},
		onLoad() {
			const s = auth.requireUser()
			if (!s) return
		},
		onShow() {
			db.trackPage('AI辨伪')
		},
		onUnload() {
			this.stopSpeak()
		},
		methods: {
			setMode(m) {
				if (this.mode === m) return
				this.stopSpeak()
				this.mode = m
				this.idx = 0
				this.picked = null
				this.revealed = false
				this.finished = false
				this.showTranscript = false
			},
			pick(isAI) {
				if (this.revealed || !this.cur) return
				this.stopSpeak()
				this.picked = isAI
				this.revealed = true
				this.correct = isAI === this.cur.isAI
				this.sessionTotal += 1
				if (this.correct) this.sessionRight += 1
				db.countAi(this.correct)
			},
			next() {
				if (this.idx + 1 < this.samples.length) {
					this.idx += 1
					this.picked = null
					this.revealed = false
					this.showTranscript = false
				} else {
					this.finished = true
				}
			},
			restart() {
				this.idx = 0
				this.picked = null
				this.revealed = false
				this.finished = false
				this.sessionRight = 0
				this.sessionTotal = 0
				this.showTranscript = false
			},
			toggleSpeak() {
				if (this.speaking) {
					this.stopSpeak()
				} else {
					this.speak(this.cur.lines)
				}
			},
			speak(text) {
				try {
					if (typeof window === 'undefined' || !window.speechSynthesis) {
						uni.showToast({
							title: '当前浏览器不支持语音播放，请点“看文字版”',
							icon: 'none'
						})
						this.showTranscript = true
						return
					}
					window.speechSynthesis.cancel()
					const u = new window.SpeechSynthesisUtterance(text)
					u.lang = 'zh-CN'
					u.rate = 0.95
					u.pitch = 1
					u.onend = () => {
						this.speaking = false
					}
					u.onerror = () => {
						this.speaking = false
					}
					this.speaking = true
					window.speechSynthesis.speak(u)
				} catch (e) {
					this.speaking = false
					this.showTranscript = true
				}
			},
			stopSpeak() {
				this.speaking = false
				try {
					if (typeof window !== 'undefined' && window.speechSynthesis) {
						window.speechSynthesis.cancel()
					}
				} catch (e) {}
			},
			goLearn() {
				uni.reLaunch({
					url: '/pages/learn/learn'
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
	.ai {
		min-height: 100vh;
		background: #FBF4EC;
	}

	/* 说明 */
	.intro {
		margin-top: 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		background: #2B1A12;
		border-radius: 18px;
		padding: 16px;
		overflow: hidden;
	}

	.intro-l {
		flex: 1;
		min-width: 0;
	}

	.intro-t {
		display: block;
		font-size: 17px;
		font-weight: 700;
		color: #FFE9D2;
	}

	.intro-s {
		display: block;
		font-size: 12px;
		color: #B49A82;
		margin-top: 4px;
		line-height: 1.5;
	}

	.intro-r {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: rgba(255, 255, 255, .08);
		border-radius: 12px;
		padding: 8px 14px;
	}

	.intro-n {
		font-size: 20px;
		font-weight: 800;
		color: #FFC98C;
		font-variant-numeric: tabular-nums;
	}

	.intro-l2 {
		font-size: 10px;
		color: #A98C74;
	}

	/* 模式 */
	.modes {
		display: flex;
		gap: 10px;
		margin-top: 14px;
	}

	.mode {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 48px;
		border-radius: 14px;
		background: #fff;
		border: 1px solid #EFE0CE;
	}

	.mode-e {
		font-size: 16px;
	}

	.mode-t {
		font-size: 15px;
		color: #6C5C4C;
	}

	.mode-on {
		background: #2B1A12;
		border-color: #2B1A12;
	}

	.mode-on .mode-t {
		color: #FFE9D2;
		font-weight: 700;
	}

	/* 答题区 */
	.stage {
		margin-top: 14px;
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 18px;
		padding: 14px;
		box-shadow: 0 4px 16px rgba(160, 120, 80, .07);
	}

	.stage-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.stage-no {
		font-size: 12px;
		color: #A2958A;
	}

	.dots {
		display: flex;
		gap: 5px;
	}

	.dot {
		width: 16px;
		height: 4px;
		border-radius: 4px;
		background: #EFE0CE;
	}

	.dot-on {
		background: #C8332B;
		width: 24px;
	}

	/* 媒体 */
	.media {
		position: relative;
		border-radius: 14px;
		overflow: hidden;
		background: #1D1108;
	}

	.media-v {
		width: 100%;
		height: 200px;
		display: block;
	}

	.media-cover {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		padding: 8px 10px;
		background: linear-gradient(to bottom, rgba(0, 0, 0, .55), rgba(0, 0, 0, 0));
		pointer-events: none;
	}

	.media-cover-t {
		font-size: 12px;
		color: #FFE9D2;
	}

	/* 语音 */
	.voice {
		background: linear-gradient(150deg, #2B1A12, #3E2417);
		border-radius: 14px;
		padding: 14px;
	}

	.voice-top {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.voice-btn {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: rgba(255, 255, 255, .12);
		border: 1px solid rgba(255, 255, 255, .2);
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.voice-btn-on {
		background: #C8332B;
		border-color: #E8622C;
	}

	.voice-btn-t {
		font-size: 17px;
		color: #FFE9D2;
	}

	.voice-info {
		flex: 1;
		min-width: 0;
	}

	.voice-t {
		display: block;
		font-size: 15px;
		font-weight: 600;
		color: #FFE9D2;
		line-height: 1.4;
	}

	.voice-s {
		display: block;
		font-size: 11px;
		color: #B49A82;
		margin-top: 3px;
	}

	.wave {
		display: flex;
		align-items: center;
		gap: 3px;
		height: 40px;
		margin: 12px 0 4px;
	}

	.bar {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: rgba(255, 233, 210, .3);
	}

	.wave-on .bar {
		animation: wave .9s ease-in-out infinite;
		background: #E8622C;
	}

	@keyframes wave {
		0%,
		100% {
			height: 6px;
		}

		50% {
			height: 26px;
		}
	}

	.transcript {
		text-align: center;
		padding-top: 4px;
	}

	.transcript-t {
		font-size: 11px;
		color: #A98C74;
	}

	.transcript-box {
		margin-top: 8px;
		background: rgba(255, 255, 255, .06);
		border-radius: 10px;
		padding: 10px 12px;
	}

	.transcript-box-t {
		font-size: 13px;
		color: #DCC5AE;
		line-height: 1.7;
	}

	/* 判断 */
	.judge {
		margin-top: 14px;
	}

	.judge-q {
		display: block;
		text-align: center;
		font-size: 15px;
		font-weight: 600;
		color: #4A4038;
	}

	.judge-btns {
		display: flex;
		gap: 12px;
		margin-top: 12px;
	}

	.judge-btn {
		flex: 1;
		border-radius: 16px;
		padding: 16px 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.judge-real {
		background: #EFFAF4;
		border: 1px solid #A9DCC4;
	}

	.judge-fake {
		background: #FEF1EF;
		border: 1px solid #EFC0B8;
	}

	.judge-e {
		font-size: 26px;
	}

	.judge-t {
		font-size: 15px;
		font-weight: 700;
		color: #4A4038;
	}

	.judge-tip {
		display: block;
		text-align: center;
		font-size: 11px;
		color: #B4A697;
		margin-top: 10px;
	}

	/* 揭晓 */
	.reveal {
		margin-top: 14px;
	}

	.verdict {
		display: flex;
		gap: 10px;
		border-radius: 14px;
		padding: 12px;
	}

	.verdict-ok {
		background: #EFFAF4;
		border: 1px solid #A9DCC4;
	}

	.verdict-bad {
		background: #FEF1EF;
		border: 1px solid #EFC0B8;
	}

	.verdict-ico {
		font-size: 22px;
		flex: 0 0 auto;
	}

	.verdict-body {
		flex: 1;
		min-width: 0;
	}

	.verdict-t {
		display: block;
		font-size: 15px;
		font-weight: 700;
		color: #2F3A33;
	}

	.verdict-s {
		display: block;
		font-size: 12px;
		color: #6F7D73;
		line-height: 1.6;
		margin-top: 3px;
	}

	/* 分数 */
	.score {
		margin-top: 12px;
		background: #FBF6EE;
		border-radius: 12px;
		padding: 12px;
	}

	.score-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.score-l {
		font-size: 12px;
		color: #8A6A4A;
	}

	.score-n {
		font-size: 16px;
		font-weight: 800;
		color: #C8332B;
	}

	.score-bar {
		height: 8px;
		background: #EFE0CE;
		border-radius: 999px;
		overflow: hidden;
		margin: 6px 0;
	}

	.score-bar-in {
		height: 100%;
		background: linear-gradient(90deg, #E8622C, #C8332B);
		border-radius: 999px;
	}

	.score-bar-low {
		background: linear-gradient(90deg, #7FCBA8, #1D7F5F);
	}

	.score-tag {
		font-size: 11px;
		color: #A2958A;
	}

	.score-verdict {
		display: block;
		font-size: 13px;
		font-weight: 700;
		color: #C8332B;
		margin-bottom: 2px;
	}

	/* 案例分析 */
	.cases {
		margin-bottom: 14px;
	}

	.cases-hd {
		margin-bottom: 8px;
	}

	.cases-t {
		display: block;
		font-size: 15px;
		font-weight: 700;
		color: #4A4038;
	}

	.cases-s {
		display: block;
		font-size: 11px;
		color: #A2958A;
		margin-top: 2px;
	}

	.case {
		background: #FFFDFA;
		border: 1px solid #F3E5D4;
		border-radius: 14px;
		padding: 12px;
		margin-bottom: 10px;
	}

	.case-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.case-amount {
		font-size: 15px;
		font-weight: 800;
		color: #C8332B;
		font-variant-numeric: tabular-nums;
	}

	.case-t {
		display: block;
		font-size: 14px;
		font-weight: 700;
		line-height: 1.45;
		margin-top: 8px;
	}

	.case-meta {
		display: block;
		font-size: 11px;
		color: #B4A697;
		margin-top: 2px;
	}

	.case-story {
		display: block;
		font-size: 12px;
		color: #5C5349;
		line-height: 1.75;
		margin-top: 8px;
	}

	.case-lesson {
		margin-top: 8px;
		background: #FEF6F4;
		border-radius: 8px;
		padding: 8px 10px;
	}

	.case-lesson-t {
		font-size: 12px;
		color: #A8241C;
		line-height: 1.6;
	}

	.cases-note {
		display: block;
		font-size: 10px;
		color: #B4A697;
		line-height: 1.6;
	}

	/* 破绽 */
	.clues {
		margin-top: 12px;
	}

	.clues-t {
		display: block;
		font-size: 13px;
		font-weight: 700;
		color: #4A4038;
		margin-bottom: 6px;
	}

	.clue {
		display: flex;
		gap: 6px;
		margin-bottom: 4px;
	}

	.clue-dot {
		color: #C8332B;
		font-size: 13px;
		line-height: 1.6;
	}

	.clue-c {
		flex: 1;
		font-size: 13px;
		color: #5C5349;
		line-height: 1.65;
	}

	.tipn {
		margin: 12px 0 14px;
		background: #FFF6EC;
		border-left: 3px solid #E8622C;
		border-radius: 0 10px 10px 0;
		padding: 10px 12px;
	}

	.tipn-t {
		font-size: 12px;
		color: #8A5A32;
		line-height: 1.7;
	}

	/* 结果 */
	.result {
		margin-top: 16px;
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 18px;
		padding: 18px;
	}

	.result-top {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 0 16px;
	}

	.result-t {
		font-size: 14px;
		color: #8A7C6D;
	}

	.result-n {
		font-size: 40px;
		font-weight: 800;
		color: #C8332B;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.result-s {
		font-size: 12px;
		color: #A2958A;
		text-align: center;
		line-height: 1.6;
	}

	.result-tips {
		background: #FBF6EE;
		border-radius: 14px;
		padding: 14px;
	}

	.rt {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}

	.rt-n {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #C8332B;
		color: #fff;
		font-size: 11px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		margin-top: 2px;
	}

	.rt-t {
		flex: 1;
		font-size: 13px;
		color: #5C5349;
		line-height: 1.65;
	}

	.result-btns {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 16px;
	}

	/* 规则 */
	.rules {
		margin-top: 16px;
	}

	.rules-row {
		display: flex;
		gap: 10px;
		margin-top: 12px;
	}

	.rule {
		flex: 1;
		background: #FBF6EE;
		border-radius: 12px;
		padding: 12px 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.rule-n {
		font-size: 12px;
		font-weight: 800;
		color: #C8332B;
	}

	.rule-t {
		font-size: 16px;
		font-weight: 700;
		color: #4A4038;
	}

	.rule-s {
		font-size: 11px;
		color: #A2958A;
		text-align: center;
	}
</style>
