'use client'

import { usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface MenuContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const MenuContext = createContext<MenuContextValue | null>(null)

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((value) => !value), [])

  // Any navigation closes the overlay. Adjusting state during render is
  // React's own pattern for reacting to a changed value, and it closes the
  // menu in the same commit as the navigation rather than a frame later.
  const [renderedPathname, setRenderedPathname] = useState(pathname)
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname)
    if (isOpen) setIsOpen(false)
  }

  // Escape closes it too, and the page underneath must not scroll.
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const value = useMemo<MenuContextValue>(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  )

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenu(): MenuContextValue {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used inside <MenuProvider>')
  }
  return context
}
