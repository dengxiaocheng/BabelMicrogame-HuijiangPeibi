/**
 * 灰浆配比 — 游戏状态管理
 *
 * 管理核心循环所需的 5 个 Required State:
 *   water, sand, lime, wall_quality, inspection_risk
 * 以及核心循环阶段追踪。
 */

export type LoopPhase =
  | 'check_materials'   // 查看今日材料
  | 'mix_ratio'         // 调配灰浆
  | 'stir'              // 搅拌
  | 'apply'             // 涂抹墙段
  | 'observe'           // 观察表面反馈
  | 'inspect'           // 抽检或下一墙段

export interface GameState {
  // === Required State (Direction Lock) ===
  water: number
  sand: number
  lime: number
  wall_quality: number
  inspection_risk: number

  // === 循环追踪 ===
  phase: LoopPhase
  round: number

  // === 当前调配 ===
  mixWater: number
  mixSand: number
  mixLime: number
  stirProgress: number     // 0-1 搅拌充分度
  currentWallQuality: number  // 当前墙段的隐藏质量
}

const PHASES: LoopPhase[] = [
  'check_materials', 'mix_ratio', 'stir', 'apply', 'observe', 'inspect',
]

export function createInitialState(): GameState {
  return {
    water: 100,
    sand: 100,
    lime: 100,
    wall_quality: 70,
    inspection_risk: 0,
    phase: 'check_materials',
    round: 1,
    mixWater: 3,
    mixSand: 5,
    mixLime: 2,
    stirProgress: 0,
    currentWallQuality: 0,
  }
}

export function setMixRatio(
  state: GameState, water: number, sand: number, lime: number,
): void {
  state.mixWater = water
  state.mixSand = sand
  state.mixLime = lime
}

export function updateStirProgress(state: GameState, dt: number): void {
  state.stirProgress = Math.min(1, state.stirProgress + dt * 0.15)
}

export function applyToWall(state: GameState): void {
  const total = state.mixWater + state.mixSand + state.mixLime
  if (total === 0) { state.currentWallQuality = 0; return }

  // 理想配比: 水1 : 砂4 : 灰1 (比例)
  const idealW = 1 / 6, idealS = 4 / 6, idealL = 1 / 6
  const wR = state.mixWater / total
  const sR = state.mixSand / total
  const lR = state.mixLime / total

  const ratioScore = 1 - (
    Math.abs(wR - idealW) + Math.abs(sR - idealS) + Math.abs(lR - idealL)
  ) / 2
  const stirScore = state.stirProgress

  state.currentWallQuality = Math.round(
    Math.max(0, Math.min(100, ratioScore * stirScore * 100)),
  )
  state.wall_quality = Math.round(
    (state.wall_quality * (state.round - 1) + state.currentWallQuality) / state.round,
  )
  state.inspection_risk = Math.min(
    100, state.inspection_risk + Math.max(0, 50 - state.currentWallQuality) * 0.5,
  )
}

export function consumeMaterials(state: GameState): void {
  state.water = Math.max(0, state.water - state.mixWater * 3)
  state.sand = Math.max(0, state.sand - state.mixSand * 3)
  state.lime = Math.max(0, state.lime - state.mixLime * 3)
}

export function advancePhase(state: GameState): void {
  const idx = PHASES.indexOf(state.phase)
  if (idx < PHASES.length - 1) {
    state.phase = PHASES[idx + 1]
  } else {
    // 完成一轮，进入下一墙段
    state.phase = 'check_materials'
    state.round++
    state.stirProgress = 0
    state.currentWallQuality = 0
  }
}

export function isGameOver(state: GameState): boolean {
  return (state.water <= 0 && state.sand <= 0 && state.lime <= 0)
    || state.inspection_risk >= 100
}
