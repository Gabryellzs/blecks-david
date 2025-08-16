import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Original functions - Restored
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return "Bom dia"
  } else if (hour >= 12 && hour < 18) {
    return "Boa tarde"
  } else {
    return "Boa noite"
  }
}

export function getFirstName(fullName: string): string {
  return fullName.split(" ")[0]
}

// Helper function to format values as currency with 2 decimal places
export const formatCurrency = (value: number): string => {
  const formattedNumber = value
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `R$ ${formattedNumber}`
}

// Achievement thresholds and data calculation
export const ACHIEVEMENT_THRESHOLDS = [
  { value: 0, label: "Início" },
  { value: 10_000, label: "R$ 10 Mil Líquidos" },
  { value: 100_000, label: "R$ 100 Mil Líquidos" },
  { value: 500_000, label: "R$ 500 Mil Líquidos" },
  { value: 1_000_000, label: "R$ 1 Milhão Líquidos" },
]

export interface AchievementData {
  currentProgress: number
  segmentStart: number
  segmentEnd: number
  percentage: number
  goalText: string
  isMaxGoalReached: boolean
}

export function getAchievementData(totalNetSales: number): AchievementData {
  let segmentStart = 0
  let segmentEnd = 0
  let goalText = ""
  let isMaxGoalReached = false

  for (let i = 0; i < ACHIEVEMENT_THRESHOLDS.length; i++) {
    if (totalNetSales < ACHIEVEMENT_THRESHOLDS[i].value) {
      segmentStart = ACHIEVEMENT_THRESHOLDS[i - 1]?.value || 0
      segmentEnd = ACHIEVEMENT_THRESHOLDS[i].value
      goalText = ACHIEVEMENT_THRESHOLDS[i].label
      break
    } else if (i === ACHIEVEMENT_THRESHOLDS.length - 1) {
      segmentStart = ACHIEVEMENT_THRESHOLDS[i].value
      segmentEnd = ACHIEVEMENT_THRESHOLDS[i].value
      goalText = "Parabéns! R$ 1 Milhão Líquidos Atingido!"
      isMaxGoalReached = true
      break
    }
  }

  if (totalNetSales < ACHIEVEMENT_THRESHOLDS[1].value && !isMaxGoalReached) {
    segmentStart = 0
    segmentEnd = ACHIEVEMENT_THRESHOLDS[1].value
    goalText = ACHIEVEMENT_THRESHOLDS[1].label
  }

  const segmentRange = segmentEnd - segmentStart
  const currentProgressInSegment = totalNetSales - segmentStart

  let percentage = 0
  if (isMaxGoalReached) {
    percentage = 100
  } else if (segmentRange > 0) {
    percentage = (currentProgressInSegment / segmentRange) * 100
  }

  return {
    currentProgress: totalNetSales,
    segmentStart: segmentStart,
    segmentEnd: segmentEnd,
    percentage: Math.min(100, Math.max(0, percentage)),
    goalText: goalText,
    isMaxGoalReached: isMaxGoalReached,
  }
}
