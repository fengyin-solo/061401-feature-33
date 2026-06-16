<script setup lang="ts">
import { computed } from 'vue'
import type { ActionEstimate, StatKey } from '@/types/game'

interface StatItem {
  label: string
  value: number
  max: number
  icon: string
  color: string
  barColor: string
  isReverse?: boolean
  key: StatKey
}

interface Props {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  hoveredEstimate?: ActionEstimate | null
}

const props = withDefaults(defineProps<Props>(), {
  hoveredEstimate: null,
})

const stats = computed<StatItem[]>(() => [
  {
    label: '生命值',
    value: props.health,
    max: 100,
    icon: '❤️',
    color: 'text-red-400',
    barColor: 'bg-red-500',
    key: 'health',
  },
  {
    label: '饥饿值',
    value: props.hunger,
    max: 100,
    icon: '🍖',
    color: 'text-orange-400',
    barColor: 'bg-orange-500',
    isReverse: true,
    key: 'hunger',
  },
  {
    label: '口渴值',
    value: props.thirst,
    max: 100,
    icon: '💧',
    color: 'text-blue-400',
    barColor: 'bg-blue-500',
    isReverse: true,
    key: 'thirst',
  },
  {
    label: '木材',
    value: props.wood,
    max: 100,
    icon: '🪵',
    color: 'text-amber-600',
    barColor: 'bg-amber-600',
    key: 'wood',
  },
  {
    label: '石头',
    value: props.stone,
    max: 100,
    icon: '🪨',
    color: 'text-gray-400',
    barColor: 'bg-gray-400',
    key: 'stone',
  },
])

function getBarWidth(value: number, max: number): string {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return `${percent}%`
}

function isDanger(value: number, max: number, isReverse?: boolean): boolean {
  const percent = (value / max) * 100
  if (isReverse) {
    return percent >= 80
  }
  return percent <= 20
}

function getEstimateForStat(key: StatKey): { min: number; max: number } | null {
  if (!props.hoveredEstimate) return null
  const isReverse = key === 'hunger' || key === 'thirst'
  const benefit = props.hoveredEstimate.benefits.find(b => b.stat === key)
  const cost = props.hoveredEstimate.costs.find(c => c.stat === key)

  let minDelta = 0
  let maxDelta = 0

  if (benefit) {
    if (isReverse) {
      minDelta -= benefit.range.max
      maxDelta -= benefit.range.min
    } else {
      minDelta += benefit.range.min
      maxDelta += benefit.range.max
    }
  }
  if (cost) {
    if (isReverse) {
      minDelta += cost.range.min
      maxDelta += cost.range.max
    } else {
      minDelta -= cost.range.max
      maxDelta -= cost.range.min
    }
  }

  if (minDelta === 0 && maxDelta === 0) return null
  return { min: minDelta, max: maxDelta }
}

function formatDelta(min: number, max: number, isReverse?: boolean): string {
  const sign = (val: number) => {
    if (isReverse) {
      return val < 0 ? '+' : val > 0 ? '-' : ''
    }
    return val > 0 ? '+' : val < 0 ? '-' : ''
  }
  if (min === max) {
    return `${sign(min)}${Math.abs(min)}`
  }
  if (sign(min) === sign(max)) {
    return `${sign(min)}${Math.abs(min)}~${Math.abs(max)}`
  }
  return `${sign(min)}${Math.abs(min)} ~ ${sign(max)}${Math.abs(max)}`
}

function getDeltaColor(min: number, max: number, isReverse?: boolean): string {
  if (isReverse) {
    if (max < 0) return 'text-green-400'
    if (min > 0) return 'text-red-400'
  } else {
    if (min > 0) return 'text-green-400'
    if (max < 0) return 'text-red-400'
  }
  return 'text-yellow-400'
}
</script>

<template>
  <div class="bg-game-card rounded-2xl p-6 border border-game-border shadow-xl">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span>📊</span>
      <span>生存状态</span>
      <span v-if="hoveredEstimate" class="ml-auto text-sm font-normal text-gray-400">
        预估: {{ hoveredEstimate.name }}
      </span>
    </h2>
    <div class="space-y-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="group"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ stat.icon }}</span>
            <span :class="[stat.color, 'font-medium text-sm']">{{ stat.label }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="getEstimateForStat(stat.key)"
              :class="[
                getDeltaColor(
                  getEstimateForStat(stat.key)!.min,
                  getEstimateForStat(stat.key)!.max,
                  stat.isReverse,
                ),
                'font-medium text-xs tabular-nums',
              ]">
              {{ formatDelta(getEstimateForStat(stat.key)!.min, getEstimateForStat(stat.key)!.max, stat.isReverse) }}
            </span>
            <span
              :class="[
                stat.color,
                'font-bold text-sm tabular-nums',
                isDanger(stat.value, stat.max, stat.isReverse) ? 'animate-pulse-soft' : '',
              ]">
              {{ Math.round(stat.value) }}
            </span>
          </div>
        </div>
        <div class="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            :class="[stat.barColor, 'h-full rounded-full transition-all duration-300 ease-out']"
            :style="{ width: getBarWidth(stat.value, stat.max) }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
