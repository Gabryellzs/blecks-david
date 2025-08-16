"use client"

import { Progress } from "@/components/ui/progress"
import { formatCurrency, type AchievementData } from "@/lib/utils"

interface AchievementProgressHeaderProps {
  achievementData: AchievementData
}

export function AchievementProgressHeader({ achievementData }: AchievementProgressHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center text-sm text-white">
      <div className="text-sm text-muted-foreground mb-1">
        {achievementData.isMaxGoalReached ? (
          <span className="text-green-500 font-medium">{achievementData.goalText}</span>
        ) : (
          <>
            {formatCurrency(achievementData.currentProgress)} / {formatCurrency(achievementData.segmentEnd)}
          </>
        )}
      </div>
      <Progress value={achievementData.percentage} className="w-32 h-2 bg-gray-700 [&>*]:bg-yellow-500" />
    </div>
  )
}
