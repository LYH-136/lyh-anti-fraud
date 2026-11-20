<template>
	<view class="sos" @click="go">
		<view class="sos-pulse"></view>
		<view class="sos-btn">
			<text class="sos-ico">☎</text>
			<text class="sos-t">求助</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'yl-sos',
		methods: {
			go() {
				uni.navigateTo({
					url: '/pages/report/report'
				})
			}
		}
	}
</script>

<style>
	.sos {
		position: fixed;
		right: 16px;
		bottom: 92px;
		width: 64px;
		height: 64px;
		z-index: 80;
	}

	.sos-pulse {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		border-radius: 50%;
		background: rgba(200, 51, 43, .28);
		animation: sosPulse 2.2s ease-out infinite;
	}

	.sos-btn {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		border-radius: 50%;
		background: linear-gradient(140deg, #D63B2F, #B3271F);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 20px rgba(180, 40, 32, .38);
		border: 2px solid rgba(255, 255, 255, .6);
	}

	.sos-ico {
		font-size: 17px;
		line-height: 1;
		color: #FFE7C9;
	}

	.sos-t {
		font-size: 14px;
		font-weight: 700;
		color: #fff;
		line-height: 1.2;
		letter-spacing: 1px;
	}

	@keyframes sosPulse {
		0% {
			transform: scale(1);
			opacity: .75;
		}

		70% {
			transform: scale(1.35);
			opacity: 0;
		}

		100% {
			opacity: 0;
		}
	}
</style>
