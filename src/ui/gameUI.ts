/**
 * 灰浆配比 — 动态 UI 组件
 *
 * 注入压力显示、阶段管线、事件面板、表面反馈、结算覆盖
 * 服务核心目标：让玩家立即看见压力、操作和后果
 */

import type { GameState, LoopPhase } from '../game/state.js'
import type { GameEvent, EventChoice } from '../content/eventPool.js'
import {
  qualityTier,
  SURFACE_FEEDBACK,
  sceneObjectDescription,
  MATERIAL_SCENE_STATES,
  WALL_SCENE_STATE,
  stirFeedback,
} from '../content/mortarData.js'

// ============================================================
// Phase pipeline definition
// ============================================================

const PHASE_STEPS: { key: LoopPhase; label: string }[] = [
  { key: 'check_materials', label: '查看材料' },
  { key: 'mix_ratio', label: '调配灰浆' },
  { key: 'stir', label: '搅拌' },
  { key: 'apply', label: '涂抹墙段' },
  { key: 'observe', label: '观察表面' },
  { key: 'inspect', label: '抽检 / 下一墙段' },
]

// ============================================================
// DOM element refs
// ============================================================

let pressureBanner: HTMLDivElement
let phasePipeline: HTMLDivElement
let eventPanel: HTMLDivElement
let surfacePanel: HTMLDivElement
let settlementOverlay: HTMLDivElement

// ============================================================
// Init — inject all dynamic UI elements into existing page
// ============================================================

export function initGameUI(): void {
  const header = document.getElementById('header')!
  const controls = document.getElementById('controls')!

  // --- Pressure banner (after header) ---
  pressureBanner = document.createElement('div')
  pressureBanner.id = 'pressure-banner'
  Object.assign(pressureBanner.style, {
    width: '100%', maxWidth: '800px', padding: '8px 14px',
    marginBottom: '4px', borderRadius: '6px', fontSize: '14px',
    fontWeight: 'bold', background: '#3a2a1a', color: '#e8dcc8',
    textAlign: 'center', display: 'none', transition: 'all 0.3s',
  })
  header.after(pressureBanner)

  // --- Phase pipeline (after banner) ---
  phasePipeline = document.createElement('div')
  phasePipeline.id = 'phase-pipeline'
  Object.assign(phasePipeline.style, {
    display: 'flex', gap: '2px', width: '100%', maxWidth: '800px',
    marginBottom: '6px', fontSize: '11px', textAlign: 'center',
  })
  for (const step of PHASE_STEPS) {
    const el = document.createElement('div')
    el.dataset.phase = step.key
    el.textContent = step.label
    Object.assign(el.style, {
      flex: '1', padding: '4px 2px', background: '#3a2a1a',
      color: '#5a4a3a', borderRadius: '3px', transition: 'all 0.3s',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    })
    phasePipeline.appendChild(el)
  }
  pressureBanner.after(phasePipeline)

  // --- Event panel (before controls) ---
  eventPanel = document.createElement('div')
  eventPanel.id = 'event-panel'
  Object.assign(eventPanel.style, {
    width: '100%', maxWidth: '800px', background: '#3a2a1a',
    padding: '12px 16px', borderRadius: '6px', marginBottom: '6px',
    display: 'none', fontSize: '14px', lineHeight: '1.6',
  })
  controls.before(eventPanel)

  // --- Surface feedback (after controls) ---
  surfacePanel = document.createElement('div')
  surfacePanel.id = 'surface-panel'
  Object.assign(surfacePanel.style, {
    width: '100%', maxWidth: '800px', background: '#3a2a1a',
    padding: '12px 16px', borderRadius: '6px', marginTop: '6px',
    display: 'none', fontSize: '14px', lineHeight: '1.6',
  })
  controls.after(surfacePanel)

  // --- Settlement overlay (full screen, hidden) ---
  settlementOverlay = document.createElement('div')
  settlementOverlay.id = 'settlement-overlay'
  Object.assign(settlementOverlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.85)', display: 'none', justifyContent: 'center',
    alignItems: 'center', zIndex: '100',
  })
  document.body.appendChild(settlementOverlay)
}

// ============================================================
// Pressure banner — show material shortage + inspection risk
// ============================================================

export function updatePressureDisplay(state: GameState): void {
  const warnings: string[] = []

  if (state.water < 20) warnings.push('水桶即将见底')
  if (state.sand < 20) warnings.push('砂堆即将耗尽')
  if (state.lime < 20) warnings.push('灰袋快空了')

  if (state.inspection_risk >= 70) {
    warnings.push('抽检风险极高！随时可能被淘汰')
  } else if (state.inspection_risk >= 40) {
    warnings.push('抽检风险上升，注意质量')
  }

  if (warnings.length > 0) {
    pressureBanner.style.display = 'block'
    const urgent = state.inspection_risk >= 70
    const warning = state.inspection_risk >= 40
    pressureBanner.style.background = urgent ? '#5a1a1a' : warning ? '#5a4a1a' : '#3a2a1a'
    pressureBanner.style.color = urgent ? '#ff6060' : warning ? '#ffcc60' : '#e8dcc8'
    pressureBanner.textContent = warnings.join('    ')
  } else {
    pressureBanner.style.display = 'none'
  }
}

// ============================================================
// Phase pipeline — highlight current loop step
// ============================================================

export function updatePhasePipeline(currentPhase: LoopPhase): void {
  const currentIdx = PHASE_STEPS.findIndex(s => s.key === currentPhase)
  const children = phasePipeline.children
  for (let i = 0; i < children.length; i++) {
    const el = children[i] as HTMLElement
    if (i < currentIdx) {
      el.style.background = '#4a3a2a'
      el.style.color = '#8a7a6a'
      el.style.fontWeight = 'normal'
    } else if (i === currentIdx) {
      el.style.background = '#8b6914'
      el.style.color = '#ffffff'
      el.style.fontWeight = 'bold'
    } else {
      el.style.background = '#3a2a1a'
      el.style.color = '#5a4a3a'
      el.style.fontWeight = 'normal'
    }
  }
}

// ============================================================
// Event panel — show narrative events with scene objects
// ============================================================

export function showEvent(
  event: GameEvent,
  onChoice: (choice: EventChoice) => void,
): void {
  eventPanel.style.display = 'block'
  eventPanel.innerHTML = ''

  const sceneNames: Record<string, string> = {
    water_bucket: '水桶', sand_pile: '砂堆', lime_bag: '灰袋',
    mixing_trough: '搅拌槽', wall_section: '待涂墙段',
  }

  const tag = el('div', { fontSize: '11px', color: '#8b6914', marginBottom: '6px' })
  tag.textContent = `【${sceneNames[event.sceneObject] ?? event.sceneObject}】`
  eventPanel.appendChild(tag)

  const text = el('div', { marginBottom: '10px', color: '#e8dcc8' })
  text.textContent = event.text
  eventPanel.appendChild(text)

  if (event.choices && event.choices.length > 0) {
    const btnRow = el('div', { display: 'flex', gap: '8px', flexWrap: 'wrap' })
    for (const choice of event.choices) {
      const btn = document.createElement('button')
      Object.assign(btn.style, {
        padding: '8px 14px', background: '#5c4033', color: '#e8dcc8',
        border: '1px solid #8b6914', borderRadius: '4px', cursor: 'pointer',
        fontSize: '13px', transition: 'background 0.2s',
      })
      btn.textContent = choice.text
      btn.addEventListener('mouseenter', () => { btn.style.background = '#7a5a3a' })
      btn.addEventListener('mouseleave', () => { btn.style.background = '#5c4033' })
      btn.addEventListener('click', () => {
        onChoice(choice)
        eventPanel.innerHTML = ''
        const followUp = el('div', { color: '#c4a060', fontStyle: 'italic' })
        followUp.textContent = choice.followUp
        eventPanel.appendChild(followUp)
        setTimeout(() => { eventPanel.style.display = 'none' }, 2000)
      })
      btnRow.appendChild(btn)
    }
    eventPanel.appendChild(btnRow)
  } else {
    setTimeout(() => { eventPanel.style.display = 'none' }, 1500)
  }
}

export function hideEvent(): void {
  eventPanel.style.display = 'none'
}

// ============================================================
// Surface feedback — show wall observation during observe phase
// ============================================================

export function showSurfaceFeedback(wallQuality: number): void {
  const tier = qualityTier(wallQuality)
  const feedbacks = SURFACE_FEEDBACK[tier]
  const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)]

  surfacePanel.style.display = 'block'
  surfacePanel.innerHTML = ''

  const label = el('div', { fontSize: '11px', color: '#8b6914', marginBottom: '6px' })
  label.textContent = '【墙段表面观察】'
  surfacePanel.appendChild(label)

  const wallDesc = sceneObjectDescription(WALL_SCENE_STATE, wallQuality)
  const desc = el('div', { color: '#a09080', marginBottom: '4px', fontSize: '12px' })
  desc.textContent = wallDesc
  surfacePanel.appendChild(desc)

  const text = el('div', { color: '#e8dcc8', marginBottom: '6px' })
  text.textContent = feedback
  surfacePanel.appendChild(text)

  const tierNames: Record<string, string> = {
    excellent: '优秀', good: '良好', mediocre: '一般', poor: '较差', failure: '不合格',
  }
  const tierColors: Record<string, string> = {
    excellent: '#4a7c3f', good: '#6a9c5f', mediocre: '#c4a040', poor: '#c47040', failure: '#c45040',
  }
  const ql = el('div', { fontSize: '12px', color: tierColors[tier] ?? '#e8dcc8' })
  ql.textContent = `表面评估: ${tierNames[tier] ?? tier}`
  surfacePanel.appendChild(ql)
}

/** Show material scene descriptions at start of check_materials phase */
export function showMaterialScene(state: GameState): void {
  surfacePanel.style.display = 'block'
  surfacePanel.innerHTML = ''

  const label = el('div', { fontSize: '11px', color: '#8b6914', marginBottom: '6px' })
  label.textContent = '【今日材料一览】'
  surfacePanel.appendChild(label)

  const items = [
    { def: MATERIAL_SCENE_STATES.water_bucket, value: state.water },
    { def: MATERIAL_SCENE_STATES.sand_pile, value: state.sand },
    { def: MATERIAL_SCENE_STATES.lime_bag, value: state.lime },
  ]
  for (const item of items) {
    const desc = sceneObjectDescription(item.def, item.value)
    const line = el('div', { color: '#e8dcc8', marginBottom: '4px', fontSize: '13px' })
    line.textContent = desc
    surfacePanel.appendChild(line)
  }

  // Show wall scene state too
  const wallDesc = sceneObjectDescription(WALL_SCENE_STATE, state.wall_quality)
  const wallLine = el('div', { color: '#a09080', marginBottom: '4px', fontSize: '12px', marginTop: '6px' })
  wallLine.textContent = wallDesc
  surfacePanel.appendChild(wallLine)
}

export function hideSurfacePanel(): void {
  surfacePanel.style.display = 'none'
}

// ============================================================
// Settlement overlay — show game end result
// ============================================================

export function showSettlement(result: {
  outcome: string
  summary: string
  wallQuality: number
  inspectionRisk: number
  round: number
}): void {
  settlementOverlay.style.display = 'flex'
  settlementOverlay.innerHTML = ''

  const outcomeNames: Record<string, string> = {
    solid_wall: '墙体稳固', covered_up: '暂时遮掩',
    rework_needed: '需要返工', critical_fail: '关键崩溃',
  }
  const outcomeColors: Record<string, string> = {
    solid_wall: '#4a7c3f', covered_up: '#c4a040',
    rework_needed: '#c45040', critical_fail: '#ff4040',
  }

  const card = el('div', {
    background: '#3a2a1a', padding: '24px 32px', borderRadius: '8px',
    textAlign: 'center', maxWidth: '400px',
  })

  const title = el('div', {
    fontSize: '22px', fontWeight: 'bold', marginBottom: '12px',
    color: outcomeColors[result.outcome] ?? '#e8dcc8',
  })
  title.textContent = outcomeNames[result.outcome] ?? result.outcome
  card.appendChild(title)

  const summary = el('div', { color: '#c4a060', marginBottom: '16px', fontSize: '15px' })
  summary.textContent = result.summary
  card.appendChild(summary)

  const stats = el('div', { color: '#8a7a6a', fontSize: '13px' })
  stats.textContent = `墙面质量: ${result.wallQuality}  |  抽检风险: ${result.inspectionRisk}  |  完成轮数: ${result.round}`
  card.appendChild(stats)

  settlementOverlay.appendChild(card)
}

// ============================================================
// Stir feedback — update stir description in stir panel
// ============================================================

export function updateStirFeedback(stirProgress: number): void {
  const desc = stirFeedback(stirProgress)
  let el = document.getElementById('stir-desc')
  if (!el) {
    const stirPanel = document.getElementById('stir-panel')
    if (!stirPanel) return
    el = document.createElement('div')
    el.id = 'stir-desc'
    el.style.cssText = 'font-size:12px; color:#c4a060; margin-top:6px'
    stirPanel.appendChild(el)
  }
  el.textContent = desc
}

// ============================================================
// Helpers
// ============================================================

function el(tag: string, styles: Partial<CSSStyleDeclaration>): HTMLElement {
  const e = document.createElement(tag)
  Object.assign(e.style, styles)
  return e
}
