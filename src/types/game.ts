export interface GameState {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  turn: number
  isGameOver: boolean
  logs: LogEntry[]
}

export interface LogEntry {
  id: number
  text: string
  type: 'action' | 'event' | 'system' | 'good' | 'bad'
  turn: number
}

export interface RandomEvent {
  id: string
  text: string
  type: 'good' | 'bad' | 'neutral'
  effects: {
    health?: number
    hunger?: number
    thirst?: number
    wood?: number
    stone?: number
  }
}

export type ActionType = 'gatherWood' | 'gatherStone' | 'hunt' | 'drink'

export interface ActionEffect {
  health?: number
  hunger?: number
  thirst?: number
  wood?: number
  stone?: number
}

export interface EffectRange {
  min: number
  max: number
}

export interface ActionEffectRange {
  health?: EffectRange
  hunger?: EffectRange
  thirst?: EffectRange
  wood?: EffectRange
  stone?: EffectRange
}

export type StatKey = 'health' | 'hunger' | 'thirst' | 'wood' | 'stone'

export interface SideEffect {
  stat: StatKey
  description: string
  severity: 'low' | 'medium' | 'high'
  probability: number
}

export interface ActionEstimate {
  type: ActionType
  name: string
  benefits: { stat: StatKey; range: EffectRange; isReverse?: boolean }[]
  costs: { stat: StatKey; range: EffectRange; isReverse?: boolean }[]
  sideEffects: SideEffect[]
}
