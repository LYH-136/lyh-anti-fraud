<template>
	<view class="admin">
		<yl-header title="管理后台" sub="银铃守护 · 运营中心" right="退出" @right="doLogout" />

		<view class="yl-app">
			<!-- 顶部 Tab -->
			<view class="tabs">
				<view class="tab" v-for="t in tabs" :key="t.key" :class="{ 'tab-on': tab === t.key }" @click="tab = t.key">
					<text class="tab-t">{{ t.name }}</text>
					<text v-if="t.key === 'review' && accepts.length" class="tab-badge">{{ accepts.length }}</text>
				</view>
			</view>

			<!-- ============ 看板 ============ -->
			<view v-if="tab === 'dash'" class="pane yl-fade">
				<view class="kpis">
					<view class="kpi">
						<text class="kpi-l">累计访问量 PV</text>
						<text class="kpi-n">{{ stats.pv }}</text>
						<text class="kpi-s">今日 +{{ todayPv }}</text>
					</view>
					<view class="kpi">
						<text class="kpi-l">独立访客 UV</text>
						<text class="kpi-n">{{ uv }}</text>
						<text class="kpi-s">按会话去重</text>
					</view>
					<view class="kpi">
						<text class="kpi-l">累计学习时长</text>
						<text class="kpi-n">{{ learnHours }}</text>
						<text class="kpi-s">小时 · {{ stats.learnDone }} 次完课</text>
					</view>
					<view class="kpi">
						<text class="kpi-l">答题通过率</text>
						<text class="kpi-n">{{ passRate }}%</text>
						<text class="kpi-s">{{ stats.quizPass }}/{{ stats.quizTimes }} 人次通过</text>
					</view>
					<view class="kpi">
						<text class="kpi-l">AI 辨伪正确率</text>
						<text class="kpi-n">{{ aiRate }}%</text>
						<text class="kpi-s">{{ stats.aiRight }}/{{ stats.aiTimes }} 人次判断正确</text>
					</view>
					<view class="kpi">
						<text class="kpi-l">家校参与人数</text>
						<text class="kpi-n">{{ familyCount }}</text>
						<text class="kpi-s">接受过作业的用户</text>
					</view>
				</view>

				<!-- 趋势 -->
				<view class="yl-card yl-section">
					<view class="yl-card-hd">
						<text class="yl-h3">近 7 日访问趋势</text>
						<text class="yl-sub">橙色为今日</text>
					</view>
					<view class="chart">
						<view class="chart-y">
							<text class="chart-y-t">{{ maxPv }}</text>
							<text class="chart-y-t">{{ Math.round(maxPv / 2) }}</text>
							<text class="chart-y-t">0</text>
						</view>
						<view class="chart-body">
							<view class="chart-grid">
								<view class="chart-grid-l"></view>
								<view class="chart-grid-l"></view>
								<view class="chart-grid-l"></view>
							</view>
							<view class="bars">
								<view class="bar-wrap" v-for="(d, i) in days" :key="i">
									<text class="bar-v">{{ d.pv }}</text>
									<view class="bar" :class="{ 'bar-today': i === days.length - 1 }"
										:style="{ height: d.h + '%' }"></view>
									<text class="bar-d">{{ d.label }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- 页面热度 + 视频排行 -->
				<view class="yl-grid yl-section">
					<view class="cell">
						<view class="yl-card">
							<view class="yl-card-hd">
								<text class="yl-h3">页面访问排行</text>
								<text class="yl-sub">累计</text>
							</view>
							<view class="rank" v-for="(p, i) in pageRank" :key="p.name">
								<text class="rank-i" :class="{ 'rank-i-top': i < 3 }">{{ i + 1 }}</text>
								<text class="rank-n">{{ p.name }}</text>
								<view class="rank-bar">
									<view class="rank-bar-in" :style="{ width: p.w + '%' }"></view>
								</view>
								<text class="rank-v">{{ p.count }}</text>
							</view>
							<view v-if="!pageRank.length" class="yl-empty" style="padding:20px 0">暂无数据</view>
						</view>
					</view>
					<view class="cell">
						<view class="yl-card">
							<view class="yl-card-hd">
								<text class="yl-h3">视频播放排行</text>
								<text class="yl-sub">按播放量</text>
							</view>
							<view class="rank" v-for="(v, i) in videoRank" :key="v.id">
								<text class="rank-i" :class="{ 'rank-i-top': i < 3 }">{{ i + 1 }}</text>
								<text class="rank-n yl-ellipsis">{{ v.title }}</text>
								<text class="rank-v">{{ v.views }}</text>
							</view>
							<view v-if="!videoRank.length" class="yl-empty" style="padding:20px 0">暂无数据</view>
						</view>
					</view>
				</view>

				<!-- 设置 -->
				<view class="yl-card yl-section">
					<text class="yl-h3">系统设置</text>
					<view class="set-row">
						<text class="set-l">首页宣传视频</text>
						<picker class="set-picker" :range="videoTitles" @change="setHero">
							<text class="set-v">{{ heroTitle }} ›</text>
						</picker>
					</view>
					<view class="set-row" @click="openPwd">
						<text class="set-l">修改管理员密码</text>
						<text class="set-v">•••••• ›</text>
					</view>
					<view class="set-row" @click="doReset">
						<text class="set-l set-danger">重置全部演示数据</text>
						<text class="set-v">›</text>
					</view>
					<text class="set-note">数据保存在本机浏览器，换设备或清除缓存后需要重新演示。正式上线需接入云数据库。</text>
				</view>
			</view>

			<!-- ============ 视频管理 ============ -->
			<view v-if="tab === 'video'" class="pane yl-fade">
				<view class="pane-hd">
					<view>
						<text class="pane-t">视频库（{{ videos.length }}）</text>
						<text class="pane-s">用户只能观看，只有管理员可以增删</text>
					</view>
					<view class="pane-btn" @click="openVideoForm(null)">
						<text class="pane-btn-t">+ 新增视频</text>
					</view>
				</view>

				<view class="vlist">
					<view class="vitem" v-for="v in videos" :key="v.id">
						<view class="vitem-cover" :style="{ background: catGrad(v.cat) }">
							<text class="vitem-cover-t">{{ catEmoji(v.cat) }}</text>
						</view>
						<view class="vitem-body">
							<text class="vitem-t yl-ellipsis">{{ v.title }}</text>
							<view class="vitem-meta">
								<text class="yl-tag" :style="{ background: catColor(v.cat) + '18', color: catColor(v.cat) }">{{
									catName(v.cat) }}</text>
								<text class="vitem-s">{{ v.views }} 次播放</text>
								<text class="vitem-s" :class="{ 'vitem-off': v.status === 'offline' }">{{ v.status === 'offline' ? '已下架' : '已上架' }}</text>
							</view>
						</view>
						<view class="vitem-ops">
							<view class="op" @click="openVideoForm(v)">
								<text class="op-t">编辑</text>
							</view>
							<view class="op" @click="toggleVideo(v.id)">
								<text class="op-t">{{ v.status === 'offline' ? '上架' : '下架' }}</text>
							</view>
							<view class="op op-danger" @click="removeVideo(v)">
								<text class="op-t op-t-danger">删除</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- ============ 内容管理 ============ -->
			<view v-if="tab === 'content'" class="pane yl-fade">
				<view class="pane-hd">
					<view>
						<text class="pane-t">判例与新闻（{{ news.length }}）</text>
						<text class="pane-s">可随时补充最新案例与预警</text>
					</view>
					<view class="pane-btn" @click="openNewsForm">
						<text class="pane-btn-t">+ 新增</text>
					</view>
				</view>

				<view class="citem" v-for="n in news" :key="n.id">
					<view class="citem-l">
						<text class="citem-t yl-ellipsis">{{ n.title }}</text>
						<text class="citem-s">{{ typeName(n.type) }} · {{ n.source }} · {{ n.date }}</text>
					</view>
					<view class="op op-danger" @click="removeNews(n)">
						<text class="op-t op-t-danger">删除</text>
					</view>
				</view>

				<view class="pane-hd" style="margin-top:26px">
					<view>
						<text class="pane-t">作业（{{ tasks.length }}）</text>
						<text class="pane-s">管理员也可代发；老人端与学生端只“接受”，不提交</text>
					</view>
					<view class="pane-btn" @click="openTaskForm">
						<text class="pane-btn-t">+ 新增</text>
					</view>
				</view>

				<view class="citem" v-for="t in tasks" :key="t.id">
					<view class="citem-l">
						<text class="citem-t yl-ellipsis">{{ t.title }}</text>
						<text class="citem-s">{{ taskTargetName(t) }} · {{ t.teacher }} · +{{ t.points }} 积分 · 已接受
							{{ countOf(t.id) }} 人</text>
					</view>
					<view class="op op-danger" @click="removeTask(t)">
						<text class="op-t op-t-danger">删除</text>
					</view>
				</view>
			</view>

			<!-- ============ 作业接受情况 ============ -->
			<view v-if="tab === 'review'" class="pane yl-fade">
				<view class="pane-hd">
					<view>
						<text class="pane-t">作业接受情况</text>
						<text class="pane-s">共 {{ tasks.length }} 份作业 · 累计 {{ accepts.length }} 人次（老师发布，学生/长辈只需“接受”）</text>
					</view>
				</view>

				<view v-if="!tasks.length" class="yl-empty">还没有布置作业</view>

				<view class="sub-card" v-for="t in tasks" :key="t.id">
					<view class="sub-hd">
						<view class="sub-hd-l">
							<text class="sub-name">{{ t.title }}</text>
							<text class="sub-meta">{{ taskTargetName(t) }} · {{ t.teacher }}</text>
						</view>
						<text class="sub-st st-approved">已接受 {{ countOf(t.id) }}</text>
					</view>

					<view v-if="peopleOf(t.id).length" class="accept-list">
						<view class="accept" v-for="a in peopleOf(t.id)" :key="a.id">
							<text class="accept-n">{{ a.nickname }}</text>
							<text class="accept-s">{{ stageName(a.stage) }}</text>
							<text class="accept-t">{{ timeStr(a.at) }}</text>
						</view>
					</view>
					<text v-else class="accept-empty">还没有人接受</text>
				</view>
			</view>

			<!-- ============ 用户 ============ -->
			<view v-if="tab === 'user'" class="pane yl-fade">
				<view class="pane-hd">
					<view>
						<text class="pane-t">用户列表（{{ users.length }}）</text>
						<text class="pane-s">演示环境账号存在本机浏览器</text>
					</view>
				</view>

				<view class="utable">
					<view class="utable-hd">
						<text class="ut-c1">用户</text>
						<text class="ut-c2">身份</text>
						<text class="ut-c3">学时</text>
						<text class="ut-c4">作业</text>
					</view>
					<view class="utable-row" v-for="u in userRows" :key="u.username">
						<view class="ut-c1">
							<text class="ut-name">{{ u.nickname }}</text>
							<text class="ut-sub">{{ u.username }}</text>
						</view>
						<text class="ut-c2">{{ u.stageName }}</text>
						<text class="ut-c3">{{ u.minutes }} 分</text>
						<text class="ut-c4">{{ u.accepts }}</text>
					</view>
					<view v-if="!userRows.length" class="yl-empty">暂无用户</view>
				</view>
			</view>

			<view class="yl-safe-bottom"></view>
		</view>

		<!-- ============ 视频表单 ============ -->
		<view v-if="videoForm" class="mask" @click="videoForm = false">
			<view class="sheet" @click.stop>
				<view class="sheet-hd">
					<text class="sheet-t">{{ editVideo.id ? '编辑视频' : '新增视频' }}</text>
					<text class="sheet-x" @click="videoForm = false">✕</text>
				</view>

				<view class="yl-field">
					<text class="yl-label">视频标题</text>
					<input class="yl-input" v-model="editVideo.title" placeholder="例如：刷单返利的三步套路" />
				</view>

				<view class="yl-field">
					<text class="yl-label">所属分类</text>
					<view class="chips">
						<view class="yl-chip" v-for="c in cats" :key="c.key"
							:class="{ 'yl-chip-on': editVideo.cat === c.key }" @click="editVideo.cat = c.key">
							{{ c.emoji }} {{ c.name }}
						</view>
					</view>
				</view>

				<view class="row2">
					<view class="yl-field" style="flex:1">
						<text class="yl-label">时长（秒）</text>
						<input class="yl-input" type="number" v-model="editVideo.duration" placeholder="180" />
					</view>
					<view class="yl-field" style="flex:1">
						<text class="yl-label">初始播放量</text>
						<input class="yl-input" type="number" v-model="editVideo.views" placeholder="0" />
					</view>
				</view>

				<view class="yl-field">
					<text class="yl-label">视频地址（mp4 链接）</text>
					<input class="yl-input" v-model="editVideo.src" placeholder="https://... .mp4" />
					<text class="field-note">演示环境：可填工程内地址（如 static/video/v01.mp4）或公网 mp4 链接；正式上线建议接入云存储。</text>
				</view>

				<view class="yl-field">
					<text class="yl-label">课程要点（每行一条）</text>
					<textarea class="yl-textarea" v-model="editVideo.pointsText"
						placeholder="先给甜头再吞本金&#10;群里晒收益的多是同伙"></textarea>
				</view>

				<view class="sheet-btns">
					<button class="yl-btn yl-btn-ghost" @click="videoForm = false">取消</button>
					<button class="yl-btn yl-btn-primary" @click="saveVideoForm">保存</button>
				</view>
			</view>
		</view>

		<!-- ============ 新闻表单 ============ -->
		<view v-if="newsForm" class="mask" @click="newsForm = false">
			<view class="sheet" @click.stop>
				<view class="sheet-hd">
					<text class="sheet-t">新增判例 / 新闻</text>
					<text class="sheet-x" @click="newsForm = false">✕</text>
				</view>

				<view class="yl-field">
					<text class="yl-label">类型</text>
					<view class="chips">
						<view class="yl-chip" :class="{ 'yl-chip-on': editNews.type === 'case' }" @click="editNews.type = 'case'">
							司法判例</view>
						<view class="yl-chip" :class="{ 'yl-chip-on': editNews.type === 'news' }" @click="editNews.type = 'news'">
							新闻报道</view>
						<view class="yl-chip" :class="{ 'yl-chip-on': editNews.type === 'alert' }" @click="editNews.type = 'alert'">
							预警通告</view>
					</view>
				</view>

				<view class="yl-field">
					<text class="yl-label">标题</text>
					<input class="yl-input" v-model="editNews.title" placeholder="输入标题" />
				</view>

				<view class="row2">
					<view class="yl-field" style="flex:1">
						<text class="yl-label">来源</text>
						<input class="yl-input" v-model="editNews.source" placeholder="公开报道整理" />
					</view>
					<view class="yl-field" style="flex:1">
						<text class="yl-label">日期</text>
						<input class="yl-input" v-model="editNews.date" placeholder="2026-11-20" />
					</view>
				</view>

				<view class="row2">
					<view class="yl-field" style="flex:1">
						<text class="yl-label">案发地（选填）</text>
						<input class="yl-input" v-model="editNews.region" placeholder="湖北黄石" />
					</view>
					<view class="yl-field" style="flex:1">
						<text class="yl-label">涉案金额（选填）</text>
						<input class="yl-input" v-model="editNews.amount" placeholder="6 万元" />
					</view>
				</view>

				<view class="yl-field">
					<text class="yl-label">摘要（列表上显示）</text>
					<textarea class="yl-textarea" v-model="editNews.summary" placeholder="一两句话讲清发生了什么"></textarea>
				</view>

				<view class="yl-field">
					<text class="yl-label">正文（空一行分段，建议 300—400 字）</text>
					<textarea class="yl-textarea yl-textarea-lg" v-model="editNews.bodyText"
						placeholder="第一段：什么时候、什么地方、怎么被骗的。空一行再写第二段：骗术细节。再空一行写第三段：判决结果与提醒。"></textarea>
				</view>

				<view class="yl-field">
					<text class="yl-label">判决结果（选填）</text>
					<input class="yl-input" v-model="editNews.sentence" placeholder="吴某犯诈骗罪，判处有期徒刑二年一个月" />
				</view>

				<view class="sheet-btns">
					<button class="yl-btn yl-btn-ghost" @click="newsForm = false">取消</button>
					<button class="yl-btn yl-btn-primary" @click="saveNewsForm">保存</button>
				</view>
			</view>
		</view>

		<!-- ============ 任务表单 ============ -->
		<view v-if="taskForm" class="mask" @click="taskForm = false">
			<view class="sheet" @click.stop>
				<view class="sheet-hd">
					<text class="sheet-t">新增家校任务</text>
					<text class="sheet-x" @click="taskForm = false">✕</text>
				</view>

				<view class="yl-field">
					<text class="yl-label">布置给谁</text>
					<view class="chips">
						<view class="yl-chip" :class="{ 'yl-chip-on': editTask.target === 'elder' }"
							@click="editTask.target = 'elder'">长辈端</view>
						<view class="yl-chip" :class="{ 'yl-chip-on': editTask.target === 'student' }"
							@click="editTask.target = 'student'">学生端</view>
						<view class="yl-chip" :class="{ 'yl-chip-on': editTask.target === 'all' }"
							@click="editTask.target = 'all'">老人+学生</view>
					</view>
				</view>

				<view v-if="editTask.target !== 'elder'" class="yl-field">
					<text class="yl-label">面向学段（可多选，不选=全体学生）</text>
					<view class="chips">
						<view class="yl-chip" v-for="s in stages" :key="s.key"
							:class="{ 'yl-chip-on': (editTask.stages || []).indexOf(s.key) > -1 }"
							@click="toggleTaskStage(s.key)">
							{{ s.emoji }} {{ s.name }}
						</view>
					</view>
				</view>

				<view class="yl-field">
					<text class="yl-label">任务标题</text>
					<input class="yl-input" v-model="editTask.title" placeholder="例如：给长辈讲 3 个真实案例" />
				</view>

				<view class="yl-field">
					<text class="yl-label">任务说明</text>
					<textarea class="yl-textarea" v-model="editTask.desc" placeholder="写清楚学生要做什么"></textarea>
				</view>

				<view class="row2">
					<view class="yl-field" style="flex:1">
						<text class="yl-label">积分</text>
						<input class="yl-input" type="number" v-model="editTask.points" placeholder="20" />
					</view>
					<view class="yl-field" style="flex:1">
						<text class="yl-label">建议分钟</text>
						<input class="yl-input" type="number" v-model="editTask.minutes" placeholder="30" />
					</view>
				</view>

				<view class="sheet-btns">
					<button class="yl-btn yl-btn-ghost" @click="taskForm = false">取消</button>
					<button class="yl-btn yl-btn-primary" @click="saveTaskForm">保存</button>
				</view>
			</view>
		</view>
		<!-- ============ 密码表单 ============ -->
		<view v-if="pwdForm" class="mask" @click="pwdForm = false">
			<view class="sheet" @click.stop>
				<view class="sheet-hd">
					<text class="sheet-t">修改管理员密码</text>
					<text class="sheet-x" @click="pwdForm = false">✕</text>
				</view>

				<view class="yl-field">
					<text class="yl-label">新密码（至少 6 位）</text>
					<input class="yl-input" :password="!showPwd" v-model="newPwd" placeholder="请输入新密码" />
				</view>
				<view class="yl-field">
					<text class="yl-label">再输入一次</text>
					<input class="yl-input" :password="!showPwd" v-model="newPwd2" placeholder="请再次输入新密码" />
				</view>
				<view class="set-row" style="border-top:none" @click="showPwd = !showPwd">
					<text class="set-l">显示密码</text>
					<text class="set-v">{{ showPwd ? '👁 已显示' : '🙈 已隐藏' }}</text>
				</view>

				<view class="sheet-btns">
					<button class="yl-btn yl-btn-ghost" @click="pwdForm = false">取消</button>
					<button class="yl-btn yl-btn-primary" @click="savePwd">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import db from '@/utils/store.js'
	import auth from '@/utils/auth.js'
	import fmt from '@/utils/format.js'
	import {
		STAGES
	} from '@/utils/seed.js'

	export default {
		data() {
			return {
				tab: 'dash',
				tabs: [{
						key: 'dash',
						name: '看板'
					},
					{
						key: 'video',
						name: '视频'
					},
					{
						key: 'content',
						name: '内容'
					},
					{
						key: 'review',
						name: '作业'
					},
					{
						key: 'user',
						name: '用户'
					}
				],
				stages: STAGES,
				cats: [],
				stats: {
					daily: {},
					pages: {},
					familyUsers: []
				},
				videos: [],
				news: [],
				tasks: [],
				accepts: [],
				users: [],
				settings: {},
				videoForm: false,
				newsForm: false,
				taskForm: false,
				pwdForm: false,
				showPwd: false,
				newPwd: '',
				newPwd2: '',
				editVideo: {},
				editNews: {},
				editTask: {}
			}
		},
		computed: {
			uv() {
				return db.totalUv()
			},
			learnHours() {
				return (this.stats.learnSeconds / 3600).toFixed(1)
			},
			passRate() {
				if (!this.stats.quizTimes) return 0
				return Math.round(this.stats.quizPass / this.stats.quizTimes * 100)
			},
			aiRate() {
				if (!this.stats.aiTimes) return 0
				return Math.round(this.stats.aiRight / this.stats.aiTimes * 100)
			},
			familyCount() {
				return (this.stats.familyUsers || []).length
			},
			todayPv() {
				const t = fmt.dateStr(Date.now())
				const d = this.stats.daily[t]
				return d ? d.pv : 0
			},
			days() {
				const list = []
				let max = 1
				for (let i = 6; i >= 0; i--) {
					const d = new Date()
					d.setDate(d.getDate() - i)
					const key = fmt.dateStr(d)
					const item = this.stats.daily[key] || {
						pv: 0
					}
					max = Math.max(max, item.pv)
					list.push({
						key: key,
						pv: item.pv,
						label: (d.getMonth() + 1) + '/' + d.getDate()
					})
				}
				list.forEach(x => {
					x.h = Math.max(4, Math.round(x.pv / max * 100))
				})
				return list
			},
			maxPv() {
				return this.days.reduce((m, d) => Math.max(m, d.pv), 0)
			},
			pageRank() {
				const p = this.stats.pages || {}
				const arr = Object.keys(p).map(k => ({
					name: k,
					count: p[k]
				}))
				arr.sort((a, b) => b.count - a.count)
				const top = arr.slice(0, 6)
				const max = top.length ? top[0].count : 1
				top.forEach(x => {
					x.w = Math.max(6, Math.round(x.count / max * 100))
				})
				return top
			},
			videoRank() {
				return this.videos.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
			},
			videoTitles() {
				return this.videos.map(v => v.title)
			},
			heroTitle() {
				const v = this.videos.find(x => x.id === this.settings.heroVideoId)
				return v ? v.title : (this.videos[0] ? this.videos[0].title : '未设置')
			},
			userRows() {
				const progressAll = db.read('ylsh_progress', {})
				return this.users.map(u => {
					const p = progressAll[u.username] || {}
					let sec = 0
					Object.keys(p).forEach(k => {
						sec += p[k].seconds || 0
					})
					const st = ['primary', 'junior', 'senior', 'college', 'elder', 'teacher']
					let name = '长辈'
					if (u.stage === 'elder') name = '长辈'
					else if (u.stage === 'teacher') name = '教师'
					else {
						const f = STAGES.find(x => x.key === u.stage)
						name = f ? f.name + '生' : '长辈'
					}
					return {
						username: u.username,
						nickname: u.nickname,
						stageName: name,
						minutes: Math.round(sec / 60),
						accepts: this.accepts.filter(a => a.username === u.username).length
					}
				})
			}
		},
		onLoad() {
			const s = auth.requireAdmin()
			if (!s) return
			this.cats = db.getCategories()
			this.load()
		},
		onShow() {
			db.trackPage('管理后台')
			if (this.cats.length) this.load()
		},
		methods: {
			timeStr(t) {
				return fmt.timeStr(t)
			},
			load() {
				this.stats = db.getStats()
				this.videos = db.getVideos(true)
				this.news = db.getNews('all')
				this.tasks = db.getTasks()
				this.accepts = db.getAccepts({})
				this.users = db.getUsers()
				this.settings = db.getSettings()
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
			catGrad(k) {
				const c = this.catColor(k)
				return 'linear-gradient(135deg,' + c + '33,' + c + '77)'
			},
			stageName(k) {
				const s = STAGES.find(x => x.key === k)
				return s ? s.name : '—'
			},
			taskTargetName(t) {
				if (t.target === 'elder') return '长辈端'
				if (t.target === 'all') return '老人+学生'
				const list = t.stages || []
				if (!list.length) return '全体学生'
				return list.map(k => (STAGES.find(x => x.key === k) || {}).name || '').filter(Boolean).join('/') + '生'
			},
			countOf(id) {
				return this.accepts.filter(a => a.taskId === id).length
			},
			peopleOf(id) {
				return this.accepts.filter(a => a.taskId === id)
			},
			typeName(t) {
				return t === 'case' ? '判例' : t === 'alert' ? '预警' : '新闻'
			},

			/* --- 视频 --- */
			openVideoForm(v) {
				if (v) {
					this.editVideo = {
						id: v.id,
						title: v.title,
						cat: v.cat,
						duration: v.duration,
						views: v.views,
						src: v.src,
						pointsText: (v.points || []).join('\n'),
						status: v.status || 'online'
					}
				} else {
					this.editVideo = {
						id: '',
						title: '',
						cat: this.cats[0] ? this.cats[0].key : 'shuandan',
						duration: 180,
						views: 0,
						src: '',
						pointsText: '',
						status: 'online'
					}
				}
				this.videoForm = true
			},
			saveVideoForm() {
				const e = this.editVideo
				if (!e.title || !e.title.trim()) {
					uni.showToast({
						title: '请填写标题',
						icon: 'none'
					})
					return
				}
				const old = e.id ? db.getVideo(e.id) : null
				db.saveVideo({
					id: e.id || '',
					title: e.title.trim(),
					cat: e.cat,
					duration: Number(e.duration) || 180,
					views: Number(e.views) || 0,
					src: (e.src || '').trim() || (old ? old.src : ''),
					points: (e.pointsText || '').split('\n').map(s => s.trim()).filter(Boolean),
					quiz: old ? old.quiz : [],
					status: old ? (old.status || 'online') : 'online'
				})
				this.videoForm = false
				this.load()
				uni.showToast({
					title: '已保存',
					icon: 'success'
				})
			},
			toggleVideo(id) {
				db.toggleVideo(id)
				this.load()
			},
			removeVideo(v) {
				uni.showModal({
					title: '删除视频',
					content: '确定删除《' + v.title + '》？删除后用户将看不到该视频。',
					confirmColor: '#C8332B',
					success: (res) => {
						if (!res.confirm) return
						db.deleteVideo(v.id)
						this.load()
						uni.showToast({
							title: '已删除',
							icon: 'none'
						})
					}
				})
			},

			/* --- 新闻 --- */
			openNewsForm() {
				this.editNews = {
					type: 'news',
					title: '',
					source: '公开报道整理',
					date: fmt.dateStr(Date.now()),
					summary: '',
					region: '',
					amount: '',
					bodyText: '',
					sentence: ''
				}
				this.newsForm = true
			},
			saveNewsForm() {
				const e = this.editNews
				if (!e.title || !e.title.trim()) {
					uni.showToast({
						title: '请填写标题',
						icon: 'none'
					})
					return
				}
				const body = String(e.bodyText || '')
					.split(/\n\s*\n/)
					.map(s => s.trim())
					.filter(s => s)
				db.addNews({
					type: e.type,
					title: e.title.trim(),
					source: e.source || '公开报道整理',
					date: e.date || fmt.dateStr(Date.now()),
					summary: e.summary,
					lead: String(e.summary || '').trim(),
					region: String(e.region || '').trim(),
					amount: String(e.amount || '').trim(),
					body: body,
					sentence: String(e.sentence || '').trim(),
					lesson: [],
					tags: []
				})
				this.newsForm = false
				this.load()
				uni.showToast({
					title: '已发布',
					icon: 'success'
				})
			},
			removeNews(n) {
				uni.showModal({
					title: '删除内容',
					content: '确定删除这条内容？',
					confirmColor: '#C8332B',
					success: (res) => {
						if (!res.confirm) return
						db.deleteNews(n.id)
						this.load()
					}
				})
			},

			/* --- 任务 --- */
			openTaskForm() {
				this.editTask = {
					target: 'elder',
					stages: [],
					teacher: '管理员',
					title: '',
					desc: '',
					points: 10,
					minutes: 20
				}
				this.taskForm = true
			},
			toggleTaskStage(k) {
				const list = this.editTask.stages || []
				const i = list.indexOf(k)
				if (i > -1) list.splice(i, 1)
				else list.push(k)
				this.editTask.stages = list.slice()
			},
			saveTaskForm() {
				const e = this.editTask
				if (!e.title || !e.title.trim()) {
					uni.showToast({
						title: '请填写任务标题',
						icon: 'none'
					})
					return
				}
				db.addTask({
					target: e.target,
					stages: e.target === 'elder' ? [] : (e.stages || []),
					teacher: e.teacher || '管理员',
					teacherTitle: '管理后台发布',
					title: e.title.trim(),
					desc: e.desc,
					points: Number(e.points) || 10,
					minutes: Number(e.minutes) || 20,
					deadline: '2026-12-31'
				})
				this.taskForm = false
				this.load()
				uni.showToast({
					title: '已发布',
					icon: 'success'
				})
			},
			removeTask(t) {
				uni.showModal({
					title: '删除任务',
					content: '确定删除「' + t.title + '」？',
					confirmColor: '#C8332B',
					success: (res) => {
						if (!res.confirm) return
						db.deleteTask(t.id)
						this.load()
					}
				})
			},

			/* --- 作业 --- */

			/* --- 设置 --- */
			setHero(e) {
				const i = Number(e.detail.value)
				const v = this.videos[i]
				if (!v) return
				db.setSettings({
					heroVideoId: v.id
				})
				this.settings = db.getSettings()
				uni.showToast({
					title: '首页视频已切换',
					icon: 'none'
				})
			},
			openPwd() {
				this.newPwd = ''
				this.newPwd2 = ''
				this.showPwd = false
				this.pwdForm = true
			},
			savePwd() {
				const p1 = (this.newPwd || '').trim()
				const p2 = (this.newPwd2 || '').trim()
				if (p1.length < 6) {
					uni.showToast({
						title: '密码至少 6 位',
						icon: 'none'
					})
					return
				}
				if (p1 !== p2) {
					uni.showToast({
						title: '两次输入不一致',
						icon: 'none'
					})
					return
				}
				db.setSettings({
					adminPwd: p1
				})
				this.settings = db.getSettings()
				this.pwdForm = false
				uni.showToast({
					title: '密码已更新',
					icon: 'success'
				})
			},
			doReset() {
				uni.showModal({
					title: '重置演示数据',
					content: '将清空本机所有学习记录、作业接受记录和统计数据，恢复初始状态。确定继续？',
					confirmColor: '#C8332B',
					success: (res) => {
						if (!res.confirm) return
						db.resetAll()
						this.load()
						uni.showToast({
							title: '已重置',
							icon: 'success'
						})
					}
				})
			},
			doLogout() {
				uni.showModal({
					title: '退出登录',
					content: '确定退出管理后台？',
					success: (res) => {
						if (res.confirm) auth.logout()
					}
				})
			}
		}
	}
</script>

<style>
	.admin {
		min-height: 100vh;
		background: #F7F3EC;
	}

	/* Tab */
	.tabs {
		display: flex;
		gap: 6px;
		margin-top: 12px;
		background: #fff;
		border: 1px solid #EFE6D8;
		border-radius: 14px;
		padding: 5px;
	}

	.tab {
		flex: 1;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.tab-t {
		font-size: 14px;
		color: #7A6F62;
	}

	.tab-on {
		background: #2B1A12;
	}

	.tab-on .tab-t {
		color: #FFE9D2;
		font-weight: 700;
	}

	.tab-badge {
		background: #C8332B;
		color: #fff;
		font-size: 10px;
		border-radius: 999px;
		padding: 0 5px;
		line-height: 15px;
	}

	.pane {
		padding-top: 14px;
	}

	/* KPI */
	.kpis {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.kpi {
		flex: 1 1 150px;
		background: #fff;
		border: 1px solid #EFE6D8;
		border-radius: 14px;
		padding: 12px;
	}

	.kpi-l {
		display: block;
		font-size: 11px;
		color: #9A8B7C;
	}

	.kpi-n {
		display: block;
		font-size: 24px;
		font-weight: 800;
		color: #2B2B2B;
		line-height: 1.2;
		margin-top: 2px;
		font-variant-numeric: tabular-nums;
	}

	.kpi-s {
		display: block;
		font-size: 10px;
		color: #B4A697;
		margin-top: 2px;
	}

	/* 图表 */
	.chart {
		display: flex;
		height: 170px;
		gap: 6px;
	}

	.chart-y {
		width: 34px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 4px 0 18px;
	}

	.chart-y-t {
		font-size: 10px;
		color: #B4A697;
		text-align: right;
	}

	.chart-body {
		flex: 1;
		position: relative;
	}

	.chart-grid {
		position: absolute;
		left: 0;
		right: 0;
		top: 4px;
		bottom: 18px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.chart-grid-l {
		height: 1px;
		background: #F2ECDF;
	}

	.bars {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: flex-end;
		gap: 6px;
	}

	.bar-wrap {
		flex: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		gap: 2px;
	}

	.bar-v {
		font-size: 9px;
		color: #A2958A;
		font-variant-numeric: tabular-nums;
	}

	.bar {
		width: 100%;
		max-width: 30px;
		border-radius: 4px 4px 0 0;
		background: #D9C4A8;
		min-height: 4px;
	}

	.bar-today {
		background: linear-gradient(180deg, #E8622C, #C8332B);
	}

	.bar-d {
		font-size: 9px;
		color: #B4A697;
		height: 16px;
		line-height: 16px;
	}

	/* 排行 */
	.rank {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 0;
	}

	.rank-i {
		width: 18px;
		height: 18px;
		border-radius: 5px;
		background: #F4EDE3;
		color: #9A8B7C;
		font-size: 10px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.rank-i-top {
		background: #FDEDE9;
		color: #C8332B;
	}

	.rank-n {
		flex: 1;
		min-width: 0;
		font-size: 13px;
		color: #4A4038;
	}

	.rank-bar {
		width: 60px;
		height: 5px;
		background: #F2ECDF;
		border-radius: 3px;
		overflow: hidden;
		flex: 0 0 auto;
	}

	.rank-bar-in {
		height: 100%;
		background: #D9A441;
	}

	.rank-v {
		width: 40px;
		text-align: right;
		font-size: 11px;
		color: #9A8B7C;
		font-variant-numeric: tabular-nums;
		flex: 0 0 auto;
	}

	/* 设置 */
	.set-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 0;
		border-top: 1px solid #F5EADB;
	}

	.set-l {
		font-size: 14px;
		color: #4A4038;
	}

	.set-danger {
		color: #C8332B;
	}

	.set-v {
		font-size: 13px;
		color: #9A8B7C;
		max-width: 60%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.set-note {
		display: block;
		font-size: 11px;
		color: #B4A697;
		line-height: 1.6;
		margin-top: 10px;
	}

	/* 面板头 */
	.pane-hd {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 12px;
		gap: 10px;
	}

	.pane-t {
		display: block;
		font-size: 17px;
		font-weight: 700;
	}

	.pane-s {
		display: block;
		font-size: 11px;
		color: #9A8B7C;
		margin-top: 2px;
	}

	.pane-btn {
		flex: 0 0 auto;
		height: 36px;
		padding: 0 14px;
		border-radius: 18px;
		background: #2B1A12;
		display: flex;
		align-items: center;
	}

	.pane-btn-t {
		font-size: 13px;
		color: #FFE9D2;
		font-weight: 600;
	}

	/* 视频列表 */
	.vlist {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.vitem {
		display: flex;
		align-items: center;
		gap: 10px;
		background: #fff;
		border: 1px solid #EFE6D8;
		border-radius: 14px;
		padding: 10px;
	}

	.vitem-cover {
		width: 58px;
		height: 44px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.vitem-cover-t {
		font-size: 18px;
	}

	.vitem-body {
		flex: 1;
		min-width: 0;
	}

	.vitem-t {
		display: block;
		font-size: 13px;
		font-weight: 600;
	}

	.vitem-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 5px;
	}

	.vitem-s {
		font-size: 10px;
		color: #B4A697;
	}

	.vitem-off {
		color: #C8332B;
	}

	.vitem-ops {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 0 0 auto;
	}

	.op {
		padding: 3px 8px;
		border-radius: 6px;
		background: #F6F0E7;
		text-align: center;
	}

	.op-t {
		font-size: 10px;
		color: #6C5C4C;
	}

	.op-danger {
		background: #FDEDE9;
	}

	.op-t-danger {
		color: #C8332B;
	}

	/* 内容 */
	.citem {
		display: flex;
		align-items: center;
		gap: 10px;
		background: #fff;
		border: 1px solid #EFE6D8;
		border-radius: 12px;
		padding: 11px 12px;
		margin-bottom: 8px;
	}

	.citem-l {
		flex: 1;
		min-width: 0;
	}

	.citem-t {
		display: block;
		font-size: 13px;
		font-weight: 600;
	}

	.citem-s {
		display: block;
		font-size: 10px;
		color: #B4A697;
		margin-top: 3px;
	}

	/* 作业 */
	.sub-card {
		background: #fff;
		border: 1px solid #EFE6D8;
		border-radius: 14px;
		padding: 13px;
		margin-bottom: 10px;
	}

	.sub-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.sub-hd-l {
		flex: 1;
		min-width: 0;
	}

	.sub-name {
		display: block;
		font-size: 14px;
		font-weight: 700;
	}

	.sub-meta {
		display: block;
		font-size: 10px;
		color: #B4A697;
		margin-top: 2px;
	}

	.sub-st {
		font-size: 11px;
		flex: 0 0 auto;
	}

	.accept-list {
		margin-top: 8px;
		background: #FAF8F4;
		border-radius: 10px;
		padding: 4px 10px;
	}

	.accept {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 0;
		border-bottom: 1px solid #F1EADD;
	}

	.accept:last-child {
		border-bottom: none;
	}

	.accept-n {
		font-size: 12px;
		font-weight: 600;
		color: #4A4038;
	}

	.accept-s {
		font-size: 10px;
		color: #A2958A;
	}

	.accept-t {
		font-size: 10px;
		color: #B4A697;
		margin-left: auto;
	}

	.accept-empty {
		display: block;
		font-size: 11px;
		color: #B4A697;
		margin-top: 8px;
	}

	.sub-task {
		display: block;
		font-size: 13px;
		color: #4A4038;
		margin-top: 8px;
		font-weight: 600;
	}

	.sub-photo {
		width: 100%;
		height: 180px;
		border-radius: 10px;
		margin-top: 10px;
		background: #F4EDE3;
	}

	.sub-form {
		margin-top: 10px;
		background: #FBF6EE;
		border-radius: 10px;
		padding: 10px;
	}

	.sub-form-t {
		display: block;
		font-size: 12px;
		color: #6C5C4C;
		line-height: 1.7;
	}

	.sub-ops {
		display: flex;
		gap: 8px;
		margin-top: 11px;
	}

	.sop {
		flex: 1;
		height: 38px;
		border-radius: 19px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sop-ok {
		background: #2A8A6A;
	}

	.sop-no {
		background: #fff;
		border: 1px solid #E6D6C2;
	}

	.sop-t {
		font-size: 13px;
		font-weight: 600;
		color: #fff;
	}

	.sop-t2 {
		font-size: 13px;
		font-weight: 600;
		color: #8A7C6D;
	}

	/* 用户表 */
	.utable {
		background: #fff;
		border: 1px solid #EFE6D8;
		border-radius: 14px;
		overflow: hidden;
	}

	.utable-hd {
		display: flex;
		align-items: center;
		padding: 10px 12px;
		background: #FBF6EE;
	}

	.utable-hd .ut-c1,
	.utable-hd .ut-c2,
	.utable-hd .ut-c3,
	.utable-hd .ut-c4 {
		font-size: 10px;
		color: #9A8B7C;
	}

	.utable-row {
		display: flex;
		align-items: center;
		padding: 11px 12px;
		border-top: 1px solid #F5EADB;
	}

	.ut-c1 {
		flex: 1.6;
		min-width: 0;
	}

	.ut-c2 {
		flex: 1;
		font-size: 12px;
		color: #6C5C4C;
	}

	.ut-c3 {
		flex: 0.9;
		font-size: 12px;
		color: #6C5C4C;
	}

	.ut-c4 {
		flex: 0.7;
		font-size: 12px;
		color: #6C5C4C;
		text-align: right;
	}

	.ut-name {
		display: block;
		font-size: 13px;
		font-weight: 600;
	}

	.ut-sub {
		display: block;
		font-size: 10px;
		color: #B4A697;
	}

	/* 弹层 */
	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(30, 18, 12, .45);
		z-index: 200;
		display: flex;
		align-items: flex-end;
	}

	.sheet {
		width: 100%;
		max-height: 88vh;
		overflow-y: auto;
		background: #FBF4EC;
		border-radius: 22px 22px 0 0;
		padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
		box-sizing: border-box;
		animation: sheetUp .26s ease both;
	}

	@keyframes sheetUp {
		from {
			transform: translateY(30px);
			opacity: .6;
		}

		to {
			transform: none;
			opacity: 1;
		}
	}

	.sheet-hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.sheet-t {
		font-size: 18px;
		font-weight: 700;
	}

	.sheet-x {
		font-size: 16px;
		color: #A2958A;
		padding: 2px 6px;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.row2 {
		display: flex;
		gap: 10px;
	}

	.field-note {
		display: block;
		font-size: 10px;
		color: #B4A697;
		margin-top: 6px;
		line-height: 1.5;
	}

	.sheet-btns {
		display: flex;
		gap: 10px;
		margin-top: 16px;
	}

	.sheet-btns .yl-btn {
		flex: 1;
	}
</style>
