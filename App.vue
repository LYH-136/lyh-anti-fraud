<script>
	import { initSeed, touchSession } from './utils/store.js'

	export default {
		onLaunch: function() {
			// 首次启动写入种子数据（视频 / 题库 / 任务 / 新闻 / 演示统计）
			initSeed()
			// 生成或读取本机会话标识，用于 UV 去重
			touchSession()
		},
		onShow: function() {},
		onHide: function() {}
	}
</script>

<style>
	/* ============ 全局基础 ============ */
	page {
		background: #FBF4EC;
		color: #2B2B2B;
		font-size: 16px;
		line-height: 1.6;
		font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	/* ============ 布局 ============ */
	.yl-app {
		max-width: 1020px;
		margin: 0 auto;
		padding: 0 16px 48px;
		box-sizing: border-box;
	}

	.yl-narrow {
		max-width: 860px;
	}

	.yl-section {
		margin-top: 22px;
	}

	.yl-row {
		display: flex;
		align-items: center;
	}

	.yl-between {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.yl-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.yl-grid>.cell {
		flex: 1 1 260px;
		min-width: 0;
	}

	.yl-grid-3>.cell {
		flex: 1 1 200px;
	}

	/* ============ 文字 ============ */
	.yl-h1 {
		font-size: 28px;
		font-weight: 700;
		line-height: 1.3;
		letter-spacing: .5px;
	}

	.yl-h2 {
		font-size: 21px;
		font-weight: 700;
		line-height: 1.4;
	}

	.yl-h3 {
		font-size: 17px;
		font-weight: 600;
		line-height: 1.5;
	}

	.yl-sub {
		font-size: 14px;
		color: #8A7C6D;
	}

	.yl-muted {
		font-size: 13px;
		color: #A2958A;
	}

	.yl-num {
		font-size: 26px;
		font-weight: 700;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.yl-ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.yl-clamp2 {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	/* ============ 卡片 ============ */
	.yl-card {
		background: #FFFFFF;
		border: 1px solid #F2E4D4;
		border-radius: 16px;
		padding: 16px;
		box-sizing: border-box;
		box-shadow: 0 2px 10px rgba(160, 120, 80, .07);
	}

	.yl-card-flat {
		background: #FFFFFF;
		border: 1px solid #F2E4D4;
		border-radius: 14px;
		padding: 14px;
		box-sizing: border-box;
	}

	.yl-card-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.yl-divider {
		height: 1px;
		background: #F3E7D8;
		margin: 14px 0;
	}

	/* ============ 按钮 ============ */
	.yl-btn {
		height: 52px;
		padding: 0 22px;
		border-radius: 26px;
		font-size: 17px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		border: none;
		line-height: 1;
	}

	.yl-btn-lg {
		height: 62px;
		font-size: 19px;
		border-radius: 31px;
	}

	.yl-btn-block {
		width: 100%;
	}

	.yl-btn-primary {
		background: #C8332B;
		color: #fff;
		box-shadow: 0 6px 16px rgba(200, 51, 43, .25);
	}

	.yl-btn-ghost {
		background: #fff;
		color: #8A4B2A;
		border: 1px solid #E9D5BF;
	}

	.yl-btn-soft {
		background: #FDEDE9;
		color: #C8332B;
	}

	.yl-btn-danger {
		background: #D63B2F;
		color: #fff;
	}

	.yl-btn:active {
		opacity: .86;
	}

	.yl-btn[disabled] {
		opacity: .5;
	}

	/* ============ 标签 / 胶囊 ============ */
	.yl-chip {
		padding: 7px 14px;
		border-radius: 999px;
		background: #fff;
		border: 1px solid #EDDCC8;
		font-size: 14px;
		color: #6C5C4C;
		line-height: 1.2;
	}

	.yl-chip-on {
		background: #C8332B;
		border-color: #C8332B;
		color: #fff;
		font-weight: 600;
	}

	.yl-tag {
		display: inline-flex;
		align-items: center;
		padding: 2px 9px;
		border-radius: 6px;
		font-size: 12px;
		line-height: 1.7;
		background: #F6EEE4;
		color: #8A6A4A;
	}

	.yl-tag-red {
		background: #FCEBE9;
		color: #C8332B;
	}

	.yl-tag-green {
		background: #E8F6F0;
		color: #1D7F5F;
	}

	.yl-tag-blue {
		background: #E9F1FA;
		color: #1F5C8F;
	}

	/* ============ 进度条 ============ */
	.yl-progress {
		height: 8px;
		background: #F3E7D8;
		border-radius: 999px;
		overflow: hidden;
	}

	.yl-progress>.yl-pbar {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, #E8622C, #C8332B);
		border-radius: 999px;
		transition: width .4s ease;
	}

	/* ============ 表单 ============ */
	.yl-field {
		margin-bottom: 14px;
	}

	.yl-label {
		font-size: 15px;
		color: #6C5C4C;
		margin-bottom: 8px;
	}

	.yl-input {
		height: 54px;
		background: #fff;
		border: 1px solid #EAD9C6;
		border-radius: 14px;
		padding: 0 16px;
		font-size: 17px;
		box-sizing: border-box;
		color: #2B2B2B;
	}

	.yl-textarea {
		background: #fff;
		border: 1px solid #EAD9C6;
		border-radius: 14px;
		padding: 12px 16px;
		font-size: 16px;
		width: 100%;
		box-sizing: border-box;
		min-height: 96px;
	}

	.yl-textarea-lg {
		min-height: 210px;
		line-height: 1.7;
	}

	/* ============ 空态 ============ */
	.yl-empty {
		padding: 44px 16px;
		text-align: center;
		color: #A2958A;
		font-size: 15px;
	}

	/* ============ 动效 ============ */
	.yl-fade {
		animation: ylFade .35s ease both;
	}

	@keyframes ylFade {
		from {
			opacity: 0;
			transform: translateY(8px);
		}

		to {
			opacity: 1;
			transform: none;
		}
	}

	/* ============ 底部安全区 ============ */
	.yl-safe-bottom {
		height: calc(16px + env(safe-area-inset-bottom));
	}
</style>
