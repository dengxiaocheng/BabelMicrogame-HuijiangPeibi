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

// ============================================================
// 结算系统
// ============================================================

export type SettlementOutcome =
  | 'solid_wall'      // 稳固墙体：wall_quality >= 70, inspection_risk < 30
  | 'covered_up'      // 暂时遮掩：wall_quality >= 40, inspection_risk < 50
  | 'rework_needed'   // 需要返工：wall_quality < 40, inspection_risk >= 50
  | 'critical_fail'   // 关键崩溃：系统淘汰
  | 'continuing'      // 继续循环

export interface SettlementResult {
  outcome: SettlementOutcome
  wallQuality: number
  inspectionRisk: number
  materialAvg: number
  round: number
  summary: string
}

/** 材料平均余量 (0–100) */
function materialAvg(state: GameState): number {
  return (Math.max(0, state.water) + Math.max(0, state.sand) + Math.max(0, state.lime)) / 3
}

/**
 * 执行涂抹墙段的完整操作（状态耦合入口）
 *
 * 同时推动两类后果 (MECHANIC_SPEC State Coupling):
 *   生存/资源压力: 消耗 water/sand/lime, 更新 wall_quality
 *   关系/风险压力: 更新 inspection_risk, 材料不足或质量过低额外加压
 */
export function performApplyCycle(state: GameState): void {
  applyToWall(state)
  consumeMaterials(state)

  // 材料不足 → 风险压力增加
  const avg = materialAvg(state)
  if (avg < 20) {
    state.inspection_risk = Math.min(100, state.inspection_risk + 5)
  }

  // 质量过低 → 返工消耗额外材料
  if (state.currentWallQuality < 30) {
    state.water = Math.max(0, state.water - 2)
    state.sand = Math.max(0, state.sand - 2)
    state.lime = Math.max(0, state.lime - 2)
  }
}

/**
 * 一次完整主循环后的结算
 *
 * 评估所有 5 个 Required State，确定结算结局:
 *   Success: solid_wall / covered_up
 *   Failure: rework_needed / critical_fail
 *   未定: continuing
 */
export function settleRound(state: GameState): SettlementResult {
  const avg = materialAvg(state)

  // === 关键崩溃 ===
  if (state.inspection_risk >= 100) {
    return {
      outcome: 'critical_fail',
      wallQuality: state.wall_quality,
      inspectionRisk: state.inspection_risk,
      materialAvg: avg,
      round: state.round,
      summary: '抽检不合格，被要求返工淘汰',
    }
  }
  if (state.water <= 0 && state.sand <= 0 && state.lime <= 0) {
    return {
      outcome: 'critical_fail',
      wallQuality: state.wall_quality,
      inspectionRisk: state.inspection_risk,
      materialAvg: 0,
      round: state.round,
      summary: '材料耗尽，被迫停工',
    }
  }

  // === 成功结算 ===
  if (state.wall_quality >= 70 && state.inspection_risk < 30) {
    return {
      outcome: 'solid_wall',
      wallQuality: state.wall_quality,
      inspectionRisk: state.inspection_risk,
      materialAvg: avg,
      round: state.round,
      summary: '墙体稳固，配比合格',
    }
  }
  if (state.wall_quality >= 40 && state.inspection_risk < 50) {
    return {
      outcome: 'covered_up',
      wallQuality: state.wall_quality,
      inspectionRisk: state.inspection_risk,
      materialAvg: avg,
      round: state.round,
      summary: '表面尚可，暂时遮掩过关',
    }
  }

  // === 失败结算 ===
  if (state.wall_quality < 40 && state.inspection_risk >= 50) {
    return {
      outcome: 'rework_needed',
      wallQuality: state.wall_quality,
      inspectionRisk: state.inspection_risk,
      materialAvg: avg,
      round: state.round,
      summary: '质量太差，需要返工',
    }
  }

  // === 未定，继续循环 ===
  return {
    outcome: 'continuing',
    wallQuality: state.wall_quality,
    inspectionRisk: state.inspection_risk,
    materialAvg: avg,
    round: state.round,
    summary: '继续下一轮循环',
  }
}

/** 结算结果是否为终态 */
export function isSettled(result: SettlementResult): boolean {
  return result.outcome !== 'continuing'
}
