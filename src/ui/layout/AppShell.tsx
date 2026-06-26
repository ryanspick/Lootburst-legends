import type { ReactNode } from 'react'

interface Props { children: ReactNode }

export default function AppShell({ children }: Props) {
  return (
    <div className="app-shell" style={{ position: 'relative', overflow: 'hidden' }}>
      {children}
    </div>
  )
}
