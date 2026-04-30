/**
 * 灰浆配比 — 主循环入口
 *
 * 核心循环: 查看今日材料 -> 调配灰浆 -> 搅拌 -> 涂抹墙段 -> 观察表面反馈 -> 抽检或下一墙段
 * 场景对象: 搅拌槽(配比+搅拌)、待涂墙段(涂抹+观察)、材料堆(查看)
 */

import {
  type GameState,
  createInitialState,
  advancePhase,
  applyToWall,
  consumeMaterials,
  isGameOver,
  settleRound,
  performApplyCycle,
} from './game/state.js'
import { bindSliders, bindStirButton, updateUI } from './game/interaction.js'
import { pickEvent, applyEffects, type EventChoice } from './content/eventPool.js'
import {
  initGameUI,
  updatePressureDisplay,
  updatePhasePipeline,
  showEvent,
  hideEvent,
  showSurfaceFeedback,
  showMaterialScene,
  hideSurfacePanel,
  showSettlement,
  updateStirFeedback,
} from './ui/gameUI.js'

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const W = canvas.width
const H = canvas.height

let state: GameState
let animFrame = 0
let waitingForEvent = false

// ─── 初始化 ────────────────────────────────────

function init(): void {
  state = createInitialState()
  initGameUI()
  bindSliders(state, () => render())
  bindStirButton(state, () => { render(); updateStirFeedback(state.stirProgress) })
  bindActionButtons()
  bindSliderLabels()
  updatePhaseUI()
  updateUI(state)
  render()
  requestAnimationFrame(loop)
}

function loop(): void {
  animFrame++
  render()
  if (isGameOver(state)) { handleGameOver(); return }
  requestAnimationFrame(loop)
}

// ─── 主循环按钮 ────────────────────────────────

function bindActionButtons(): void {
  document.getElementById('btn-action')?.addEventListener('click', () => {
    if (isGameOver(state) || waitingForEvent) return
    handlePhaseAction()
  })
}

function handlePhaseAction(): void {
  switch (state.phase) {
    case 'check_materials':
      showMaterialScene(state)
      triggerPhaseEvent('check_materials', () => {
        advancePhase(state)
        updatePhaseUI()
      })
      break
    case 'mix_ratio':
      hideSurfacePanel()
      advancePhase(state)
      updatePhaseUI()
      break
    case 'stir':
      if (state.stirProgress < 0.2) return
      triggerPhaseEvent('stir', () => {
        advancePhase(state)
        updatePhaseUI()
      })
      break
    case 'apply':
      performApplyCycle(state)
      advancePhase(state)
      updatePhaseUI()
      break
    case 'observe':
      showSurfaceFeedback(state.currentWallQuality)
      advancePhase(state)
      updatePhaseUI()
      break
    case 'inspect':
      hideSurfacePanel()
      triggerPhaseEvent('inspect', () => {
        advancePhase(state)
        updatePhaseUI()
      })
      break
  }
  updateUI(state)
  render()
}

function triggerPhaseEvent(stage: string, onDone: () => void): void {
  const event = pickEvent(stage as any, state)
  if (event) {
    waitingForEvent = true
    showEvent(event, (choice: EventChoice) => {
      applyEffects(state, choice.stateEffect)
      waitingForEvent = false
      updateUI(state)
      render()
      setTimeout(onDone, 800)
    })
  } else {
    onDone()
  }
}

function bindSliderLabels(): void {
  for (const key of ['water', 'sand', 'lime']) {
    const slider = document.getElementById(`slider-${key}`) as HTMLInputElement
    const label = document.getElementById(`val-${key}`)
    if (slider && label) {
      slider.addEventListener('input', () => { label.textContent = slider.value })
    }
  }
}

const ACTION_LABELS: Record<string, string> = {
  check_materials: '查看材料',
  mix_ratio: '确认配比',
  stir: '搅拌完成',
  apply: '涂抹墙段',
  observe: '观察表面',
  inspect: '抽检 / 下一墙段',
}

function updatePhaseUI(): void {
  const btn = document.getElementById('btn-action')
  if (btn) btn.textContent = ACTION_LABELS[state.phase] ?? '继续'

  const sliderPanel = document.getElementById('slider-panel')
  const stirPanel = document.getElementById('stir-panel')
  if (sliderPanel) sliderPanel.style.display = state.phase === 'mix_ratio' ? 'block' : 'none'
  if (stirPanel) stirPanel.style.display = state.phase === 'stir' ? 'block' : 'none'

  updatePressureDisplay(state)
  updatePhasePipeline(state.phase)
}

function handleGameOver(): void {
  const result = settleRound(state)
  showSettlement(result)
  renderGameOver()
}

// ─── 渲染 ──────────────────────────────────────

function render(): void {
  ctx.clearRect(0, 0, W, H)
  drawBackground()
  drawTrough()
  drawWall()
  updateUI(state)
  updatePressureDisplay(state)
}

function drawBackground(): void {
  // 工地
  ctx.fillStyle = '#d4c5a9'
  ctx.fillRect(0, 0, W, H)
  // 地面
  ctx.fillStyle = '#8b7355'
  ctx.fillRect(0, H * 0.78, W, H * 0.22)
  // 天空
  ctx.fillStyle = '#b8c9d9'
  ctx.fillRect(0, 0, W, H * 0.08)
}

// ─── 搅拌槽 ────────────────────────────────────

function drawTrough(): void {
  const tx = 30, ty = 60, tw = 300, th = 200

  // 槽体 (梯形)
  ctx.beginPath()
  ctx.moveTo(tx, ty)
  ctx.lineTo(tx + tw, ty)
  ctx.lineTo(tx + tw - 20, ty + th)
  ctx.lineTo(tx + 20, ty + th)
  ctx.closePath()
  ctx.strokeStyle = '#5c4033'
  ctx.lineWidth = 3
  ctx.stroke()

  // 灰浆填充
  const total = state.mixWater + state.mixSand + state.mixLime
  if (total > 0) {
    const wR = state.mixWater / total
    const sR = state.mixSand / total
    const lR = state.mixLime / total

    // 颜色随配比变化
    const r = Math.round(200 + lR * 55 - sR * 80)
    const g = Math.round(190 + lR * 30 - sR * 20)
    const b = Math.round(150 - sR * 30)
    ctx.fillStyle = `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`

    const fillH = th * 0.3 + th * 0.5 * Math.min(1, total / 30)
    ctx.beginPath()
    ctx.moveTo(tx + 5, ty + th - fillH)
    ctx.lineTo(tx + tw - 5, ty + th - fillH)
    ctx.lineTo(tx + tw - 22, ty + th - 5)
    ctx.lineTo(tx + 22, ty + th - 5)
    ctx.closePath()
    ctx.fill()

    // 搅拌漩涡动画
    if (state.stirProgress > 0.1) {
      const swirls = Math.floor(state.stirProgress * 6)
      for (let i = 0; i < swirls; i++) {
        const angle = animFrame * 0.05 + i * Math.PI * 2 / swirls
        const cx = tx + tw / 2 + Math.cos(angle) * 50
        const cy = ty + th - fillH / 2 + Math.sin(angle) * 25
        ctx.beginPath()
        ctx.arc(cx, cy, 8, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255,255,255,${state.stirProgress * 0.3})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    // 未搅匀的颗粒
    if (state.stirProgress < 0.5) {
      const chunks = Math.floor((1 - state.stirProgress) * 10)
      for (let i = 0; i < chunks; i++) {
        const cx = tx + 30 + seededRand(i * 3) * (tw - 60)
        const cy = ty + th - fillH + seededRand(i * 3 + 1) * fillH * 0.8
        ctx.beginPath()
        ctx.arc(cx, cy, 3 + seededRand(i * 3 + 2) * 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139,115,85,${0.3 + seededRand(i) * 0.3})`
        ctx.fill()
      }
    }
  }

  // 稠度条
  const bx = tx, by = ty + th + 16, bw = tw, bh = 12
  ctx.fillStyle = '#5c4033'
  ctx.fillRect(bx, by, bw, bh)
  ctx.fillStyle = state.stirProgress >= 0.8 ? '#4a7c3f' : '#c4a040'
  ctx.fillRect(bx + 2, by + 2, (bw - 4) * state.stirProgress, bh - 4)
  ctx.fillStyle = '#3a2a1a'
  ctx.font = '11px sans-serif'
  ctx.fillText(`稠度 ${Math.round(state.stirProgress * 100)}%`, bx, by - 3)

  // 标签
  ctx.fillStyle = '#3a2a1a'
  ctx.font = '14px sans-serif'
  ctx.fillText('搅拌槽', tx + tw / 2 - 24, ty + th + 42)
}

// ─── 墙段 ──────────────────────────────────────

function drawWall(): void {
  const wx = 380, wy = 30, ww = 390, wh = 330

  // 砖墙底色
  ctx.fillStyle = '#b8860b'
  ctx.fillRect(wx, wy, ww, wh)

  // 砖块图案
  const brickH = 18, brickW = 36, gap = 2
  for (let row = 0; row * (brickH + gap) < wh; row++) {
    const offsetX = (row % 2) * brickW / 2
    for (let col = -1; col * (brickW + gap) < ww + brickW; col++) {
      const bx = wx + col * (brickW + gap) + offsetX
      const by = wy + row * (brickH + gap)
      ctx.fillStyle = '#c4722a'
      ctx.fillRect(bx, by, brickW, brickH)
      ctx.strokeStyle = '#8b5a2b'
      ctx.lineWidth = 0.5
      ctx.strokeRect(bx, by, brickW, brickH)
    }
  }

  // 灰浆覆盖层 (涂抹后显示)
  const showOverlay = state.currentWallQuality > 0
    && ['apply', 'observe', 'inspect', 'check_materials'].includes(state.phase)
  if (showOverlay) drawMortarOverlay(wx, wy, ww, wh)

  // 标签
  ctx.fillStyle = '#3a2a1a'
  ctx.font = '14px sans-serif'
  ctx.fillText('待涂墙段', wx + ww / 2 - 28, wy + wh + 20)
}

function drawMortarOverlay(wx: number, wy: number, ww: number, wh: number): void {
  const q = state.currentWallQuality

  // 基础灰浆色
  const brightness = 180 + q * 0.5
  ctx.fillStyle = `rgba(${clamp(brightness)},${clamp(brightness - 10)},${clamp(brightness - 30)},0.85)`
  ctx.fillRect(wx, wy, ww, wh)

  // 低质量裂缝
  if (q < 70) {
    const count = Math.floor((70 - q) / 8)
    ctx.strokeStyle = `rgba(80,60,40,${0.3 + (70 - q) / 100})`
    ctx.lineWidth = 1.5
    for (let i = 0; i < count; i++) {
      const sx = wx + 30 + seededRand(i * 7) * (ww - 60)
      const sy = wy + wh * 0.2
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + (seededRand(i * 7 + 1) - 0.5) * 40, sy + 40 + seededRand(i * 7 + 2) * 40)
      ctx.lineTo(sx + (seededRand(i * 7 + 3) - 0.5) * 30, sy + 100 + seededRand(i * 7 + 4) * 60)
      ctx.stroke()
    }
  }

  // 高质量光泽
  if (q >= 70) {
    ctx.fillStyle = `rgba(255,255,240,${(q - 70) / 150})`
    ctx.fillRect(wx + 5, wy + 5, ww - 10, wh - 10)
  }

  // 表面反馈文字
  const labels = ['大面积开裂脱落', '明显裂纹', '可见纹理，微裂纹', '整体平整，微纹理', '表面平整如镜']
  const idx = q >= 90 ? 4 : q >= 70 ? 3 : q >= 50 ? 2 : q >= 25 ? 1 : 0
  ctx.fillStyle = '#2a1a0a'
  ctx.font = '13px sans-serif'
  ctx.fillText(labels[idx], wx + 10, wy + wh - 10)
}

// ─── 游戏结束 ──────────────────────────────────

function renderGameOver(): void {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fff'
  ctx.font = '28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    state.inspection_risk >= 100 ? '抽检不合格 — 返工' : '材料耗尽 — 停工',
    W / 2, H / 2 - 10,
  )
  ctx.font = '16px sans-serif'
  ctx.fillText(`最终墙面质量: ${state.wall_quality}  |  完成轮数: ${state.round}`, W / 2, H / 2 + 30)
  ctx.textAlign = 'left'
}

// ─── 工具 ──────────────────────────────────────

function clamp(v: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, Math.round(v)))
}

/** 简易确定性随机，避免每帧闪烁 */
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// ─── 启动 ──────────────────────────────────────
init()
