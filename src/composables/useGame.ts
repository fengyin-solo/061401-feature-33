import { ref, computed } from 'vue'
import type {
  GameState,
  LogEntry,
  RandomEvent,
  ActionType,
  ActionEffect,
  ActionEffectRange,
  ActionEstimate,
  StatKey,
  SideEffect,
} from '@/types/game'
import { randomEvents } from '@/data/events'

const STORAGE_KEY_HIGH_SCORE = 'survival_game_high_score'
const MAX_STAT = 100

const actionEffectRanges: Record<ActionType, ActionEffectRange> = {
  gatherWood: {
    health: { min: -7, max: -3 },
    hunger: { min: 3, max: 7 },
    thirst: { min: 2, max: 5 },
    wood: { min: 8, max: 14 },
  },
  gatherStone: {
    health: { min: -12, max: -5 },
    hunger: { min: 4, max: 8 },
    thirst: { min: 3, max: 6 },
    stone: { min: 6, max: 12 },
  },
  hunt: {
    health: { min: 10, max: 22 },
    hunger: { min: -28, max: -14 },
    thirst: { min: 3, max: 7 },
    wood: { min: -8, max: -3 },
  },
  drink: {
    hunger: { min: 1, max: 3 },
    thirst: { min: -32, max: -18 },
    wood: { min: -5, max: -2 },
  },
}

const actionSideEffects: Record<ActionType, SideEffect[]> = {
  gatherWood: [
    { stat: 'health', description: '可能被树枝划伤', severity: 'low', probability: 0.15 },
    { stat: 'hunger', description: '体力消耗可能超出预期', severity: 'low', probability: 0.1 },
  ],
  gatherStone: [
    { stat: 'health', description: '可能被落石砸伤', severity: 'medium', probability: 0.2 },
    { stat: 'health', description: '可能扭伤肌肉', severity: 'low', probability: 0.15 },
  ],
  hunt: [
    { stat: 'health', description: '猎物可能反击造成重伤', severity: 'high', probability: 0.2 },
    { stat: 'wood', description: '可能丢失部分箭矢', severity: 'low', probability: 0.25 },
    { stat: 'hunger', description: '可能空手而归', severity: 'medium', probability: 0.15 },
  ],
  drink: [
    { stat: 'health', description: '水可能不干净导致腹泻', severity: 'medium', probability: 0.12 },
    { stat: 'thirst', description: '水源可能不足', severity: 'low', probability: 0.08 },
  ],
}

const actionNames: Record<ActionType, string> = {
  gatherWood: '采集木头',
  gatherStone: '采集石头',
  hunt: '打猎',
  drink: '喝水',
}

const statLabels: Record<StatKey, string> = {
  health: '生命',
  hunger: '饥饿',
  thirst: '口渴',
  wood: '木材',
  stone: '石头',
}

const reverseStats: StatKey[] = ['hunger', 'thirst']

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function rollSideEffects(action: ActionType): ActionEffect {
  const effects: ActionEffect = {}
  const sideEffects = actionSideEffects[action]
  for (const se of sideEffects) {
    if (Math.random() < se.probability) {
      let modifier = 0
      if (se.stat === 'health') {
        modifier = se.severity === 'low' ? -3 : se.severity === 'medium' ? -7 : -15
      } else if (se.stat === 'hunger') {
        modifier = se.severity === 'low' ? 3 : se.severity === 'medium' ? 6 : 10
        if (action === 'hunt') modifier = -modifier
      } else if (se.stat === 'thirst') {
        modifier = se.severity === 'low' ? 3 : se.severity === 'medium' ? 6 : 10
        if (action === 'drink') modifier = -modifier
      } else if (se.stat === 'wood') {
        modifier = se.severity === 'low' ? -2 : se.severity === 'medium' ? -4 : -8
      } else if (se.stat === 'stone') {
        modifier = se.severity === 'low' ? -2 : se.severity === 'medium' ? -4 : -8
      }
      effects[se.stat] = (effects[se.stat] || 0) + modifier
    }
  }
  return effects
}

function rollActionEffects(action: ActionType): ActionEffect {
  const ranges = actionEffectRanges[action]
  const effects: ActionEffect = {}
  const keys: StatKey[] = ['health', 'hunger', 'thirst', 'wood', 'stone']
  for (const key of keys) {
    const range = ranges[key]
    if (range) {
      effects[key] = randomInRange(range.min, range.max)
    }
  }
  const seEffects = rollSideEffects(action)
  for (const key of Object.keys(seEffects) as StatKey[]) {
    effects[key] = (effects[key] || 0) + seEffects[key]
  }
  return effects
}

export function useGame() {
  const state = ref<GameState>({
    health: 80,
    hunger: 30,
    thirst: 30,
    wood: 10,
    stone: 5,
    turn: 0,
    isGameOver: false,
    logs: [],
  })

  const highScore = ref<number>(0)
  let logIdCounter = 0

  const canAct = computed(() => !state.value.isGameOver)

  function loadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE)
      if (saved) {
        highScore.value = parseInt(saved, 10) || 0
      }
    } catch (e) {
      highScore.value = 0
    }
  }

  function saveHighScore() {
    if (state.value.turn > highScore.value) {
      highScore.value = state.value.turn
      try {
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(highScore.value))
      } catch (e) {
        // ignore
      }
    }
  }

  function addLog(text: string, type: LogEntry['type'] = 'action') {
    state.value.logs.unshift({
      id: ++logIdCounter,
      text,
      type,
      turn: state.value.turn,
    })
    if (state.value.logs.length > 50) {
      state.value.logs.pop()
    }
  }

  function clampStat(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  function applyEffects(effects: ActionEffect) {
    if (effects.health !== undefined) {
      state.value.health = clampStat(state.value.health + effects.health, 0, MAX_STAT)
    }
    if (effects.hunger !== undefined) {
      state.value.hunger = clampStat(state.value.hunger + effects.hunger, 0, MAX_STAT)
    }
    if (effects.thirst !== undefined) {
      state.value.thirst = clampStat(state.value.thirst + effects.thirst, 0, MAX_STAT)
    }
    if (effects.wood !== undefined) {
      state.value.wood = Math.max(0, state.value.wood + effects.wood)
    }
    if (effects.stone !== undefined) {
      state.value.stone = Math.max(0, state.value.stone + effects.stone)
    }
  }

  function getRandomEvent(): RandomEvent {
    const index = Math.floor(Math.random() * randomEvents.length)
    return randomEvents[index]
  }

  function checkGameOver() {
    if (state.value.health <= 0 || state.value.hunger >= MAX_STAT || state.value.thirst >= MAX_STAT) {
      state.value.isGameOver = true
      saveHighScore()
      addLog('你没能在荒野中生存下来...', 'system')
    }
  }

  function getActionEstimate(action: ActionType): ActionEstimate {
    const ranges = actionEffectRanges[action]
    const sideEffects = actionSideEffects[action]
    const benefits: ActionEstimate['benefits'] = []
    const costs: ActionEstimate['costs'] = []
    const keys: StatKey[] = ['health', 'hunger', 'thirst', 'wood', 'stone']

    for (const key of keys) {
      const range = ranges[key]
      if (!range) continue
      const isReverse = reverseStats.includes(key)
      if (isReverse) {
        if (range.max < 0) {
          benefits.push({ stat: key, range: { min: -range.max, max: -range.min }, isReverse: true })
        } else if (range.min > 0) {
          costs.push({ stat: key, range, isReverse: true })
        } else {
          if (range.min < 0) {
            benefits.push({ stat: key, range: { min: 0, max: -range.min }, isReverse: true })
          }
          if (range.max > 0) {
            costs.push({ stat: key, range: { min: 0, max: range.max }, isReverse: true })
          }
        }
      } else {
        if (range.min > 0) {
          benefits.push({ stat: key, range })
        } else if (range.max < 0) {
          costs.push({ stat: key, range: { min: -range.max, max: -range.min } })
        } else {
          if (range.max > 0) {
            benefits.push({ stat: key, range: { min: 0, max: range.max } })
          }
          if (range.min < 0) {
            costs.push({ stat: key, range: { min: 0, max: -range.min } })
          }
        }
      }
    }

    return {
      type: action,
      name: actionNames[action],
      benefits,
      costs,
      sideEffects,
    }
  }

  function canPerformAction(action: ActionType): boolean {
    if (state.value.isGameOver) return false
    const ranges = actionEffectRanges[action]
    if (ranges.wood && ranges.wood.min < 0 && state.value.wood + ranges.wood.min < 0) {
      return false
    }
    if (ranges.stone && ranges.stone.min < 0 && state.value.stone + ranges.stone.min < 0) {
      return false
    }
    return true
  }

  function formatEffectValue(key: StatKey, value: number): string {
    const label = statLabels[key]
    const isReverse = reverseStats.includes(key)
    const sign = isReverse ? (value < 0 ? '+' : '-') : (value > 0 ? '+' : '')
    return `${label}${sign}${Math.abs(value)}`
  }

  function performAction(action: ActionType) {
    if (!canPerformAction(action)) return

    const effects = rollActionEffects(action)
    const effectSummary: string[] = []
    const keys: StatKey[] = ['health', 'hunger', 'thirst', 'wood', 'stone']
    for (const key of keys) {
      const v = effects[key]
      if (v !== undefined && v !== 0) {
        effectSummary.push(formatEffectValue(key, v))
      }
    }

    applyEffects(effects)
    state.value.turn++

    addLog(`第 ${state.value.turn} 回合：${actionNames[action]}（${effectSummary.join('，')}）`, 'action')

    const event = getRandomEvent()
    applyEffects(event.effects)

    const eventLogType = event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
    addLog(event.text, eventLogType)

    checkGameOver()
  }

  function gatherWood() {
    performAction('gatherWood')
  }

  function gatherStone() {
    performAction('gatherStone')
  }

  function hunt() {
    performAction('hunt')
  }

  function drink() {
    performAction('drink')
  }

  function restart() {
    state.value = {
      health: 80,
      hunger: 30,
      thirst: 30,
      wood: 10,
      stone: 5,
      turn: 0,
      isGameOver: false,
      logs: [],
    }
    logIdCounter = 0
    addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')
  }

  loadHighScore()
  addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')

  return {
    state,
    highScore,
    canAct,
    canPerformAction,
    getActionEstimate,
    statLabels,
    reverseStats,
    gatherWood,
    gatherStone,
    hunt,
    drink,
    restart,
  }
}
