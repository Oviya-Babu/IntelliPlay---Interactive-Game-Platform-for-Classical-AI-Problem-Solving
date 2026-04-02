import { motion } from 'framer-motion'
import { SVGProps } from 'react'

interface StarRatingProps extends SVGProps<SVGSVGElement> {
  stars: 0 | 1 | 2 | 3
  animated?: boolean
}

export default function StarRating({ stars, animated = false, className = '', ...props }: StarRatingProps) {
  const renderStar = (index: number) => {
    const isFilled = index < stars
    
    return (
      <svg
        key={index}
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isFilled ? "var(--gold, #f59e0b)" : "rgba(255,255,255,0.06)"}
        strokeWidth="2"
        className={className}
        {...props}
      >
        <motion.polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill={isFilled ? "var(--gold, #f59e0b)" : "none"}
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated && isFilled ? { pathLength: 1, opacity: 1 } : false}
          transition={{ duration: 0.5, delay: animated ? index * 0.3 : 0 }}
        />
      </svg>
    )
  }

  return (
    <div className="flex gap-2">
      {renderStar(0)}
      {renderStar(1)}
      {renderStar(2)}
    </div>
  )
}
