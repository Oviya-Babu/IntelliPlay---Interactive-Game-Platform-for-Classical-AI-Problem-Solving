import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
}

export function TypewriterText({ text, speed = 25, onComplete }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
        onComplete?.()
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed, onComplete])
  
  // Click to skip typewriter and show full text
  const skip = () => { 
    setDisplayed(text)
    setDone(true)
    onComplete?.()
  }
  
  return (
    <p onClick={skip} style={{ cursor: 'text', lineHeight: 1.8, fontSize: 15, color: 'var(--color-text)' }}>
      {displayed}
      {!done && (
        <span style={{
          display: 'inline-block', width: 2, height: '1em',
          background: 'var(--color-accent, #6c63ff)', marginLeft: 2,
          verticalAlign: 'text-bottom',
          animation: 'blink 0.7s step-end infinite',
        }}/>
      )}
    </p>
  )
}
