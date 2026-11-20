<template>
	<view class="news-page">
		<yl-header title="判例与新闻" sub="真实的案子，真实的判决" back right="刷新" @right="refresh" />

		<view class="yl-app yl-narrow">
			<!-- 说明 -->
			<view class="head">
				<text class="head-t">看看别人是怎么被骗的</text>
				<text class="head-s">每一条都来自真实判决：谁被骗了、骗走多少、骗子判了几年、你该怎么防。点开就能看懂。</text>
				<view class="head-stat">
					<text class="head-stat-n">{{ caseCount }}</text>
					<text class="head-stat-l">个真实判例</text>
				</view>
			</view>

			<!-- 筛选 -->
			<view class="filters">
				<view class="filter" v-for="f in filters" :key="f.key" :class="{ 'filter-on': type === f.key }"
					@click="pick(f.key)">
					<text class="filter-t">{{ f.name }}</text>
					<text class="filter-n">{{ countOf(f.key) }}</text>
				</view>
			</view>

			<!-- 列表 -->
			<view class="list">
				<view class="item" v-for="n in list" :key="n.id" :class="{ 'item-on': openId === n.id }"
					@click="toggle(n.id)">
					<view class="item-top">
						<view class="item-flag" :class="'flag-' + n.type">
							<text class="item-flag-t">{{ typeName(n.type) }}</text>
						</view>
						<text class="item-date">{{ n.date }}</text>
					</view>

					<text class="item-t">{{ n.title }}</text>

					<!-- 案情要素 -->
					<view v-if="n.region || n.amount" class="facts">
						<view class="fact" v-if="n.region">
							<text class="fact-l">案发地</text>
							<text class="fact-v">{{ n.region }}</text>
						</view>
						<view class="fact" v-if="n.happenAt">
							<text class="fact-l">时间</text>
							<text class="fact-v">{{ n.happenAt }}</text>
						</view>
						<view class="fact" v-if="n.amount">
							<text class="fact-l">涉案</text>
							<text class="fact-v fact-v-red">{{ n.amount }}</text>
						</view>
					</view>

					<!-- 导语：只在收起时显示，展开后正文已包含同样内容 -->
					<text v-if="openId !== n.id" class="item-lead">{{ n.lead || n.summary }}</text>

					<view class="item-meta">
						<text class="item-src">{{ n.source }}</text>
						<text class="item-tags" v-for="(t, i) in n.tags" :key="i">#{{ t }}</text>
					</view>

					<view v-if="openId === n.id" class="item-body yl-fade">
						<!-- 正文 -->
						<view v-if="n.body && n.body.length" class="article">
							<text class="para" v-for="(p, i) in n.body" :key="i">{{ p }}</text>
						</view>

						<!-- 判决结果 -->
						<view v-if="n.sentence" class="verdict">
							<text class="verdict-l">法 院 判 决</text>
							<text class="verdict-t">{{ n.sentence }}</text>
						</view>

						<!-- 防骗要点 -->
						<view v-if="n.lesson && n.lesson.length" class="lessons">
							<text class="lessons-h">记住这几点</text>
							<view class="lesson" v-for="(l, i) in n.lesson" :key="i">
								<view class="lesson-dot"></view>
								<text class="lesson-t">{{ l }}</text>
							</view>
						</view>

						<!-- 无结构化内容时的兜底 -->
						<view v-if="!n.body || !n.body.length" class="item-warn">
							<text class="item-warn-t">记住：凡是让你转账、给验证码、共享屏幕的，都是诈骗。</text>
						</view>

						<view class="item-actions">
							<view class="ia" @click.stop="verify">
								<text class="ia-t">去官方渠道核实</text>
							</view>
							<view class="ia ia-ghost" @click.stop="goReport">
								<text class="ia-t2">我要报警</text>
							</view>
						</view>
					</view>
					<view v-else class="item-more">
						<text class="item-more-t">展开读全文 ˅</text>
					</view>
				</view>

				<view v-if="!list.length" class="yl-empty">该分类暂无内容</view>
			</view>

			<view class="foot">
				<text class="foot-t">案例事实、金额与刑期按公开判决整理，具体以官方发布为准</text>
			</view>

			<view class="yl-safe-bottom"></view>
		</view>

		<yl-sos />
	</view>
</template>

<script>
	import db from '@/utils/store.js'
	import auth from '@/utils/auth.js'

	export default {
		data() {
			return {
				type: 'all',
				openId: '',
				all: [],
				filters: [{
						key: 'all',
						name: '全部'
					},
					{
						key: 'case',
						name: '司法判例'
					},
					{
						key: 'news',
						name: '新闻报道'
					},
					{
						key: 'alert',
						name: '预警通告'
					}
				]
			}
		},
		computed: {
			list() {
				this.all.length // 依赖
				return this.type === 'all' ? this.all : this.all.filter(n => n.type === this.type)
			},
			caseCount() {
				return this.all.filter(n => n.type === 'case').length
			}
		},
		onLoad() {
			auth.requireUser()
			this.load()
		},
		onShow() {
			db.trackPage('判例新闻')
			this.load()
		},
		methods: {
			load() {
				this.all = db.getNews('all')
			},
			pick(k) {
				this.type = k
				this.openId = ''
			},
			countOf(k) {
				if (k === 'all') return this.all.length
				return this.all.filter(n => n.type === k).length
			},
			typeName(t) {
				return t === 'case' ? '判例' : t === 'alert' ? '预警' : '新闻'
			},
			toggle(id) {
				this.openId = this.openId === id ? '' : id
			},
			refresh() {
				this.load()
				uni.showToast({
					title: '已是最新内容',
					icon: 'none'
				})
			},
			verify() {
				uni.showModal({
					title: '核实渠道',
					content: '可拨打 96110 反诈专线咨询，或访问中国裁判文书网（wenshu.court.gov.cn）查询公开判例。',
					confirmText: '拨打 96110',
					success: (res) => {
						if (res.confirm) {
							uni.makePhoneCall({
								phoneNumber: '96110'
							})
						}
					}
				})
			},
			goReport() {
				uni.navigateTo({
					url: '/pages/report/report'
				})
			}
		}
	}
</script>

<style>
	.news-page {
		min-height: 100vh;
		background: #FBF4EC;
	}

	.head {
		padding: 16px 2px 0;
	}

	.head-t {
		display: block;
		font-size: 22px;
		font-weight: 800;
		line-height: 1.35;
	}

	.head-s {
		display: block;
		font-size: 12px;
		color: #8A7C6D;
		line-height: 1.7;
		margin-top: 6px;
	}

	.head-stat {
		display: inline-flex;
		align-items: baseline;
		gap: 4px;
		margin-top: 10px;
		background: #2B1A12;
		border-radius: 999px;
		padding: 5px 14px;
	}

	.head-stat-n {
		font-size: 16px;
		font-weight: 800;
		color: #FFD9AE;
		font-variant-numeric: tabular-nums;
	}

	.head-stat-l {
		font-size: 11px;
		color: #D6B79A;
	}

	/* 筛选 */
	.filters {
		display: flex;
		gap: 8px;
		margin-top: 14px;
		overflow-x: auto;
	}

	.filter {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 9px 14px;
		border-radius: 14px;
		background: #fff;
		border: 1px solid #EFE0CE;
		white-space: nowrap;
		flex: 0 0 auto;
	}

	.filter-t {
		font-size: 14px;
		color: #6C5C4C;
		flex: 0 0 auto;
		white-space: nowrap;
	}

	.filter-n {
		font-size: 11px;
		color: #B4A697;
		background: #F6EEE4;
		border-radius: 999px;
		padding: 0 6px;
	}

	.filter-on {
		background: #2B1A12;
		border-color: #2B1A12;
	}

	.filter-on .filter-t {
		color: #FFE9D2;
		font-weight: 700;
	}

	.filter-on .filter-n {
		background: rgba(255, 255, 255, .16);
		color: #FFD9AE;
	}

	/* 列表 */
	.list {
		margin-top: 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.item {
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 16px;
		padding: 14px;
		box-shadow: 0 2px 10px rgba(160, 120, 80, .06);
	}

	.item-on {
		border-color: #E5C7A6;
		box-shadow: 0 6px 18px rgba(160, 120, 80, .12);
	}

	.item-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.item-flag {
		padding: 2px 8px;
		border-radius: 6px;
		flex: 0 0 auto;
	}

	.flag-case {
		background: #E9F1FA;
	}

	.flag-case .item-flag-t {
		color: #1F5C8F;
	}

	.flag-news {
		background: #E8F6F0;
	}

	.flag-news .item-flag-t {
		color: #1D7F5F;
	}

	.flag-alert {
		background: #FCEBE9;
	}

	.flag-alert .item-flag-t {
		color: #C8332B;
	}

	.item-flag-t {
		font-size: 11px;
		font-weight: 600;
	}

	.item-date {
		font-size: 11px;
		color: #B4A697;
		font-variant-numeric: tabular-nums;
	}

	.item-t {
		display: block;
		font-size: 17px;
		font-weight: 700;
		line-height: 1.5;
		margin-top: 10px;
		color: #241A13;
	}

	/* 案情要素条 */
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		margin-top: 10px;
		padding: 9px 0;
		border-top: 1px dashed #F0E0CC;
		border-bottom: 1px dashed #F0E0CC;
	}

	.fact {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 0 0 auto;
	}

	.fact-l {
		font-size: 10px;
		color: #B4A697;
	}

	.fact-v {
		font-size: 13px;
		color: #4E4640;
		font-weight: 700;
		white-space: nowrap;
	}

	.fact-v-red {
		color: #C8332B;
	}

	/* 导语 */
	.item-lead {
		display: -webkit-box;
		font-size: 13px;
		color: #6C6055;
		line-height: 1.75;
		margin-top: 10px;
		overflow: hidden;
		text-overflow: ellipsis;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.item-lead-full {
		display: block;
		-webkit-line-clamp: 99;
	}

	.item-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
	}

	.item-src {
		font-size: 11px;
		color: #A2958A;
	}

	.item-tags {
		font-size: 11px;
		color: #C08A5A;
	}

	.item-more {
		margin-top: 10px;
	}

	.item-more-t {
		font-size: 12px;
		color: #C08A5A;
		font-weight: 600;
	}

	.item-body {
		margin-top: 12px;
		border-top: 1px solid #F5EADB;
		padding-top: 14px;
	}

	/* 正文 */
	.article {
		margin-bottom: 4px;
	}

	.para {
		display: block;
		font-size: 15px;
		color: #3B332C;
		line-height: 1.95;
		margin-bottom: 12px;
		text-align: justify;
	}

	/* 判决 */
	.verdict {
		background: #FDF1EF;
		border-left: 3px solid #C8332B;
		border-radius: 0 12px 12px 0;
		padding: 11px 14px;
	}

	.verdict-l {
		display: block;
		font-size: 10px;
		font-weight: 700;
		color: #C8332B;
		letter-spacing: 1px;
	}

	.verdict-t {
		display: block;
		font-size: 14px;
		color: #8C2A22;
		line-height: 1.7;
		font-weight: 700;
		margin-top: 3px;
	}

	/* 要点 */
	.lessons {
		margin-top: 12px;
		background: #FFF9F0;
		border: 1px solid #F3E3CE;
		border-radius: 12px;
		padding: 12px 14px;
	}

	.lessons-h {
		display: block;
		font-size: 13px;
		font-weight: 700;
		color: #8A4B2A;
		margin-bottom: 9px;
	}

	.lesson {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}

	.lesson:last-child {
		margin-bottom: 0;
	}

	.lesson-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #C8332B;
		margin-top: 8px;
		flex: 0 0 auto;
	}

	.lesson-t {
		font-size: 13px;
		color: #4E4640;
		line-height: 1.75;
		flex: 1;
	}

	.item-warn {
		margin-top: 12px;
		background: #FDF1EF;
		border-left: 3px solid #C8332B;
		border-radius: 0 10px 10px 0;
		padding: 10px 12px;
	}

	.item-warn-t {
		font-size: 12px;
		color: #A8241C;
		line-height: 1.7;
	}

	.item-actions {
		display: flex;
		gap: 10px;
		margin-top: 14px;
	}

	.ia {
		flex: 1;
		height: 42px;
		border-radius: 21px;
		background: #C8332B;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ia-ghost {
		background: #fff;
		border: 1px solid #E9D5BF;
	}

	.ia-t {
		font-size: 14px;
		font-weight: 600;
		color: #fff;
	}

	.ia-t2 {
		font-size: 14px;
		font-weight: 600;
		color: #8A4B2A;
	}

	.foot {
		text-align: center;
		padding: 22px 0 8px;
	}

	.foot-t {
		font-size: 11px;
		color: #C0B2A2;
	}
</style>
