<template>
	<view class="hdr">
		<view class="hdr-in">
			<view class="hdr-side" @click="onLeft">
				<view v-if="back" class="hdr-back">
					<text class="hdr-back-ico">‹</text>
				</view>
				<view v-else class="hdr-logo">
					<text class="hdr-logo-t">银</text>
				</view>
			</view>

			<view class="hdr-mid">
				<text class="hdr-title">{{title}}</text>
				<text v-if="sub" class="hdr-sub">{{sub}}</text>
			</view>

			<view class="hdr-side hdr-side-r" @click="$emit('right')">
				<text v-if="right" class="hdr-right">{{right}}</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'yl-header',
		props: {
			title: {
				type: String,
				default: ''
			},
			sub: {
				type: String,
				default: ''
			},
			back: {
				type: Boolean,
				default: false
			},
			right: {
				type: String,
				default: ''
			},
			home: {
				type: String,
				default: '/pages/index/index'
			}
		},
		methods: {
			onLeft() {
				if (!this.back) return
				const pages = getCurrentPages()
				if (pages.length > 1) {
					uni.navigateBack({ delta: 1 })
				} else {
					uni.reLaunch({ url: this.home })
				}
			}
		}
	}
</script>

<style>
	.hdr {
		position: sticky;
		top: 0;
		z-index: 90;
		background: rgba(251, 244, 236, .94);
		backdrop-filter: saturate(180%) blur(12px);
		-webkit-backdrop-filter: saturate(180%) blur(12px);
		border-bottom: 1px solid rgba(200, 170, 140, .18);
	}

	.hdr-in {
		max-width: 1020px;
		margin: 0 auto;
		height: 58px;
		padding: 0 12px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
	}

	.hdr-side {
		min-width: 52px;
		height: 44px;
		display: flex;
		align-items: center;
		flex: 0 0 auto;
	}

	.hdr-side-r {
		justify-content: flex-end;
		padding-left: 8px;
	}

	.hdr-back {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: #fff;
		border: 1px solid #EFE0CE;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hdr-back-ico {
		font-size: 26px;
		line-height: 1;
		color: #8A4B2A;
		margin-top: -4px;
	}

	.hdr-logo {
		width: 34px;
		height: 34px;
		border-radius: 11px;
		background: linear-gradient(135deg, #E8622C, #C8332B);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 10px rgba(200, 51, 43, .22);
	}

	.hdr-logo-t {
		color: #fff;
		font-size: 17px;
		font-weight: 700;
		line-height: 1;
	}

	.hdr-mid {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.hdr-title {
		font-size: 17px;
		font-weight: 700;
		color: #2B2B2B;
		line-height: 1.3;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hdr-sub {
		font-size: 11px;
		color: #A2958A;
		line-height: 1.3;
	}

	.hdr-right {
		font-size: 14px;
		color: #C8332B;
		font-weight: 600;
		white-space: nowrap;
		line-height: 1.2;
	}
</style>
