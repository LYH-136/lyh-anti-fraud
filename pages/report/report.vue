<template>
	<view class="report">
		<yl-header title="一键报警" sub="真的能拨通，不用记号码" back right="收藏本页" @right="tipFav" />

		<view class="yl-app yl-narrow">
			<!-- 紧急主按钮 -->
			<view class="sos-main" @click="call('110')">
				<view class="sos-main-l">
					<text class="sos-main-t">已经转账、正在被骗</text>
					<text class="sos-main-n">110</text>
					<text class="sos-main-s">点击直接拨号，接通后说清：什么时间、转了多少、转给谁</text>
				</view>
				<view class="sos-main-btn">
					<text class="sos-main-btn-t">立即拨打</text>
				</view>
			</view>

			<!-- 四条热线 -->
			<view class="yl-card-hd" style="margin-top:20px">
				<text class="yl-h2">常用反诈热线</text>
				<text class="yl-sub">点一下就能拨</text>
			</view>

			<view class="lines">
				<view class="line-card" v-for="l in lines" :key="l.phone" @click="call(l.phone)">
					<view class="line-l">
						<text class="line-n">{{ l.phone }}</text>
						<text class="line-name">{{ l.name }}</text>
						<text class="line-d">{{ l.desc }}</text>
					</view>
					<view class="line-btn" :style="{ background: l.color }">
						<text class="line-btn-t">拨打</text>
					</view>
				</view>
			</view>

			<!-- 被骗三步 -->
			<view class="yl-card yl-section">
				<text class="yl-h3">被骗后的黄金三步</text>
				<view class="steps">
					<view class="step" v-for="(s, i) in steps" :key="i">
						<view class="step-l">
							<text class="step-n">{{ i + 1 }}</text>
							<view v-if="i < steps.length - 1" class="step-bar"></view>
						</view>
						<view class="step-body">
							<text class="step-t">{{ s.t }}</text>
							<text class="step-d">{{ s.d }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 银行挂失 -->
			<view class="yl-card yl-section">
				<view class="yl-card-hd">
					<text class="yl-h3">银行卡挂失</text>
					<text class="yl-sub">先冻结，再报警</text>
				</view>
				<view class="banks">
					<view class="bank" v-for="b in banks" :key="b.phone" @click="call(b.phone)">
						<text class="bank-n">{{ b.name }}</text>
						<text class="bank-p">{{ b.phone }}</text>
					</view>
				</view>
				<text class="bank-tip">不知道是哪家银行？先打 110，警察会指导你顺序挂失。</text>
			</view>

			<!-- 举报渠道 -->
			<view class="yl-card yl-section">
				<text class="yl-h3">线上举报</text>
				<view class="report-link" v-for="(r, i) in links" :key="i" @click="openUrl(r.url)">
					<view class="report-link-l">
						<text class="report-link-t">{{ r.name }}</text>
						<text class="report-link-s">{{ r.desc }}</text>
					</view>
					<text class="report-link-a">前往 ›</text>
				</view>
			</view>

			<!-- 口诀 -->
			<view class="chant">
				<text class="chant-t">反诈八问</text>
				<view class="chant-row">
					<text class="chant-i" v-for="(c, i) in chants" :key="i">{{ c }}</text>
				</view>
			</view>

			<view class="yl-safe-bottom"></view>
		</view>
	</view>
</template>

<script>
	import db from '@/utils/store.js'
	import auth from '@/utils/auth.js'
	import {
		POLICE_LINES,
		BANK_HOTLINES
	} from '@/utils/seed.js'

	export default {
		data() {
			return {
				lines: POLICE_LINES,
				banks: BANK_HOTLINES,
				steps: [{
						t: '立刻止付',
						d: '接到 110 后说明情况，按提示联系银行冻结账户；已经转账的，越快越可能拦住。'
					},
					{
						t: '保存证据',
						d: '不要删聊天记录、通话记录和转账凭证，截图保存对方的账号、收款码和网址。'
					},
					{
						t: '正式报案',
						d: '带上身份证、银行卡和证据到就近派出所报案，拿到受案回执，后续可查询进展。'
					}
				],
				links: [{
						name: '12321 网络不良信息举报',
						desc: '举报诈骗电话、短信、垃圾信息',
						url: 'https://www.12321.cn'
					},
					{
						name: '网络违法犯罪举报网站',
						desc: '举报涉诈网站、App、账号',
						url: 'http://www.cyberpolice.cn'
					},
					{
						name: '国家反诈中心 App',
						desc: '来电预警、身份核实、一键举报',
						url: 'https://www.mps.gov.cn'
					}
				],
				chants: ['不听', '不信', '不转账', '不给验证码', '不点链接', '不扫陌生码', '不共享屏幕', '不秘密转账']
			}
		},
		onLoad() {
			auth.requireUser()
		},
		onShow() {
			db.trackPage('一键报警')
		},
		methods: {
			call(phone) {
				uni.makePhoneCall({
					phoneNumber: phone,
					fail: () => {
						uni.showToast({
							title: '当前设备不支持拨号，请用手机拨打 ' + phone,
							icon: 'none'
						})
					}
				})
			},
			openUrl(url) {
				try {
					if (typeof window !== 'undefined') {
						window.open(url, '_blank')
						return
					}
				} catch (e) {}
				uni.showToast({
					title: '请复制网址在浏览器打开：' + url,
					icon: 'none'
				})
			},
			tipFav() {
				uni.showToast({
					title: '建议把本页加入收藏，紧急时一秒找到',
					icon: 'none'
				})
			}
		}
	}
</script>

<style>
	.report {
		min-height: 100vh;
		background: #FFF7F4;
	}

	/* 主按钮 */
	.sos-main {
		margin-top: 16px;
		background: linear-gradient(150deg, #C8332B, #9C2019);
		border-radius: 20px;
		padding: 20px 18px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		box-shadow: 0 12px 28px rgba(170, 40, 30, .3);
	}

	.sos-main-l {
		flex: 1;
		min-width: 0;
	}

	.sos-main-t {
		display: block;
		font-size: 13px;
		color: rgba(255, 255, 255, .82);
	}

	.sos-main-n {
		display: block;
		font-size: 54px;
		font-weight: 800;
		color: #fff;
		line-height: 1.05;
		letter-spacing: 2px;
	}

	.sos-main-s {
		display: block;
		font-size: 11px;
		color: rgba(255, 255, 255, .72);
		line-height: 1.5;
		margin-top: 4px;
	}

	.sos-main-btn {
		flex: 0 0 auto;
		background: #fff;
		border-radius: 999px;
		padding: 14px 20px;
		box-shadow: 0 6px 14px rgba(0, 0, 0, .16);
	}

	.sos-main-btn-t {
		font-size: 16px;
		font-weight: 800;
		color: #C8332B;
	}

	/* 热线 */
	.lines {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.line-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		background: #fff;
		border: 1px solid #F5DCD5;
		border-radius: 16px;
		padding: 14px;
		box-shadow: 0 2px 10px rgba(170, 100, 90, .06);
	}

	.line-l {
		flex: 1;
		min-width: 0;
	}

	.line-n {
		display: block;
		font-size: 26px;
		font-weight: 800;
		color: #B3271F;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.line-name {
		display: block;
		font-size: 14px;
		font-weight: 600;
		color: #4A4038;
		margin-top: 3px;
	}

	.line-d {
		display: block;
		font-size: 11px;
		color: #A2958A;
		margin-top: 2px;
	}

	.line-btn {
		flex: 0 0 auto;
		height: 44px;
		padding: 0 22px;
		border-radius: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.line-btn-t {
		font-size: 15px;
		font-weight: 700;
		color: #fff;
	}

	/* 步骤 */
	.steps {
		margin-top: 14px;
	}

	.step {
		display: flex;
		gap: 12px;
	}

	.step-l {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.step-n {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: #FDEDE9;
		color: #C8332B;
		font-size: 13px;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.step-bar {
		width: 2px;
		flex: 1;
		min-height: 26px;
		background: #F3E0DA;
		margin: 2px 0;
	}

	.step-body {
		flex: 1;
		min-width: 0;
		padding-bottom: 14px;
	}

	.step-t {
		display: block;
		font-size: 15px;
		font-weight: 700;
		color: #2B2B2B;
	}

	.step-d {
		display: block;
		font-size: 13px;
		color: #6C6357;
		line-height: 1.7;
		margin-top: 4px;
	}

	/* 银行 */
	.banks {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.bank {
		flex: 1 1 140px;
		background: #FBF6EE;
		border: 1px solid #F0E2D2;
		border-radius: 12px;
		padding: 10px 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.bank-n {
		font-size: 13px;
		color: #4A4038;
	}

	.bank-p {
		font-size: 14px;
		font-weight: 700;
		color: #B3271F;
		font-variant-numeric: tabular-nums;
	}

	.bank-tip {
		display: block;
		font-size: 11px;
		color: #A2958A;
		margin-top: 10px;
		line-height: 1.6;
	}

	/* 举报 */
	.report-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 0;
		border-top: 1px solid #F5EADB;
		gap: 10px;
	}

	.report-link-l {
		flex: 1;
		min-width: 0;
	}

	.report-link-t {
		display: block;
		font-size: 14px;
		font-weight: 600;
	}

	.report-link-s {
		display: block;
		font-size: 11px;
		color: #A2958A;
		margin-top: 2px;
	}

	.report-link-a {
		font-size: 13px;
		color: #C8332B;
		flex: 0 0 auto;
	}

	/* 口诀 */
	.chant {
		margin-top: 18px;
		background: #2B1A12;
		border-radius: 18px;
		padding: 16px;
	}

	.chant-t {
		display: block;
		font-size: 13px;
		color: #FFC98C;
		letter-spacing: 3px;
		margin-bottom: 10px;
	}

	.chant-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chant-i {
		font-size: 13px;
		color: #FFE9D2;
		background: rgba(255, 255, 255, .1);
		border-radius: 8px;
		padding: 6px 12px;
	}
</style>
