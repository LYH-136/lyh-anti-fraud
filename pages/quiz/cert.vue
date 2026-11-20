<template>
	<view class="cert">
		<yl-header title="电子证书" sub="可保存为图片" back right="我的" @right="goMine" />

		<view class="yl-app yl-narrow">
			<view v-if="rec" class="paper-wrap">
				<view class="paper">
					<view class="paper-inner">
						<view class="corner c1"></view>
						<view class="corner c2"></view>
						<view class="corner c3"></view>
						<view class="corner c4"></view>

						<text class="p-brand">银铃守护 · 老年人反诈学堂</text>
						<text class="p-title">反诈学习结业证书</text>
						<text class="p-en">CERTIFICATE OF ANTI-FRAUD LEARNING</text>

						<view class="p-line"></view>

						<view class="p-name-row">
							<text class="p-label">兹证明</text>
							<text class="p-name">{{ rec.nickname }}</text>
							<text class="p-label">同志</text>
						</view>

						<text class="p-body">
							于 {{ dateText }} 完成本平台反诈知识学习与测试，取得 {{ rec.score }} 分的成绩，能够识别刷单返利、虚假返现、虚假陪聊、冒充公检法、AI 换脸等常见诈骗手法，特发此证，以资鼓励。
						</text>

						<view class="p-meta">
							<view class="p-meta-l">
								<text class="p-meta-t">证书编号：{{ rec.certNo }}</text>
								<text class="p-meta-t">成绩：{{ rec.score }} / 100</text>
								<text class="p-meta-t">颁发日期：{{ dateText }}</text>
							</view>
							<view class="seal">
								<text class="seal-t1">银铃守护</text>
								<text class="seal-t2">反诈学堂</text>
								<text class="seal-star">★</text>
							</view>
						</view>

						<text class="p-foot">本证书由「银铃守护」平台颁发，可在平台内凭编号核验</text>
					</view>
				</view>
			</view>

			<view v-else class="yl-empty">没有找到证书记录，先去答题吧</view>

			<view v-if="rec" class="actions">
				<button class="yl-btn yl-btn-lg yl-btn-primary yl-btn-block" @click="saveImage">保存证书图片</button>
				<button class="yl-btn yl-btn-ghost yl-btn-block" @click="goQuiz">再测一次</button>
			</view>

			<view v-if="rec" class="hint">
				<text class="hint-t">提示：保存后可以发给家人，也可以打印出来贴在冰箱上，提醒全家一起防骗。</text>
			</view>

			<view class="yl-safe-bottom"></view>
		</view>

		<canvas canvas-id="certCanvas" id="certCanvas" class="cert-canvas"></canvas>

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
				rec: null,
				saving: false
			}
		},
		computed: {
			dateText() {
				return this.rec ? fmt.dateStr(this.rec.at) : ''
			}
		},
		onLoad(opt) {
			const s = auth.requireUser()
			if (!s) return
			this.user = s
			const no = opt && opt.no
			this.rec = no ? db.getCert(no) : db.getRecords(s.username).find(r => r.pass) || null
		},
		onShow() {
			db.trackPage('电子证书')
		},
		methods: {
			saveImage() {
				if (this.saving || !this.rec) return
				this.saving = true
				uni.showLoading({
					title: '正在生成…'
				})

				try {
					const ctx = uni.createCanvasContext('certCanvas', this)
					const W = 640
					const H = 460

					// 背景
					ctx.setFillStyle('#FFFDF8')
					ctx.fillRect(0, 0, W, H)

					// 外框
					ctx.setStrokeStyle('#C8332B')
					ctx.setLineWidth(3)
					ctx.strokeRect(14, 14, W - 28, H - 28)
					ctx.setStrokeStyle('#E0B98C')
					ctx.setLineWidth(1)
					ctx.strokeRect(22, 22, W - 44, H - 44)

					// 标题
					ctx.setTextAlign('center')
					ctx.setFillStyle('#8A6A4A')
					ctx.setFontSize(13)
					ctx.fillText('银铃守护 · 老年人反诈学堂', W / 2, 66)

					ctx.setFillStyle('#2B2B2B')
					ctx.setFontSize(30)
					ctx.fillText('反诈学习结业证书', W / 2, 112)

					ctx.setFillStyle('#B49A82')
					ctx.setFontSize(10)
					ctx.fillText('CERTIFICATE OF ANTI-FRAUD LEARNING', W / 2, 134)

					// 分隔线
					ctx.setStrokeStyle('#E8CFB2')
					ctx.setLineWidth(1)
					ctx.beginPath()
					ctx.moveTo(80, 152)
					ctx.lineTo(W - 80, 152)
					ctx.stroke()

					// 姓名
					ctx.setTextAlign('left')
					ctx.setFillStyle('#5C5349')
					ctx.setFontSize(14)
					ctx.fillText('兹证明', 70, 196)

					ctx.setFillStyle('#C8332B')
					ctx.setFontSize(26)
					ctx.fillText(this.rec.nickname, 126, 198)

					ctx.setFillStyle('#5C5349')
					ctx.setFontSize(14)
					ctx.fillText('同志', 146 + this.rec.nickname.length * 26, 196)

					// 正文（手工换行）
					const body = '于 ' + this.dateText + ' 完成本平台反诈知识学习与测试，取得 ' +
						this.rec.score + ' 分的成绩，能够识别刷单返利、虚假返现、虚假陪聊、冒充公检法、AI 换脸等常见诈骗手法，特发此证。'
					this.wrapText(ctx, body, 70, 234, W - 140, 22, 13, '#5C5349')

					// 元信息
					ctx.setFillStyle('#8A7C6D')
					ctx.setFontSize(11)
					ctx.fillText('证书编号：' + this.rec.certNo, 70, 372)
					ctx.fillText('成绩：' + this.rec.score + ' / 100', 70, 392)
					ctx.fillText('颁发日期：' + this.dateText, 70, 412)

					// 印章
					ctx.setStrokeStyle('rgba(200,51,43,.75)')
					ctx.setLineWidth(2)
					ctx.beginPath()
					ctx.arc(W - 120, 380, 44, 0, Math.PI * 2)
					ctx.stroke()
					ctx.setFillStyle('rgba(200,51,43,.85)')
					ctx.setTextAlign('center')
					ctx.setFontSize(13)
					ctx.fillText('银铃守护', W - 120, 372)
					ctx.fillText('反诈学堂', W - 120, 392)

					ctx.draw()

					setTimeout(() => {
						uni.canvasToTempFilePath({
							canvasId: 'certCanvas',
							success: (res) => {
								uni.hideLoading()
								this.saving = false
								this.download(res.tempFilePath)
							},
							fail: () => {
								uni.hideLoading()
								this.saving = false
								uni.showToast({
									title: '生成失败，可长按证书截图保存',
									icon: 'none'
								})
							}
						}, this)
					}, 300)
				} catch (e) {
					uni.hideLoading()
					this.saving = false
					uni.showToast({
						title: '生成失败，请截图保存',
						icon: 'none'
					})
				}
			},
			wrapText(ctx, text, x, y, maxWidth, lineHeight, fontSize, color) {
				ctx.setFillStyle(color)
				ctx.setFontSize(fontSize)
				ctx.setTextAlign('left')
				let line = ''
				let cy = y
				for (let i = 0; i < text.length; i++) {
					const test = line + text[i]
					if (ctx.measureText(test).width > maxWidth && line) {
						ctx.fillText(line, x, cy)
						line = text[i]
						cy += lineHeight
					} else {
						line = test
					}
				}
				if (line) ctx.fillText(line, x, cy)
			},
			download(path) {
				try {
					if (typeof document !== 'undefined') {
						const a = document.createElement('a')
						a.href = path
						a.download = '银铃守护-反诈结业证书-' + this.rec.certNo + '.png'
						document.body.appendChild(a)
						a.click()
						document.body.removeChild(a)
						uni.showToast({
							title: '已保存到下载目录',
							icon: 'none'
						})
						return
					}
				} catch (e) {}
				uni.showToast({
					title: '请长按图片保存',
					icon: 'none'
				})
			},
			goQuiz() {
				uni.navigateTo({
					url: '/pages/quiz/quiz'
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
	.cert {
		min-height: 100vh;
		background: #F2E7D8;
	}

	.paper-wrap {
		padding: 16px 0 8px;
	}

	.paper {
		background: #FFFDF8;
		border-radius: 10px;
		padding: 8px;
		box-shadow: 0 12px 30px rgba(120, 80, 40, .18);
	}

	.paper-inner {
		position: relative;
		border: 2px solid #C8332B;
		border-radius: 4px;
		padding: 22px 20px 18px;
		overflow: hidden;
	}

	.paper-inner:before {
		content: '';
		position: absolute;
		left: 5px;
		top: 5px;
		right: 5px;
		bottom: 5px;
		border: 1px solid #E0B98C;
		border-radius: 2px;
		pointer-events: none;
	}

	.corner {
		position: absolute;
		width: 14px;
		height: 14px;
		border-color: #C8332B;
		border-style: solid;
		border-width: 0;
	}

	.c1 {
		left: 10px;
		top: 10px;
		border-left-width: 2px;
		border-top-width: 2px;
	}

	.c2 {
		right: 10px;
		top: 10px;
		border-right-width: 2px;
		border-top-width: 2px;
	}

	.c3 {
		left: 10px;
		bottom: 10px;
		border-left-width: 2px;
		border-bottom-width: 2px;
	}

	.c4 {
		right: 10px;
		bottom: 10px;
		border-right-width: 2px;
		border-bottom-width: 2px;
	}

	.p-brand {
		display: block;
		text-align: center;
		font-size: 12px;
		color: #8A6A4A;
		letter-spacing: 2px;
	}

	.p-title {
		display: block;
		text-align: center;
		font-size: 26px;
		font-weight: 800;
		color: #2B2B2B;
		letter-spacing: 3px;
		margin-top: 8px;
	}

	.p-en {
		display: block;
		text-align: center;
		font-size: 9px;
		color: #B49A82;
		letter-spacing: 1px;
		margin-top: 4px;
	}

	.p-line {
		height: 1px;
		background: #E8CFB2;
		margin: 14px 0 16px;
	}

	.p-name-row {
		display: flex;
		align-items: baseline;
		gap: 6px;
		flex-wrap: wrap;
	}

	.p-label {
		font-size: 14px;
		color: #5C5349;
	}

	.p-name {
		font-size: 24px;
		font-weight: 800;
		color: #C8332B;
		border-bottom: 1px solid #E8CFB2;
		padding: 0 8px 2px;
	}

	.p-body {
		display: block;
		font-size: 13px;
		color: #5C5349;
		line-height: 2;
		margin-top: 14px;
		text-indent: 2em;
	}

	.p-meta {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-top: 18px;
	}

	.p-meta-l {
		flex: 1;
		min-width: 0;
	}

	.p-meta-t {
		display: block;
		font-size: 11px;
		color: #8A7C6D;
		line-height: 1.9;
	}

	.seal {
		flex: 0 0 auto;
		width: 84px;
		height: 84px;
		border-radius: 50%;
		border: 2px solid rgba(200, 51, 43, .7);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		transform: rotate(-8deg);
		opacity: .92;
	}

	.seal-t1 {
		font-size: 12px;
		color: rgba(200, 51, 43, .85);
		font-weight: 700;
		letter-spacing: 1px;
		line-height: 1.5;
	}

	.seal-t2 {
		font-size: 12px;
		color: rgba(200, 51, 43, .85);
		font-weight: 700;
		letter-spacing: 1px;
		line-height: 1.5;
	}

	.seal-star {
		font-size: 10px;
		color: rgba(200, 51, 43, .8);
		margin-top: 2px;
	}

	.p-foot {
		display: block;
		text-align: center;
		font-size: 10px;
		color: #C0B09E;
		margin-top: 14px;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 20px;
	}

	.hint {
		margin-top: 14px;
		text-align: center;
	}

	.hint-t {
		font-size: 11px;
		color: #A2958A;
		line-height: 1.7;
	}

	.cert-canvas {
		position: fixed;
		left: -2000px;
		top: 0;
		width: 640px;
		height: 460px;
	}
</style>
