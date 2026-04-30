# ACCEPTANCE_PLAYTHROUGH: 灰浆配比

## Scripted Playthrough
1. 开局显示 water / sand / lime / wall_quality / inspection_risk
2. 玩家执行一次核心操作：查看今日材料 -> 调配灰浆 -> 搅拌 -> 涂抹墙段 -> 观察表面反馈 -> 抽检或下一墙段
3. 系统必须反馈一个资源或身体压力变化
4. 系统必须反馈一个关系或风险变化

## Direction Gate
- integration worker 必须让这个流程可试玩
- qa worker 必须用测试或手工记录验证这个流程
- 如试玩要求需要偏离 Direction Lock，停止并回交 manager
