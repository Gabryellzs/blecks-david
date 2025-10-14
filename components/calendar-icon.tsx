import type React from "react"
import Image from "next/image"

interface CalendarIconProps {
  className?: string
}

const CalendarIcon: React.FC<CalendarIconProps> = ({ className = "h-6 w-6" }) => {
  return (
    <div className={className}>
      <Image
        src="/calendar-icon.png"
        alt="Calendar icon"
        width={24}
        height={24}
        className="w-full h-full object-contain filter brightness-0 invert"
      />
    </div>
  )
}

export default CalendarIcon
