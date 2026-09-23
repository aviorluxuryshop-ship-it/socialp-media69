import { useEffect, useRef, useState } from 'react'

/** Fades a section's copy in/out as it enters/leaves the viewport — independent of the 3D scroll timeline. */
export function useReveal<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold,
      rootMargin: '-10% 0px -10% 0px',
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}
