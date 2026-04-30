/**
 * 灰浆配比 — 场景交互处理
 *
 * Primary Input: 调节水/砂/灰比例滑杆并按住搅拌到目标稠度
 * Minimum Interaction: 玩家必须手动调整至少两个材料比例，再控制搅拌时间
 */

import type { GameState } from './state.js'
import { setMixRatio, updateStirProgress } from './state.js'

/** 绑定三个材料比例滑杆到 state */
export function bindSliders(state: GameState, onChange: () => void): void {
  const keys = ['water', 'sand', 'lime'] as const
  for (const key of keys) {
    const el = document.getElementById(`slider-${key}`) as HTMLInputElement | null
    if (!el) continue
    el.addEventListener('input', () => {
      const w = (document.getElementById('slider-water') as HTMLInputElement).value
      const s = (document.getElementById('slider-sand') as HTMLInputElement).value
      const l = (document.getElementById('slider-lime') as HTMLInputElement).value
      setMixRatio(state, Number(w), Number(s), Number(l))
      onChange()
    })
  }
}

/** 绑定按住搅拌按钮 */
export function bindStirButton(
  state: GameState, onStirUpdate: () => void,
): { stop: () => void } {
  const btn = document.getElementById('btn-stir')
  if (!btn) return { stop() {} }

  let interval: ReturnType<typeof setInterval> | null = null

  const startStir = () => {
    if (interval) return
    interval = setInterval(() => {
      updateStirProgress(state, 0.1)
      onStirUpdate()
    }, 100)
    btn.classList.add('active')
  }

  const stopStir = () => {
    if (interval) { clearInterval(interval); interval = null }
    btn.classList.remove('active')
  }

  btn.addEventListener('mousedown', startStir)
  btn.addEventListener('mouseup', stopStir)
  btn.addEventListener('mouseleave', stopStir)
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); startStir() })
  btn.addEventListener('touchend', stopStir)

  return { stop: stopStir }
}

/** 同步 DOM 状态到 UI 元素 */
export function updateUI(state: GameState): void {
  // 材料条
  setBar('bar-water', state.water)
  setBar('bar-sand', state.sand)
  setBar('bar-lime', state.lime)

  // 稠度条
  const meter = document.getElementById('consistency-meter')
  if (meter) meter.style.width = `${state.stirProgress * 100}%`

  // 阶段标签
  const names: Record<string, string> = {
    check_materials: '查看材料',
    mix_ratio: '调配灰浆',
    stir: '搅拌灰浆',
    apply: '涂抹墙段',
    observe: '观察表面',
    inspect: '抽检',
  }
  setText('phase-label', names[state.phase] ?? state.phase)
  setText('round-label', `第 ${state.round} 轮`)
  setText('quality-label', `墙面质量: ${state.wall_quality}`)

  // 抽检风险条
  const riskBar = document.getElementById('risk-meter')
  if (riskBar) riskBar.style.width = `${state.inspection_risk}%`
}

function setBar(id: string, value: number): void {
  const el = document.getElementById(id)
  if (el) el.style.width = `${Math.max(0, value)}%`
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}
