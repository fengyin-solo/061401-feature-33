<script setup lang="ts">
import type { ActionEstimate, StatKey } from '@/types/game'

interface ActionButton {
  type: string
  label: string
  icon: string
  action: () => void
  disabled: boolean
  bgClass: string
  hoverClass: string
  estimate: ActionEstimate
}

interface Props {
  canGatherWood: boolean
  canGatherStone: boolean
  canHunt: boolean
  canDrink: boolean
  disabled: boolean
  woodEstimate: ActionEstimate
  stoneEstimate: ActionEstimate
  huntEstimate: ActionEstimate
  drinkEstimate: ActionEstimate
}

const props = defineProps<Props>()

const emit = defineEmits<{
  gatherWood: []
  gatherStone: []
  hunt: []
  drink: []
  hoverAction: [action: 'gatherWood' | 'gatherStone' | 'hunt' | 'drink' | null]
}>()

const statIcons: Record<StatKey, string> = {
  health: '❤️',
  hunger: '🍖',
  thirst: '💧',
  wood: '🪵',
  stone: '🪨',
}

const statColors: Record<StatKey, string> = {
  health: 'text-red-400',
  hunger: 'text-orange-400',
  thirst: 'text-blue-400',
  wood: 'text-amber-500',
  stone: 'text-gray-400',
}

function formatRange(min: number, max: number): string {
  if (min === max) {
    return String(min)
  }
  return `${min}~${max}`
}

const buttons: ActionButton[] = [
  {
    type: 'gatherWood',
    label: '采集木头',
    icon: '🪵',
    action: () => emit('gatherWood'),
    disabled: false,
    bgClass: 'bg-amber-900/40',
    hoverClass: 'hover:bg-amber-800/60',
    get estimate() { return props.woodEstimate },
  },
  {
    type: 'gatherStone',
    label: '采集石头',
    icon: '🪨',
    action: () => emit('gatherStone'),
    disabled: false,
    bgClass: 'bg-gray-700/40',
    hoverClass: 'hover:bg-gray-600/60',
    get estimate() { return props.stoneEstimate },
  },
  {
    type: 'hunt',
    label: '打猎',
    icon: '🏹',
    action: () => emit('hunt'),
    disabled: false,
    bgClass: 'bg-red-900/40',
    hoverClass: 'hover:bg-red-800/60',
    get estimate() { return props.huntEstimate },
  },
  {
    type: 'drink',
    label: '喝水',
    icon: '💧',
    action: () => emit('drink'),
    disabled: false,
    bgClass: 'bg-blue-900/40',
    hoverClass: 'hover:bg-blue-800/60',
    get estimate() { return props.drinkEstimate },
  },
]

function isButtonDisabled(index: number): boolean {
  if (props.disabled) return true
  if (index === 0) return !props.canGatherWood
  if (index === 1) return !props.canGatherStone
  if (index === 2) return !props.canHunt
  return !props.canDrink
}

function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  if (severity === 'low') return 'text-yellow-500'
  if (severity === 'medium') return 'text-orange-500'
  return 'text-red-500'
}
</script>

<template>
  <div class="bg-game-card rounded-2xl p-6 border border-game-border shadow-xl">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span>⚡</span>
      <span>行动</span>
    </h2>
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="(btn, index) in buttons"
        :key="btn.type"
        @click="btn.action"
        @mouseenter="emit('hoverAction', btn.type as 'gatherWood' | 'gatherStone' | 'hunt' | 'drink')"
        @mouseleave="emit('hoverAction', null)"
        :disabled="isButtonDisabled(index)"
        :class="[
          btn.bgClass,
          'relative p-4 rounded-xl border border-game-border transition-all duration-200',
          'flex flex-col items-start gap-2 text-left',
          isButtonDisabled(index)
            ? 'opacity-40 cursor-not-allowed'
            : [btn.hoverClass, 'hover:scale-[1.02] hover:shadow-lg cursor-pointer active:scale-[0.98]'],
      >
        <div class="flex items-center justify-between w-full">
          <span class="text-3xl">{{ btn.icon }}</span>
          <span class="text-white font-semibold text-sm">{{ btn.label }}</span>
        </div>

        <div v-if="btn.estimate.benefits.length > 0" class="w-full">
          <div class="text-[10px] text-green-400/80 mb-1 font-medium">收益</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="b in btn.estimate.benefits"
              :key="b.stat"
              :class="[statColors[b.stat], 'inline-flex items-center gap-0.5 text-[10px] bg-green-900/40 px-1.5 py-0.5 rounded']>
              <span>{{ statIcons[b.stat] }}</span>
              <span>+{{ formatRange(b.range.min, b.range.max) }}</span>
            </span>
          </div>
        </div>

        <div v-if="btn.estimate.costs.length > 0" class="w-full">
          <div class="text-[10px] text-red-400/80 mb-1 font-medium">代价</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="c in btn.estimate.costs"
              :key="c.stat"
              :class="[statColors[c.stat], 'inline-flex items-center gap-0.5 text-[10px] bg-red-900/40 px-1.5 py-0.5 rounded']>
              <span>{{ statIcons[c.stat] }}</span>
              <span>-{{ formatRange(c.range.min, c.range.max) }}</span>
            </span>
          </div>
        </div>

        <div v-if="btn.estimate.sideEffects.length > 0" class="w-full mt-0.5">
          <div
            v-for="se in btn.estimate.sideEffects"
            :key="se.description"
            class="flex items-start gap-1 text-[10px]">
            <span :class="getSeverityColor(se.severity)">⚠</span>
            <span class="text-gray-400 truncate">{{ se.description }}</span>
            <span class="text-gray-500">({{ Math.round(se.probability * 100) }}%)</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
