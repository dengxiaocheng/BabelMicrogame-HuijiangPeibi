# CREATIVE_CARD: 灰浆配比

- slug: `huijiang-peibi`
- creative_line: 灰浆配比
- target_runtime: web
- target_minutes: 20
- core_emotion: 比例调配 + 搅拌时间 + 隐藏质量
- core_loop: 查看今日材料 -> 调配灰浆 -> 搅拌 -> 涂抹墙段 -> 观察表面反馈 -> 抽检或下一墙段
- failure_condition: 关键状态崩溃，或在本轮主循环中被系统淘汰
- success_condition: 在限定时长内完成主循环，并稳定进入至少一个可结算结局

## Intent

- 做一个 Babel 相关的单创意线微游戏
- 只保留一个主循环，不扩成大项目
- 让 Claude worker 能按固定 packet 稳定并行
