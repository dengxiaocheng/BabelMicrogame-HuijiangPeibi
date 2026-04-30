# MECHANIC_SPEC: 灰浆配比

## Primary Mechanic

- mechanic: 比例调配 + 搅拌时间 + 隐藏质量
- primary_input: 调节水/砂/灰比例滑杆并按住搅拌到目标稠度
- minimum_interaction: 玩家必须手动调整至少两个材料比例，再控制搅拌时间影响墙面质量

## Mechanic Steps

1. 查看材料余量
2. 调整配比
3. 控制搅拌时长
4. 涂抹墙段并观察表面反馈

## State Coupling

每次有效操作必须同时推动两类后果：

- 生存/资源/进度压力：从 Required State 中选择至少一个直接变化
- 关系/风险/秩序压力：从 Required State 中选择至少一个直接变化

## Not A Choice List

- 不能只展示 2-4 个文字按钮让玩家选择
- UI worker 必须把 primary input 映射到场景对象操作
- integration worker 必须让这个操作进入状态结算，而不是只写叙事反馈
