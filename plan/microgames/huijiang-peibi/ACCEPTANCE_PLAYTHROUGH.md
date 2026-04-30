# ACCEPTANCE_PLAYTHROUGH: 灰浆配比

## 最小可试玩流程（QA Worker 必须验证）

### Pre-conditions
- 游戏已加载，初始状态：water=80, sand=80, lime=80, wall_quality=50, inspection_risk=10

### Playthrough Step 1：查看材料
- 操作：无，观察状态栏和材料余量
- 预期：看到 water/sand/lime 数值显示，三个滑杆在 0 位
- 验收：材料余量条可见且数值正确

### Playthrough Step 2：调整配比
- 操作：拖动水滑杆到 20，砂滑杆到 40，灰滑杆到 20
- 预期：稠度条显示"接近理想"，配比 1:2:1
- 验收：三个滑杆值显示正确，稠度条反映配比质量

### Playthrough Step 3：搅拌
- 操作：按住搅拌按钮 3 秒后松开
- 预期：搅拌动画播放，stir_quality = 1.0（在 2-4 秒窗口内）
- 验收：搅拌动画可见，搅拌质量结算正确

### Playthrough Step 4：涂抹
- 操作：点击涂抹按钮
- 预期：
  - deviation ≈ 0（理想配比），batch_quality ≈ 100
  - wall_quality 更新为 50 * 0.7 + 100 * 0.3 = 65
  - inspection_risk 更新为 max(0, 10 - 5) = 5
  - 材料消耗：water=60, sand=40, lime=60
  - 墙面显示为平整浅灰色
- 验收：所有数值更新正确，墙面视觉变化可见

### Playthrough Step 5：抽检判定
- 操作：系统判定（inspection_risk=5，抽检概率 5%）
- 预期：大概率不触发抽检，进入下一墙段
- 验收：抽检逻辑存在且概率正确

### Playthrough Step 6：第二面墙段（非理想配比）
- 操作：水滑杆设为 40，砂滑杆设为 10，灰滑杆设为 10，搅拌 1 秒
- 预期：
  - 配比偏离理想值（水过多），deviation > 0
  - 搅拌不足，stir_quality < 0.8
  - batch_quality 显著低于 100
  - inspection_risk 上升
  - 墙面出现细纹或裂纹
- 验收：偏离配比和搅拌不足都产生负面反馈

### Playthrough Step 7：结算触发
- 操作：完成多面墙段后达到阶段 D 或材料耗尽
- 预期：显示结局（S/A/B）
- 验收：结算画面显示，结局与 wall_quality 和 inspection_risk 一致

## Direction Gate

- integration worker 必须让上述 Step 1-7 可完整试玩
- qa worker 必须用自动化测试或手工记录验证每一步的预期值
- 如试玩要求需要偏离 Direction Lock，停止并回交 manager
- 任何 worker 不允许用 mock 数据替代实际 state 结算来通过验收

## 关键验收检查点

| 检查点 | 验证内容 |
|-------|---------|
| 滑杆可操作 | 拖动滑杆改变数值，稠度条实时更新 |
| 搅拌有反馈 | 按住播放动画，松开结算质量 |
| 涂抹有结算 | 点击后 state 变化，墙面视觉变化 |
| 配比影响质量 | 偏离配比 → 质量下降 |
| 搅拌影响质量 | 时长不当 → 质量下降 |
| 抽检有风险 | 质量差 → 风险上升 → 可能触发抽检 |
| 结局可到达 | 满足条件 → 显示对应结局 |
