# TASK_BREAKDOWN: 灰浆配比

## 依赖关系图

```
foundation ──┬──> state ──┬──> integration ──> qa
             │             │
             ├──> content ─┘
             │
             └──> ui ──────┘
```

## Worker 1: `huijiang-peibi-foundation`

- lane: foundation
- level: M
- goal: 建立可运行的项目骨架，支持核心循环的挂载点
- 交付物：
  - 项目初始化（package.json, index.html 入口）
  - 游戏主循环框架（init → update → render）
  - 场景容器（搅拌槽区域、墙段显示区域、控制面板区域）
  - 状态占位（water/sand/lime/wall_quality/inspection_risk 存在但未接入逻辑）
- 验收标准：
  - 页面可加载，三个区域可见
  - 五个 state 变量可读写
  - 主循环可启动和停止
- 服务核心循环：提供「查看今日材料」的显示框架和循环骨架
- 禁止：不实现配比公式、搅拌逻辑、事件系统

## Worker 2: `huijiang-peibi-state`

- lane: logic
- level: M
- depends_on: foundation
- goal: 实现 MECHANIC_SPEC 中的所有公式和状态结算逻辑
- 交付物：
  - 配比偏离度计算（deviation）
  - 搅拌质量计算（stir_quality）
  - 本批次质量 → wall_quality 累积更新
  - inspection_risk 更新逻辑
  - 材料消耗逻辑
  - 抽检触发判定（概率检查）
  - 结局判定（S/A/B/淘汰）
  - 阶段推进逻辑（A→B→C→D）
- 验收标准：
  - 给定输入（water=20, sand=40, lime=20, stir_time=3s），输出 batch_quality ≈ 100
  - 给定偏离配比输入，输出 batch_quality 显著下降
  - 抽检概率 = inspection_risk / 100
  - 结局判定符合 DIRECTION_LOCK 的条件
- 服务核心循环：实现「调配灰浆 → 搅拌 → 涂抹墙段 → 观察表面反馈 → 抽检」的全部结算
- 禁止：不涉及 UI 渲染、不涉及事件文本内容

## Worker 3: `huijiang-peibi-content`

- lane: content
- level: M
- depends_on: foundation
- goal: 用事件池强化核心循环压力
- 交付物：
  - 事件池数据结构（材料类/天气类/人为类，见 MINI_GDD）
  - 事件触发条件（按阶段和 state 阈值）
  - 事件效果（修改 state 阈值或约束）
  - 阶段推进时的默认事件序列
- 验收标准：
  - 阶段 A 至少有 1 个教学事件
  - 阶段 B 至少有 2 个短缺事件
  - 阶段 C 至少有 2 个压力事件
  - 每个事件只推一个核心循环压力
- 服务核心循环：为「查看今日材料」和「抽检」提供变化和压力
- 禁止：不修改 state 结算公式、不涉及 UI 渲染

## Worker 4: `huijiang-peibi-ui`

- lane: ui
- level: M
- depends_on: foundation
- goal: 实现所有可交互 UI 组件和反馈渲染
- 交付物：
  - 三个比例滑杆（水/砂/灰），拖拽交互
  - 搅拌按钮（按住/松开检测）+ 搅拌动画
  - 涂抹按钮 + 墙面纹理渲染（平整/细纹/裂纹三档）
  - 稠度条（实时响应滑杆）
  - 材料余量条
  - inspection_risk 风险条
  - 结局显示画面
- 验收标准：
  - 滑杆可拖拽，值实时显示
  - 搅拌按钮按住有动画，松开停止
  - 墙面纹理三档视觉差异明显
  - 所有反馈条数值与 state 同步
- 服务核心循环：实现「调配灰浆」的滑杆操作、「搅拌」的按住交互、「观察表面反馈」的墙面渲染
- 禁止：不实现 state 结算逻辑、不定义事件内容

## Worker 5: `huijiang-peibi-integration`

- lane: integration
- level: M
- depends_on: state, content, ui
- goal: 把 state/content/ui 接成完整的主循环
- 交付物：
  - 滑杆值 → state 配比计算的绑定
  - 搅拌交互 → stir_quality → 批次质量的绑定
  - 涂抹按钮 → 完整一次循环结算的绑定
  - 事件触发 → state 修改 → UI 更新的绑定
  - 阶段推进逻辑的激活
  - 结局触发和显示
- 验收标准：
  - 完成 ACCEPTANCE_PLAYTHROUGH 中 Step 1-7 全流程
  - 每步操作产生正确的 state 变化和 UI 反馈
  - 结局可到达
- 服务核心循环：把所有部件接成可运行的「查看今日材料 -> 调配灰浆 -> 搅拌 -> 涂抹墙段 -> 观察表面反馈 -> 抽检或下一墙段」
- 禁止：不修改 state 结算公式、不修改事件内容、不添加新 UI 组件

## Worker 6: `huijiang-peibi-qa`

- lane: qa
- level: S
- depends_on: integration
- goal: 验证方向没跑偏
- 交付物：
  - 按 ACCEPTANCE_PLAYTHROUGH 逐项测试记录
  - 核心循环完整性验证报告
  - 配比公式正确性验证（至少 3 组输入/预期输出）
  - 抽检概率验证（统计 100 次抽样结果）
- 验收标准：
  - ACCEPTANCE_PLAYTHROUGH 所有关键检查点通过
  - 配比偏离 → 质量下降可复现
  - 搅拌不足 → 质量下降可复现
  - 抽检概率与 inspection_risk/100 一致（±10%）
- 服务核心循环：确保核心循环每一步可操作、可结算、有反馈
- 禁止：不修改任何游戏代码，只写测试和报告
