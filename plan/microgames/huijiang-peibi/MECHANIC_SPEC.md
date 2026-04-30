# MECHANIC_SPEC: 灰浆配比

## Primary Mechanic

- mechanic: 比例调配 + 搅拌时间 + 隐藏质量
- primary_input: 调节水/砂/灰比例滑杆并按住搅拌到目标稠度
- minimum_interaction: 玩家必须手动调整至少两个材料比例，再控制搅拌时间影响墙面质量

## Mechanic Steps（每面墙段循环一次）

### Step 1：查看材料余量
- 显示当前 water / sand / lime 数值
- 玩家决定本次调配用量

### Step 2：调整配比
- 三个滑杆分别控制水/砂/灰的投入量（各自 0-100，实际消耗不超过库存）
- 配比 = water_input : sand_input : lime_input
- 理想配比参考值：1 : 2 : 1（容差范围内为"合格"）
- 偏离度计算：
  ```
  deviation = sqrt(
    ((water_ratio - 0.25) / 0.25)^2 +
    ((sand_ratio - 0.50) / 0.50)^2 +
    ((lime_ratio - 0.25) / 0.25)^2
  )
  ```
  其中 water_ratio = water_input / total_input，以此类推

### Step 3：控制搅拌
- 玩家按住搅拌按钮，搅拌槽开始搅拌动画
- 搅拌时长由玩家决定何时松开
- 目标搅拌窗口：2-4 秒（阶段 A 宽容可到 1.5-5 秒）
- 搅拌质量 =
  - 在窗口内：1.0（满分）
  - 低于窗口：0.5 + 0.5 * (actual / min_target)
  - 超过窗口：max(0.3, 1.0 - 0.2 * (actual - max_target))

### Step 4：涂抹墙段并结算
- 玩家点击涂抹按钮，灰浆应用到当前墙段
- 本墙段质量 = (1 - deviation * 0.5) * stir_quality * 100
- clamp 到 [0, 100]
- wall_quality 累积更新：wall_quality = wall_quality * 0.7 + current_batch_quality * 0.3
- 消耗材料：water -= water_input, sand -= sand_input, lime -= lime_input

### Step 5：观察表面反馈
- 墙面视觉反馈：
  - 质量 >= 70：表面平整，浅灰色
  - 质量 40-69：表面有细纹，略深色
  - 质量 < 40：表面有明显裂纹，深色斑块
- inspection_risk 更新：
  - 质量差（< 50）：inspection_risk += 15
  - 搅拌不足（stir_quality < 0.6）：inspection_risk += 10
  - 正常完成：inspection_risk -= 5（最低 0）

### Step 6：抽检或下一墙段
- 抽检触发：每面墙段完成后，以 inspection_risk/100 概率触发抽检
- 抽检结果：如果当前 wall_quality < 50 → 返工（扣减进度）；否则通过
- 未触发抽检：进入下一面墙段

## State Coupling

每次有效操作必须同时推动两类后果：
- 资源压力：water / sand / lime 至少一个减少
- 风险压力：wall_quality 或 inspection_risk 至少一个变化

## Not A Choice List

- 不能只展示 2-4 个文字按钮让玩家选择
- UI worker 必须把 primary input 映射到场景对象操作
- integration worker 必须让这个操作进入状态结算，而不是只写叙事反馈
- 玩家的核心操作必须是操作滑杆和按住按钮，不是点击选项
