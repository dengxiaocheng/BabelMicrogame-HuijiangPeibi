# SCENE_INTERACTION_SPEC: 灰浆配比

## Scene Objects

- 水桶
- 砂堆
- 灰袋
- 搅拌槽
- 待涂墙段

## Player Input

- primary_input: 调节水/砂/灰比例滑杆并按住搅拌到目标稠度
- minimum_interaction: 玩家必须手动调整至少两个材料比例，再控制搅拌时间影响墙面质量

## Feedback Channels

- 稠度条
- 凝固速度
- 墙面裂纹风险
- inspection_risk 预览

## Forbidden UI

- 不允许只给三种配方按钮
- 不允许扩成完整建筑模拟

## Acceptance Rule

- 首屏必须让玩家看到至少一个可直接操作的场景对象
- 玩家操作必须产生即时可见反馈，且反馈能追溯到 Required State
- 不得只靠随机事件文本或普通选择按钮完成主循环
