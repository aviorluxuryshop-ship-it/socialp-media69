import { Component, type ReactNode } from 'react'
import { StaticFallback } from './StaticFallback'

type Props = { children: ReactNode }
type State = { failed: boolean }

/**
 * A WebGL/driver hiccup inside the R3F tree throws a plain JS error, and
 * without a boundary here React unmounts the whole app up to the nearest
 * one — which, with none, means the entire site goes blank. This contains
 * that to the 3D layer and swaps in the same static fallback used for
 * browsers without WebGL at all.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('3D deneyimi yüklenemedi, statik görünüme düşüldü:', error)
  }

  render() {
    if (this.state.failed) return <StaticFallback />
    return this.props.children
  }
}
