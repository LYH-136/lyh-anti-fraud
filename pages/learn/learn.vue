<template>
	<view class="learn">
		<yl-header title="反诈学习中心" sub="按诈骗类型分类学习" back right="我的" @right="goMine" />

		<view class="yl-app">
			<!-- 学习总览 -->
			<view class="board">
				<view class="board-l">
					<text class="board-l-t">我的累计学习时长</text>
					<view class="board-l-n">
						<text class="board-l-num">{{ learnMinutes }}</text>
						<text class="board-l-unit">分钟</text>
					</view>
					<view class="board-l-row">
						<text class="board-l-s">已学完 {{ doneCount }} / {{ videos.length }} 个视频</text>
					</view>
				</view>
				<view class="board-r">
					<view class="ring">
						<text class="ring-n">{{ pct }}%</text>
					</view>
					<text class="ring-l">完成进度</text>
				</view>
			</view>

			<!-- 分类 -->
			<view class="cats-wrap">
				<scroll-view class="cats" scroll-x :show-scrollbar="false">
					<view class="cats-in">
						<view class="cat" :class="{ 'cat-on': activeCat === 'all' }" @click="pickCat('all')">
							<text class="cat-e">🗂</text>
							<text class="cat-n">全部</text>
						</view>
						<view v-for="c in cats" :key="c.key" class="cat" :class="{ 'cat-on': activeCat === c.key }"
							@click="pickCat(c.key)">
							<text class="cat-e">{{ c.emoji }}</text>
							<text class="cat-n">{{ c.name }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 当前分类提示 -->
			<view v-if="activeTip" class="essence">
				<text class="essence-q">一句话记住</text>
				<text class="essence-t">{{ activeTip }}</text>
			</view>

			<!-- 视频列表 -->
			<view class="list">
				<view class="vcard" v-for="v in list" :key="v.id" @click="goDetail(v)">
					<view class="vcover" :style="{ background: coverStyle(v) }">
						<image v-if="v.poster" class="vcover-img" :src="v.poster" mode="aspectFill"></image>
						<text v-else class="vcover-e">{{ catEmoji(v.cat) }}</text>
						<view v-if="v.poster" class="vcover-shade"></view>
						<view class="vcover-play">
							<text class="vcover-play-t">▶</text>
						</view>
						<text class="vcover-dur">{{ mmss(v.duration) }}</text>
						<text v-if="isDone(v.id)" class="vcover-done">已学完</text>
					</view>
					<view class="vbody">
						<text class="vtitle yl-clamp2">{{ v.title }}</text>
						<view class="vmeta">
							<text class="yl-tag" :style="{ background: catColor(v.cat) + '18', color: catColor(v.cat) }">
								{{ catName(v.cat) }}
							</text>
							<text class="vmeta-s">{{ v.views }} 人学过</text>
						</view>
						<view class="vprog">
							<view class="yl-progress">
								<view class="yl-pbar" :style="{ width: progPct(v) + '%' }"></view>
							</view>
							<text class="vprog-t">{{ progText(v) }}</text>
						</view>
					</view>
				</view>

				<view v-if="!list.length" class="yl-empty">该分类下暂无视频，管理员可在后台上传</view>
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

	export default {
		data() {
			return {
				user: null,
				cats: [],
				activeCat: 'all',
				videos: [],
				progress: {}
			}
		},
		computed: {
			list() {
				if (this.activeCat === 'all') return this.videos
				return this.videos.filter(v => v.cat === this.activeCat)
			},
			activeTip() {
				if (this.activeCat === 'all') return ''
				const c = this.cats.find(x => x.key === this.activeCat)
				return c ? c.essence : ''
			},
			learnSeconds() {
				let s = 0
				Object.keys(this.progress).forEach(k => {
					s += this.progress[k].seconds || 0
				})
				return s
			},
			learnMinutes() {
				return Math.round(this.learnSeconds / 60)
			},
			doneCount() {
				let n = 0
				Object.keys(this.progress).forEach(k => {
					if (this.progress[k].done) n += 1
				})
				return n
			},
			pct() {
				if (!this.videos.length) return 0
				return Math.round(this.doneCount / this.videos.length * 100)
			}
		},
		onLoad(opt) {
			const s = auth.requireUser()
			if (!s) return
			this.user = s
			this.cats = db.getCategories()
			if (opt && opt.cat) this.activeCat = opt.cat
			this.load()
		},
		onShow() {
			db.trackPage('学习中心')
			this.load()
		},
		methods: {
			load() {
				this.videos = db.getVideos()
				this.progress = this.user ? db.getProgress(this.user.username) : {}
			},
			pickCat(k) {
				this.activeCat = k
			},
			mmss(v) {
				return fmt.mmss(v)
			},
			isDone(id) {
				return !!(this.progress[id] && this.progress[id].done)
			},
			progPct(v) {
				const p = this.progress[v.id]
				if (!p) return 0
				if (p.done) return 100
				return Math.min(99, Math.round((p.seconds || 0) / v.duration * 100))
			},
			progText(v) {
				const p = this.progress[v.id]
				if (!p || !p.seconds) return '还没开始'
				if (p.done) return '已完成'
				return '已看 ' + Math.round((p.seconds || 0) / v.duration * 100) + '%'
			},
			catName(k) {
				const c = this.cats.find(x => x.key === k)
				return c ? c.name : '其他'
			},
			catEmoji(k) {
				const c = this.cats.find(x => x.key === k)
				return c ? c.emoji : '🎬'
			},
			catColor(k) {
				const c = this.cats.find(x => x.key === k)
				return c ? c.color : '#C8332B'
			},
			coverStyle(v) {
				const c = this.catColor(v.cat)
				return 'linear-gradient(135deg,' + c + '2E,' + c + '70)'
			},
			goDetail(v) {
				uni.navigateTo({
					url: '/pages/learn/detail?id=' + v.id
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
	.learn {
		min-height: 100vh;
		background: #FBF4EC;
	}

	/* 总览 */
	.board {
		margin-top: 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: linear-gradient(150deg, #B3271F 0%, #C8332B 45%, #E8622C 100%);
		border-radius: 20px;
		padding: 18px;
		box-shadow: 0 10px 24px rgba(180, 60, 40, .22);
		position: relative;
		overflow: hidden;
	}

	.board-l {
		flex: 1;
		min-width: 0;
	}

	.board-l-t {
		display: block;
		font-size: 13px;
		color: rgba(255, 255, 255, .82);
	}

	.board-l-n {
		display: flex;
		align-items: baseline;
		gap: 4px;
		margin-top: 2px;
	}

	.board-l-num {
		font-size: 38px;
		font-weight: 800;
		color: #fff;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.board-l-unit {
		font-size: 14px;
		color: rgba(255, 255, 255, .88);
	}

	.board-l-row {
		margin-top: 6px;
	}

	.board-l-s {
		font-size: 12px;
		color: rgba(255, 255, 255, .78);
	}

	.board-r {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.ring {
		width: 76px;
		height: 76px;
		border-radius: 50%;
		border: 4px solid rgba(255, 255, 255, .35);
		border-top-color: #FFE0B8;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, .12);
	}

	.ring-n {
		font-size: 19px;
		font-weight: 700;
		color: #fff;
	}

	.ring-l {
		font-size: 11px;
		color: rgba(255, 255, 255, .8);
	}

	/* 分类 */
	.cats-wrap {
		margin: 16px -16px 0;
	}

	.cats {
		width: 100%;
		white-space: nowrap;
	}

	.cats-in {
		display: inline-flex;
		gap: 8px;
		padding: 0 16px 4px;
	}

	.cat {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 9px 14px;
		border-radius: 14px;
		background: #fff;
		border: 1px solid #EFE0CE;
		white-space: nowrap;
		flex: 0 0 auto;
	}

	.cat-e {
		font-size: 15px;
		flex: 0 0 auto;
	}

	.cat-n {
		font-size: 14px;
		color: #6C5C4C;
		flex: 0 0 auto;
		white-space: nowrap;
	}

	.cat-on {
		background: #C8332B;
		border-color: #C8332B;
		box-shadow: 0 4px 12px rgba(200, 51, 43, .24);
	}

	.cat-on .cat-n {
		color: #fff;
		font-weight: 700;
	}

	.essence {
		margin-top: 14px;
		background: #FFF6EC;
		border: 1px dashed #E7C9A6;
		border-radius: 14px;
		padding: 12px 14px;
	}

	.essence-q {
		display: block;
		font-size: 11px;
		color: #B98A5E;
		letter-spacing: 1px;
		margin-bottom: 3px;
	}

	.essence-t {
		font-size: 14px;
		color: #7A5330;
		line-height: 1.6;
		font-weight: 600;
	}

	/* 视频卡 */
	.list {
		margin-top: 14px;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.vcard {
		flex: 1 1 320px;
		min-width: 0;
		background: #fff;
		border: 1px solid #F2E4D4;
		border-radius: 18px;
		overflow: hidden;
		box-shadow: 0 3px 12px rgba(160, 120, 80, .07);
	}

	.vcover {
		position: relative;
		height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.vcover-img {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.vcover-shade {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 62px;
		background: linear-gradient(to top, rgba(24, 12, 6, .62), rgba(24, 12, 6, 0));
	}

	.vcover-e {
		font-size: 40px;
		opacity: .9;
	}

	.vcover-play {
		position: absolute;
		width: 46px;
		height: 46px;
		border-radius: 50%;
		background: rgba(255, 255, 255, .88);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, .14);
	}

	.vcover-play-t {
		font-size: 15px;
		color: #C8332B;
		margin-left: 2px;
	}

	.vcover-dur {
		position: absolute;
		right: 10px;
		bottom: 8px;
		font-size: 11px;
		color: #fff;
		background: rgba(0, 0, 0, .5);
		padding: 2px 6px;
		border-radius: 5px;
		font-variant-numeric: tabular-nums;
	}

	.vcover-done {
		position: absolute;
		left: 10px;
		top: 8px;
		font-size: 11px;
		color: #fff;
		background: #1D7F5F;
		padding: 2px 8px;
		border-radius: 5px;
	}

	.vbody {
		padding: 12px 14px 14px;
	}

	.vtitle {
		font-size: 15px;
		font-weight: 600;
		line-height: 1.5;
	}

	.vmeta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
	}

	.vmeta-s {
		font-size: 11px;
		color: #B4A697;
	}

	.vprog {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 10px;
	}

	.vprog .yl-progress {
		flex: 1;
	}

	.vprog-t {
		font-size: 11px;
		color: #A2958A;
		flex: 0 0 auto;
	}
</style>
