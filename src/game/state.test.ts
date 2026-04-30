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
