# MINI_GDD: 灰浆配比

## Scope

- runtime: web
- duration: 20min
- project_line: 灰浆配比
- single_core_loop: 查看今日材料 -> 调配灰浆 -> 搅拌 -> 涂抹墙段 -> 观察表面反馈 -> 抽检或下一墙段

## Core Loop
1. 执行核心循环：查看今日材料 -> 调配灰浆 -> 搅拌 -> 涂抹墙段 -> 观察表面反馈 -> 抽检或下一墙段
2. 按 20 分钟节奏推进：正常配比 -> 材料不足 -> 雨水/干燥/催工 -> 抽检遮掩或返工

## State

- resource
- pressure
- risk
- relation
- round

## UI

- 只保留主界面、结果反馈、结算入口
- 不加多余菜单和后台页

## Content

- 用小型事件池支撑主循环
- 一次只验证一条 Babel 创意线

## Constraints

- 总体规模目标控制在 5000 行以内
- 单个 worker 任务必须服从 packet budget
- 如需扩线，交回 manager 重新拆
