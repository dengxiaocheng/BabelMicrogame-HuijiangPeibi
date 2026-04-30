/**
 * 灰浆配比 — 状态管理测试
 */

import assert from 'node:assert/strict'
import {
  createInitialState,
  setMixRatio,
  updateStirProgress,
  applyToWall,
  consumeMaterials,
  advancePhase,
  isGameOver,
  performApplyCycle,
  settleRound,
  isSettled,
} from './state.js'

// Test 1: 初始状态
const s = createInitialState()
assert.equal(s.water, 100, 'water init')
assert.equal(s.sand, 100, 'sand init')
assert.equal(s.lime, 100, 'lime init')
assert.equal(s.wall_quality, 70, 'quality init')
assert.equal(s.inspection_risk, 0, 'risk init')
assert.equal(s.phase, 'check_materials', 'phase init')
console.log('✓ 初始状态正确')

// Test 2: 阶段推进
advancePhase(s)
assert.equal(s.phase, 'mix_ratio')
advancePhase(s)
assert.equal(s.phase, 'stir')
advancePhase(s)
assert.equal(s.phase, 'apply')
advancePhase(s)
assert.equal(s.phase, 'observe')
advancePhase(s)
assert.equal(s.phase, 'inspect')
console.log('✓ 阶段推进正确')

// Test 3: 完成一轮循环
const s2 = createInitialState()
for (let i = 0; i < 6; i++) advancePhase(s2)
assert.equal(s2.phase, 'check_materials', '回到起点')
assert.equal(s2.round, 2, '轮数+1')
assert.equal(s2.stirProgress, 0, '搅拌重置')
console.log('✓ 完整循环正确')

// Test 4: 搅拌进度
const s3 = createInitialState()
updateStirProgress(s3, 1)
assert(s3.stirProgress > 0, '搅拌有进度')
updateStirProgress(s3, 20)
assert(s3.stirProgress <= 1, '搅拌不超过1')
console.log('✓ 搅拌进度正确')

// Test 5: 配比设置
const s4 = createInitialState()
setMixRatio(s4, 1, 4, 1)
assert.equal(s4.mixWater, 1)
assert.equal(s4.mixSand, 4)
assert.equal(s4.mixLime, 1)
console.log('✓ 配比设置正确')

// Test 6: 理想配比 + 充分搅拌 = 高质量
const s5 = createInitialState()
setMixRatio(s5, 1, 4, 1)
s5.stirProgress = 0.9
applyToWall(s5)
assert(s5.currentWallQuality > 60, `理想配比应得高质量, got ${s5.currentWallQuality}`)
console.log('✓ 理想配比质量计算正确')

// Test 7: 差配比 + 低搅拌 = 低质量
const s6 = createInitialState()
setMixRatio(s6, 10, 0, 0)
s6.stirProgress = 0.1
applyToWall(s6)
assert(s6.currentWallQuality < 30, `差配比应得低质量, got ${s6.currentWallQuality}`)
console.log('✓ 差配比质量计算正确')

// Test 8: 材料消耗
const s7 = createInitialState()
setMixRatio(s7, 5, 5, 5)
consumeMaterials(s7)
assert(s7.water < 100, '水被消耗')
assert(s7.sand < 100, '砂被消耗')
assert(s7.lime < 100, '灰被消耗')
console.log('✓ 材料消耗正确')

// Test 9: 游戏结束判定
const s8 = createInitialState()
s8.inspection_risk = 100
assert(isGameOver(s8), '风险满应结束')
const s9 = createInitialState()
s9.water = 0; s9.sand = 0; s9.lime = 0
assert(isGameOver(s9), '材料耗尽应结束')
const s10 = createInitialState()
assert(!isGameOver(s10), '正常状态不应结束')
console.log('✓ 游戏结束判定正确')

console.log('\n所有测试通过!')

// ============================================================
// Test 10–12: performApplyCycle 状态耦合
// ============================================================

// Test 10: 理想配比 performApplyCycle — 资源 + 风险同时变化
const sa = createInitialState()
setMixRatio(sa, 1, 4, 1)
sa.stirProgress = 0.9
performApplyCycle(sa)
assert(sa.currentWallQuality > 60, `applyCycle: 理想配比应高质, got ${sa.currentWallQuality}`)
assert(sa.water < 100 || sa.sand < 100 || sa.lime < 100, 'applyCycle: 材料被消耗')
assert(sa.wall_quality > 0, 'applyCycle: wall_quality 有变化')
console.log('✓ performApplyCycle 理想配比耦合正确')

// Test 11: 低质量返工消耗额外材料
const sb = createInitialState()
setMixRatio(sb, 10, 0, 0)
sb.stirProgress = 0.1
performApplyCycle(sb)
assert(sb.currentWallQuality < 30, `差配比低质量, got ${sb.currentWallQuality}`)
// consumeMaterials 扣 mixWater*3=30, 低质量额外扣 2, 共 32
assert(sb.water <= 100 - 10 * 3 - 2, `低质量应额外消耗, water=${sb.water}`)
console.log('✓ 低质量返工额外消耗正确')

// Test 12: 材料不足增加风险
const sc = createInitialState()
sc.water = 10; sc.sand = 10; sc.lime = 10
setMixRatio(sc, 1, 1, 1)
sc.stirProgress = 0.5
performApplyCycle(sc)
// consumeMaterials 扣完后 water=7,sand=7,lime=7, avg=7 < 20 → +5 risk
assert(sc.inspection_risk > 0, `材料不足应加风险, risk=${sc.inspection_risk}`)
console.log('✓ 材料不足风险耦合正确')

// ============================================================
// Test 13–19: settleRound 结算
// ============================================================

// Test 13: 稳固墙体
const sd = createInitialState()
sd.wall_quality = 80; sd.inspection_risk = 10
const r13 = settleRound(sd)
assert.equal(r13.outcome, 'solid_wall')
assert.equal(r13.summary, '墙体稳固，配比合格')
assert(isSettled(r13), 'solid_wall 应为终态')
console.log('✓ 结算 — 稳固墙体')

// Test 14: 暂时遮掩
const se = createInitialState()
se.wall_quality = 55; se.inspection_risk = 25
const r14 = settleRound(se)
assert.equal(r14.outcome, 'covered_up')
assert(isSettled(r14), 'covered_up 应为终态')
console.log('✓ 结算 — 暂时遮掩')

// Test 15: 需要返工
const sf = createInitialState()
sf.wall_quality = 30; sf.inspection_risk = 60
const r15 = settleRound(sf)
assert.equal(r15.outcome, 'rework_needed')
assert(isSettled(r15), 'rework_needed 应为终态')
console.log('✓ 结算 — 需要返工')

// Test 16: 关键崩溃（风险满）
const sg = createInitialState()
sg.inspection_risk = 100
const r16 = settleRound(sg)
assert.equal(r16.outcome, 'critical_fail')
assert.equal(r16.summary, '抽检不合格，被要求返工淘汰')
assert(isSettled(r16), 'critical_fail 应为终态')
console.log('✓ 结算 — 关键崩溃(风险)')

// Test 17: 关键崩溃（材料耗尽）
const sh = createInitialState()
sh.water = 0; sh.sand = 0; sh.lime = 0
const r17 = settleRound(sh)
assert.equal(r17.outcome, 'critical_fail')
assert.equal(r17.summary, '材料耗尽，被迫停工')
console.log('✓ 结算 — 关键崩溃(材料)')

// Test 18: 继续循环 (quality>=40 但 risk>=50 → 不命中任何终态)
const si = createInitialState()
si.wall_quality = 50; si.inspection_risk = 55
const r18 = settleRound(si)
assert.equal(r18.outcome, 'continuing')
assert(!isSettled(r18), 'continuing 不应为终态')
console.log('✓ 结算 — 继续循环')

// Test 19: 完整一次主循环 + 结算
const sj = createInitialState()
setMixRatio(sj, 1, 4, 1)
sj.stirProgress = 0.9
advancePhase(sj) // check_materials → mix_ratio
advancePhase(sj) // mix_ratio → stir
advancePhase(sj) // stir → apply
performApplyCycle(sj)
assert(sj.currentWallQuality > 60, `完整循环: 高质量, got ${sj.currentWallQuality}`)
const r19 = settleRound(sj)
assert(
  r19.outcome === 'solid_wall',
  `完整循环理想配比应稳固, got ${r19.outcome}`,
)
console.log('✓ 完整一次主循环 + 结算')
