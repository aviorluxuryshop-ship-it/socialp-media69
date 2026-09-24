'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface MenuState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const MenuContext = createContext<MenuState | null>(null)

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((value) => !value), [])
  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle])
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenu() {
  const value = useContext(MenuContext)
  if (!value) throw new Error('useMenu must be used inside <MenuProvider>')
  return value
}
