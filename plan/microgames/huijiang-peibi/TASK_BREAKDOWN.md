# TASK_BREAKDOWN: 灰浆配比

## Standard Worker Bundle

1. `huijiang-peibi-foundation`
   - lane: foundation
   - level: M
   - goal: 建立只服务「查看今日材料 -> 调配灰浆 -> 搅拌 -> 涂抹墙段 -> 观察表面反馈 -> 抽检或下一墙段」的可运行骨架

2. `huijiang-peibi-state`
   - lane: logic
   - level: M
   - goal: 实现 Direction Lock 状态的一次分配/操作结算

3. `huijiang-peibi-content`
   - lane: content
   - level: M
   - goal: 用事件池强化「比例调配 + 搅拌时间 + 隐藏质量」

4. `huijiang-peibi-ui`
   - lane: ui
   - level: M
   - goal: 让玩家看见核心压力、可选操作和后果反馈

5. `huijiang-peibi-integration`
   - lane: integration
   - level: M
   - goal: 把已有 state/content/ui 接成单一主循环

6. `huijiang-peibi-qa`
   - lane: qa
   - level: S
   - goal: 用测试和 scripted playthrough 确认方向没跑偏
