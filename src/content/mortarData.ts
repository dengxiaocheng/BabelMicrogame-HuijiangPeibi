/**
 * 灰浆配比 — 灰浆配方与材料数据
 *
 * 定义玩家需要调配的灰浆种类、目标比例、搅拌参数、质量判定阈值。
 * 服务核心情绪：比例调配 + 搅拌时间 + 隐藏质量
 */

// ============================================================
// Types
// ============================================================

/** 灰浆成分 */
export interface MortarComposition {
  /** 石灰 (份) */
  lime: number
  /** 黄沙 (份) */
  sand: number
  /** 水 (份) */
  water: number
}

/** 灰浆配方 */
export interface MortarRecipe {
  id: string
  name: string
  /** 目标配比 */
  target: MortarComposition
  /** 推荐搅拌时间（秒） */
  stirTimeSec: number
  /** 简述 */
  description: string
}

/** 一份实际调配的结果 */
export interface MixResult {
  /** 实际配比 */
  actual: MortarComposition
  /** 实际搅拌时间（秒） */
  stirTimeSec: number
  /** 环境湿度修正 0-1 (0=干燥, 1=极湿) */
  humidity: number
}

// ============================================================
// 质量计算
// ============================================================

/**
 * 计算配比误差 (0 = 完美, 1 = 完全偏离)
 * 对每个成分算相对偏差后取均值
 */
export function ratioError(target: MortarComposition, actual: MortarComposition): number {
  const tSum = target.lime + target.sand + target.water
  const aSum = actual.lime + actual.sand + actual.water
  if (tSum === 0 || aSum === 0) return 1

  const tLime = target.lime / tSum
  const tSand = target.sand / tSum
  const tWater = target.water / tSum
  const aLime = actual.lime / aSum
  const aSand = actual.sand / aSum
  const aWater = actual.water / aSum

  const diff = (a: number, b: number) => Math.abs(a - b)
  return (diff(tLime, aLime) + diff(tSand, aSand) + diff(tWater, aWater)) / 2 // 归一化到 0-1
}

/**
 * 计算搅拌充分度 (0–1)
 * 不足搅拌时间 -> 急剧下降；超过推荐时间 -> 缓慢提升
 */
export function stirQuality(stirTimeSec: number, targetTimeSec: number): number {
  if (stirTimeSec <= 0) return 0
  if (stirTimeSec >= targetTimeSec) {
    const excess = stirTimeSec - targetTimeSec
    return Math.min(1, 0.9 + excess / (targetTimeSec * 2))
  }
  const ratio = stirTimeSec / targetTimeSec
  return ratio * ratio // 二次衰减：搅一半只有 25% 充分度
}

/**
 * 综合隐藏质量评分 (0–100)
 * 由配比误差、搅拌充分度、环境湿度共同决定
 * 玩家在游戏中无法直接看到这个数值，只能通过表面反馈推断
 */
export function hiddenQuality(result: MixResult, recipe: MortarRecipe): number {
  const rErr = ratioError(recipe.target, result.actual)
  const sQual = stirQuality(result.stirTimeSec, recipe.stirTimeSec)
  // 湿度偏离 0.5 越远，质量越低
  const humidPenalty = Math.abs(result.humidity - 0.5) * 0.2

  const baseQuality = (1 - rErr) * sQual * (1 - humidPenalty)
  return Math.max(0, Math.min(100, Math.round(baseQuality * 100)))
}

// ============================================================
// 质量等级与表面反馈
// ============================================================

export type QualityTier = 'excellent' | 'good' | 'mediocre' | 'poor' | 'failure'

export function qualityTier(score: number): QualityTier {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'mediocre'
  if (score >= 25) return 'poor'
  return 'failure'
}

/** 表面反馈文本——玩家能观察到的外观描述 */
export const SURFACE_FEEDBACK: Record<QualityTier, string[]> = {
  excellent: [
    '表面平整如镜，色泽均匀。指按无痕，硬度适中。',
    '灰浆与砖面结合紧密，边角密实，无可挑剔。',
  ],
  good: [
    '表面整体平整，颜色略有色差。有一两处细微纹理。',
    '硬度不错，个别位置用力按压有轻微回弹。',
  ],
  mediocre: [
    '表面有可见纹理，几处微小裂纹。颜色不均匀。',
    '指按有浅坑，回弹慢。灰浆和砖面之间有细微分层。',
  ],
  poor: [
    '明显裂纹，多处起砂。指按即留凹痕。',
    '灰浆与砖面之间有空隙，敲击声音发脆。',
  ],
  failure: [
    '大面积开裂脱落，灰浆未能有效粘结。',
    '轻轻一碰就掉渣，暴露出底层的砖缝和空洞。',
  ],
}

/** 抽检反馈文本——监理敲击后的判断 */
export const INSPECT_FEEDBACK: Record<QualityTier, string> = {
  excellent: '锤声沉闷厚实，监理说："这面墙合格。"',
  good: '锤声尚可，监理在本上打了个勾，没有多说什么。',
  mediocre: '锤声有些空洞，监理皱眉："这里有问题，记下来。"',
  poor: '锤声清脆，灰浆处有碎屑掉落。监理沉着脸写了几行。',
  failure: '一锤下去灰浆大片剥落，露出砖缝。监理："停工，这一段全部返工。"',
}

// ============================================================
// 灰浆配方表
// ============================================================

export const RECIPES: MortarRecipe[] = [
  {
    id: 'standard',
    name: '标准石灰砂浆',
    target: { lime: 1, sand: 4, water: 1 },
    stirTimeSec: 300, // 5 分钟
    description: '常规配比，适用于大部分非承重内墙。',
  },
  {
    id: 'rich',
    name: '富灰砂浆',
    target: { lime: 1, sand: 3, water: 0.8 },
    stirTimeSec: 360, // 6 分钟
    description: '石灰含量高，粘性强，适合修补和关键节点。干得慢。',
  },
  {
    id: 'lean',
    name: '贫灰砂浆',
    target: { lime: 1, sand: 5, water: 1.2 },
    stirTimeSec: 240, // 4 分钟
    description: '省料配比，流动性好。强度低，只能用于临时遮盖或非关键面。',
  },
]

export function recipeById(id: string): MortarRecipe | undefined {
  return RECIPES.find((r) => r.id === id)
}
