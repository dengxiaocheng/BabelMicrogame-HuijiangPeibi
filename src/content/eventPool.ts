/**
 * 灰浆配比 — 事件池
 *
 * 所有事件服务于核心情绪：比例调配 + 搅拌时间 + 隐藏质量
 * 事件按核心循环6阶段组织，直接绑定 Required State
 * 每个事件关联一个场景对象，强化物理操作感
 */

import type { GameState } from '../game/state.js'

// ============================================================
// Types
// ============================================================

export type LoopStage =
  | 'check_materials'   // 查看今日材料
  | 'mix_ratio'         // 调配灰浆
  | 'stir'              // 搅拌
  | 'apply'             // 涂抹墙段
  | 'observe'           // 观察表面反馈
  | 'inspect'           // 抽检或下一墙段

/** 场景对象 (SCENE_INTERACTION_SPEC) */
export type SceneObject =
  | 'water_bucket'     // 水桶
  | 'sand_pile'        // 砂堆
  | 'lime_bag'         // 灰袋
  | 'mixing_trough'    // 搅拌槽
  | 'wall_section'     // 待涂墙段

/** 触发阈值：直接使用 Required State 字段，值域 [min, max] 0–100 */
export interface StateThresholds {
  water?: [number, number]
  sand?: [number, number]
  lime?: [number, number]
  wall_quality?: [number, number]
  inspection_risk?: [number, number]
  round?: [number, number]
}

/** 状态效果：直接修改 Required State */
export interface StateEffects {
  water?: number
  sand?: number
  lime?: number
  wall_quality?: number
  inspection_risk?: number
}

export interface EventChoice {
  text: string
  stateEffect: StateEffects
  followUp: string
}

export interface GameEvent {
  id: string
  stage: LoopStage
  /** 关联的场景对象 */
  sceneObject: SceneObject
  /** 触发条件：各 Required State 值域 [min, max] */
  trigger?: StateThresholds
  /** 事件叙述（围绕场景对象） */
  text: string
  /** 无条件生效的状态变化 */
  passiveEffect?: StateEffects
  /** 玩家选择分支 */
  choices?: EventChoice[]
}

// ============================================================
// 查看今日材料 — check_materials
// 场景对象：砂堆、灰袋
// 核心情绪：材料短缺 + 配比妥协
// ============================================================

const materialEvents: GameEvent[] = [
  {
    id: 'mat_shortage',
    stage: 'check_materials',
    sceneObject: 'sand_pile',
    trigger: { sand: [0, 40] },
    text: '砂堆比昨天矮了一大截。工头说路上断了，下午能补——但你现在就要开工。',
    choices: [
      {
        text: '按现有材料减量配比',
        stateEffect: { inspection_risk: 10, sand: -5 },
        followUp: '每份灰浆的砂量压低了，稠度看着还行。但骨料不够实。',
      },
      {
        text: '等材料到了再开工',
        stateEffect: { wall_quality: -5 },
        followUp: '等了两小时，沙子才到。工头踱步的频率越来越快。',
      },
    ],
  },
  {
    id: 'mat_impure',
    stage: 'check_materials',
    sceneObject: 'lime_bag',
    trigger: { round: [2, 99] },
    text: '打开灰袋，手感发涩——这批货掺了杂质。按正常比例配，强度会打折扣。',
    choices: [
      {
        text: '加大石灰用量补偿',
        stateEffect: { lime: -10, inspection_risk: 5 },
        followUp: '多加了石灰，粘稠了不少。账面比例对了，但杂质还在里面。',
      },
      {
        text: '用这批，记下来',
        stateEffect: { inspection_risk: 15 },
        followUp: '没有调整，照常搅。但心里知道这一锅的底子差了。',
      },
    ],
  },
  {
    id: 'mat_extra_good',
    stage: 'check_materials',
    sceneObject: 'lime_bag',
    trigger: { lime: [60, 100] },
    text: '灰袋堆里有昨天剩的半袋上品石灰，粉质细腻。你有机会调一份"精品灰浆"。',
    choices: [
      {
        text: '单独调一份用在关键墙段',
        stateEffect: { lime: -15, inspection_risk: -10 },
        followUp: '关键位置用了好料，硬度让人安心。剩下的墙段得省着用。',
      },
      {
        text: '混在一起用',
        stateEffect: { lime: -5, wall_quality: 3 },
        followUp: '好料稀释在全部灰浆里。整体稍好一点，但哪面墙都不是最好的。',
      },
    ],
  },
]

// ============================================================
// 调配灰浆 — mix_ratio
// 场景对象：搅拌槽
// 核心情绪：比例偏差 + 甲方压力
// ============================================================

const ratioEvents: GameEvent[] = [
  {
    id: 'ratio_change_order',
    stage: 'mix_ratio',
    sceneObject: 'mixing_trough',
    trigger: { inspection_risk: [30, 100] },
    text: '工头跑过来说甲方临时改了配比，含灰量要提高两成。搅拌槽里已按旧比例称好了料。',
    choices: [
      {
        text: '重新称量，按要求调',
        stateEffect: { lime: -5, sand: -5, inspection_risk: -5 },
        followUp: '倒回袋子重新称。费了时间，但新比例至少是甲方要的。',
      },
      {
        text: '在旧料上补灰凑数',
        stateEffect: { lime: -3, inspection_risk: 12 },
        followUp: '直接往槽里撒石灰。目测差不多，能不能搅匀得看接下来。',
      },
    ],
  },
  {
    id: 'ratio_blurred_card',
    stage: 'mix_ratio',
    sceneObject: 'mixing_trough',
    text: '配比单被水渍糊了一块。砂灰比可能是1:3，也可能是1:5。凭经验往槽里称。',
    choices: [
      {
        text: '按1:3配（偏富灰浆）',
        stateEffect: { lime: -8, inspection_risk: 5 },
        followUp: '颜色偏白，粘性强。干得慢，但时间够的话强度不差。',
      },
      {
        text: '按1:5配（偏贫灰浆）',
        stateEffect: { inspection_risk: 12 },
        followUp: '偏砂色，好涂抹。但受力时容易起粉。',
      },
    ],
  },
  {
    id: 'ratio_watcher',
    stage: 'mix_ratio',
    sceneObject: 'mixing_trough',
    trigger: { inspection_risk: [40, 100] },
    text: '监理站在搅拌槽后面不说话，拿本子记录你的称料动作。',
    passiveEffect: { inspection_risk: 5 },
    choices: [
      {
        text: '严格按标准配比操作',
        stateEffect: { lime: -5, sand: -5, inspection_risk: -8 },
        followUp: '每步到位，搅拌顺序也没偷懒。监理划了几笔，走了。',
      },
      {
        text: '快速调完，反正他看不懂细节',
        stateEffect: { inspection_risk: 8 },
        followUp: '你加快了手速。监理皱眉，在本子上多写了两行。',
      },
    ],
  },
]

// ============================================================
// 搅拌 — stir
// 场景对象：水桶、搅拌槽
// 核心情绪：搅拌时间 + 稠度判断
// ============================================================

const stirEvents: GameEvent[] = [
  {
    id: 'stir_humid',
    stage: 'stir',
    sceneObject: 'water_bucket',
    text: '天阴下来，空气闷湿。水桶里的水看上去比实际多——水灰比需要调低，调低多少全凭手感。',
    choices: [
      {
        text: '少加水，宁可干一点',
        stateEffect: { inspection_risk: 8, water: 3 },
        followUp: '灰浆偏硬，抹上墙费劲。但干硬灰浆密实度更高——前提是你抹得上去。',
      },
      {
        text: '按正常量加水',
        stateEffect: { inspection_risk: 15 },
        followUp: '看起来正常，但空气湿度让实际含水量偏高。硬化后可能出现收缩裂缝。',
      },
    ],
  },
  {
    id: 'stir_rush',
    stage: 'stir',
    sceneObject: 'mixing_trough',
    trigger: { wall_quality: [0, 60] },
    text: '工头催：能不能快点？标准搅拌5分钟，你现在才搅了2分钟。搅拌槽里的灰浆还有结块。',
    choices: [
      {
        text: '继续搅到5分钟',
        stateEffect: { wall_quality: 5, inspection_risk: -5 },
        followUp: '硬是多等了3分钟。灰浆均匀了，但工头的脸更黑了。',
      },
      {
        text: '2分钟出料',
        stateEffect: { inspection_risk: 18 },
        followUp: '灰浆里有干粉结块没散开。拌了拌表面看着还行——里面埋了隐患。',
      },
    ],
  },
  {
    id: 'stir_tool_crack',
    stage: 'stir',
    sceneObject: 'mixing_trough',
    trigger: { round: [2, 99] },
    text: '搅拌铲柄裂了。换工具要10分钟，搅拌槽里已搅了一半。',
    choices: [
      {
        text: '停搅换工具',
        stateEffect: { wall_quality: -3, inspection_risk: 3 },
        followUp: '新铲手感不同，前后段均匀度有差。至少没用坏工具硬搅。',
      },
      {
        text: '用裂柄铲凑合搅完',
        stateEffect: { inspection_risk: 10 },
        followUp: '裂柄使不上劲，底部没翻上来。表面均匀，底层可能有生料。',
      },
    ],
  },
]

// ============================================================
// 涂抹墙段 — apply
// 场景对象：待涂墙段
// 核心情绪：材料消耗 + 墙面质量
// ============================================================

const applyEvents: GameEvent[] = [
  {
    id: 'apply_bad_wall',
    stage: 'apply',
    sceneObject: 'wall_section',
    trigger: { wall_quality: [0, 50] },
    text: '这面墙段砖缝参差不齐，几块砖明显歪了。灰浆能不能填住，心里没底。',
    choices: [
      {
        text: '厚抹一层盖住缺陷',
        stateEffect: { sand: -8, water: -5, inspection_risk: 12 },
        followUp: '多抹了一层，表面平整。但厚层干缩会产生应力——时间会暴露一切。',
      },
      {
        text: '先处理砖缝再抹',
        stateEffect: { sand: -5, water: -3, lime: -3, wall_quality: 5 },
        followUp: '花了时间勾缝。多用了灰浆，但这面墙的基础至少是实的。',
      },
    ],
  },
  {
    id: 'apply_running_out',
    stage: 'apply',
    sceneObject: 'wall_section',
    trigger: { water: [0, 30], sand: [0, 30] },
    text: '灰浆不够了。剩下墙段要么薄薄抹一层，要么只抹最显眼的地方。',
    choices: [
      {
        text: '全面薄抹',
        stateEffect: { sand: -3, water: -2, inspection_risk: 15 },
        followUp: '薄到能看见底下的砖色。起码遮住了，但一碰就掉渣。',
      },
      {
        text: '只抹外立面',
        stateEffect: { inspection_risk: 10 },
        followUp: '外面光滑体面，里面毛墙裸露。甲方要是走里面看就露馅了。',
      },
    ],
  },
  {
    id: 'apply_old_crack',
    stage: 'apply',
    sceneObject: 'wall_section',
    trigger: { inspection_risk: [50, 100] },
    text: '抹到一半，摸到墙段下方有旧裂缝在延伸。能不能粘住，取决于用不用界面剂。',
    choices: [
      {
        text: '用界面剂处理裂缝',
        stateEffect: { water: -5, lime: -5, inspection_risk: -10 },
        followUp: '刷了界面剂再抹灰。多花了料，但裂缝不会再从灰浆底下裂出来。',
      },
      {
        text: '直接抹上去盖住',
        stateEffect: { inspection_risk: 20 },
        followUp: '把灰浆压进裂缝填平。和旧墙之间没有过渡——只是暂时盖住了。',
      },
    ],
  },
]

// ============================================================
// 观察表面反馈 — observe
// 场景对象：待涂墙段
// 核心情绪：隐藏质量 → 表面可见信号
// ============================================================

const observeEvents: GameEvent[] = [
  {
    id: 'obs_hairline',
    stage: 'observe',
    sceneObject: 'wall_section',
    trigger: { wall_quality: [30, 70] },
    text: '刚抹好的墙段出现了几条发丝细裂纹。可能是正常干缩，也可能是配比问题。',
    choices: [
      {
        text: '标记为正常干缩，继续',
        stateEffect: { inspection_risk: 8 },
        followUp: '说服自己这是正常的。但接下来每面墙都会多看一眼。',
      },
      {
        text: '淋水养护延缓干燥',
        stateEffect: { water: -3, inspection_risk: -5 },
        followUp: '喷了水，裂纹不再扩展。但养护要时间，今天的进度又慢了。',
      },
    ],
  },
  {
    id: 'obs_perfect',
    stage: 'observe',
    sceneObject: 'wall_section',
    trigger: { wall_quality: [70, 100], inspection_risk: [0, 20] },
    text: '灰浆表面平整，颜色均匀，无裂纹无气泡。摸上去硬度适中。今天最好的一锅。',
    passiveEffect: { wall_quality: 5, inspection_risk: -5 },
  },
  {
    id: 'obs_bubbles',
    stage: 'observe',
    sceneObject: 'wall_section',
    trigger: { inspection_risk: [40, 100] },
    text: '墙段表面冒出几个小气泡，戳破后留下针眼孔洞。搅拌时裹进空气了。',
    choices: [
      {
        text: '重新压实表面',
        stateEffect: { wall_quality: 3 },
        followUp: '又压了一遍，气泡基本没了。内部是否还有气孔，外面看不出来。',
      },
      {
        text: '不管它，小气泡不影响结构',
        stateEffect: { inspection_risk: 5 },
        followUp: '小气泡确实不一定出问题——除非冻融循环把它们撑成大洞。',
      },
    ],
  },
]

// ============================================================
// 抽检或下一墙段 — inspect
// 场景对象：待涂墙段
// 核心情绪：抽检压力 + 遮掩/返工抉择
// ============================================================

const inspectEvents: GameEvent[] = [
  {
    id: 'ins_spot_check',
    stage: 'inspect',
    sceneObject: 'wall_section',
    trigger: { inspection_risk: [40, 100] },
    text: '监理拿锤子走过来："敲一下你昨天抹的墙。"声音闷实还是清脆，取决于灰浆内部的真实质量。',
    choices: [
      {
        text: '主动带监理去看最好的墙段',
        stateEffect: { wall_quality: 5, inspection_risk: 5 },
        followUp: '绕到质量最好的墙段，锤声闷实。监理点头，但他还有别的墙要查。',
      },
      {
        text: '随他挑，不引导',
        stateEffect: { inspection_risk: -5 },
        followUp: '随机敲了三面，声音有闷有脆。他没当场说什么，在本上记了几笔走了。',
      },
    ],
  },
  {
    id: 'ins_skip_opp',
    stage: 'inspect',
    sceneObject: 'wall_section',
    trigger: { wall_quality: [0, 60] },
    text: '跳过这面墙段的抽检直接进下一面？省下的时间能缓解赶工压力，但风险会累积。',
    choices: [
      {
        text: '快速自检30秒',
        stateEffect: { inspection_risk: 8 },
        followUp: '扫了一眼，没明显问题。但30秒能看出什么？只是给自己打了个勾。',
      },
      {
        text: '跳过抽检',
        stateEffect: { inspection_risk: 20 },
        followUp: '没检查就标记完成。这一墙段的质量成了一个黑洞——直到某天被打开。',
      },
    ],
  },
  {
    id: 'ins_cover_up',
    stage: 'inspect',
    sceneObject: 'wall_section',
    trigger: { inspection_risk: [50, 100] },
    text: '工人小声说：北面那堵墙有空鼓。揭掉返工今天进度全废，用石膏补表面抽检可能过关。',
    choices: [
      {
        text: '返工',
        stateEffect: { water: -10, sand: -10, lime: -10, inspection_risk: -15 },
        followUp: '铲掉不合格灰浆重来。进度落后了，但这面墙是实心的。',
      },
      {
        text: '石膏补表面',
        stateEffect: { inspection_risk: 25 },
        followUp: '石膏补平空鼓处，外观看不出。监理查到是迟早的事——如果他会查的话。',
      },
    ],
  },
]

// ============================================================
// Export
// ============================================================

/** 完整事件池，按核心循环6阶段组织 */
export const EVENT_POOL: GameEvent[] = [
  ...materialEvents,
  ...ratioEvents,
  ...stirEvents,
  ...applyEvents,
  ...observeEvents,
  ...inspectEvents,
]

/** 按阶段索引事件 */
export function eventsByStage(stage: LoopStage): GameEvent[] {
  return EVENT_POOL.filter((e) => e.stage === stage)
}

/** 检查事件是否满足触发条件（基于 Required State） */
export function canTrigger(event: GameEvent, state: GameState): boolean {
  if (!event.trigger) return true
  const t = event.trigger
  if (t.water != null && (state.water < t.water[0] || state.water > t.water[1])) return false
  if (t.sand != null && (state.sand < t.sand[0] || state.sand > t.sand[1])) return false
  if (t.lime != null && (state.lime < t.lime[0] || state.lime > t.lime[1])) return false
  if (t.wall_quality != null && (state.wall_quality < t.wall_quality[0] || state.wall_quality > t.wall_quality[1])) return false
  if (t.inspection_risk != null && (state.inspection_risk < t.inspection_risk[0] || state.inspection_risk > t.inspection_risk[1])) return false
  if (t.round != null && (state.round < t.round[0] || state.round > t.round[1])) return false
  return true
}

/** 从某阶段可触发的事件中随机选取一个 */
export function pickEvent(
  stage: LoopStage,
  state: GameState,
  rng: () => number = Math.random,
): GameEvent | null {
  const eligible = eventsByStage(stage).filter((e) => canTrigger(e, state))
  if (eligible.length === 0) return null
  return eligible[Math.floor(rng() * eligible.length)]
}

/** 应用状态效果到游戏状态（带 0-100 钳位） */
export function applyEffects(state: GameState, effects: StateEffects): void {
  if (effects.water != null) state.water = Math.max(0, Math.min(100, state.water + effects.water))
  if (effects.sand != null) state.sand = Math.max(0, Math.min(100, state.sand + effects.sand))
  if (effects.lime != null) state.lime = Math.max(0, Math.min(100, state.lime + effects.lime))
  if (effects.wall_quality != null) state.wall_quality = Math.max(0, Math.min(100, state.wall_quality + effects.wall_quality))
  if (effects.inspection_risk != null) state.inspection_risk = Math.max(0, Math.min(100, state.inspection_risk + effects.inspection_risk))
}
