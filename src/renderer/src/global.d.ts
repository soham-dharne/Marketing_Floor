import type { JSX as ReactJSX } from 'react'

// @types/react 19 stopped putting a global `JSX` namespace in scope (it now
// lives at `React.JSX`), which breaks the classic `): JSX.Element` return
// type used throughout this codebase. Restore just enough of the global
// namespace to keep that convention working everywhere.
declare global {
  namespace JSX {
    type Element = ReactJSX.Element
  }
}

export {}
