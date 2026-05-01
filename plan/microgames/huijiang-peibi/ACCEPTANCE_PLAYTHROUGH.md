# ACCEPTANCE_PLAYTHROUGH: 灰浆配比

## Scripted Playthrough
1. 开局显示 water / sand / lime / wall_quality / inspection_risk
2. 玩家执行一次核心操作：查看今日材料 -> 调配灰浆 -> 搅拌 -> 涂抹墙段 -> 观察表面反馈 -> 抽检或下一墙段
3. 系统必须反馈一个资源或身体压力变化
4. 系统必须反馈一个关系或风险变化

## Integration Verification (huijiang-peibi-integration)

### 主循环闭环验证
- [x] 6 阶段完整循环可跑通：check_materials → mix_ratio → stir → apply → observe → inspect → (回到 check_materials 或结算)
- [x] 每个阶段有对应的 action button 标签和操作
- [x] 事件系统在每个阶段可触发 (eventPool + pickEvent + showEvent)
- [x] 搅拌槽 canvas 渲染随配比和搅拌进度变化 (颜色、漩涡、颗粒)
- [x] 墙段 canvas 渲染随 currentWallQuality 变化 (灰浆覆盖层、裂缝、光泽)

### 结算入口可达
- [x] 每轮结束后 (inspect → check_materials) 调用 settleRound 检查结算条件
- [x] solid_wall (wall_quality >= 70, inspection_risk < 30) → 结算覆盖层显示 "墙体稳固"
- [x] covered_up (wall_quality >= 40, inspection_risk < 50) → 结算覆盖层显示 "暂时遮掩"
- [x] rework_needed (wall_quality < 40, inspection_risk >= 50) → 结算覆盖层显示 "需要返工"
- [x] critical_fail (inspection_risk >= 100 或材料耗尽) → handleGameOver 或 inspect 回调触发结算
- [x] continuing → 继续下一轮循环

### Primary Input 驱动状态结算
- [x] 滑杆 (water/sand/lime) → setMixRatio → performApplyCycle → applyToWall → currentWallQuality + wall_quality + inspection_risk
- [x] 按住搅拌 → updateStirProgress → stirProgress → performApplyCycle → 质量评分乘以搅拌充分度
- [x] 状态耦合：每次 performApplyCycle 同时推动资源消耗 (water/sand/lime) 和风险变化 (inspection_risk)

### 测试覆盖
- [x] 22 个测试全部通过 (state.test.ts)
- [x] Test 19-20: 完整主循环 + 结算验证
- [x] Test 21: 多轮失败路径
- [x] Test 22: Primary input → state delta

## Direction Gate
- integration worker 已完成闭环集成，未偏离 Direction Lock
- 核心循环保持：查看今日材料 -> 调配灰浆 -> 搅拌 -> 涂抹墙段 -> 观察表面反馈 -> 抽检或下一墙段
- 未新增第二套主循环
- qa worker 应验证以上所有 checkbox
