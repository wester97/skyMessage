'use client'

import { ButtonGroup, Button } from 'react-bootstrap'

interface StyleModeSelectorProps {
  mode: 'normal' | 'saint' | 'emoji-story'
  onModeChange: (mode: 'normal' | 'saint' | 'emoji-story') => void
  disabled?: boolean
}

export default function StyleModeSelector({ mode, onModeChange, disabled = false }: StyleModeSelectorProps) {
  const modes = [
    { value: 'normal' as const, label: 'Normal', icon: '💬' },
    { value: 'saint' as const, label: 'Ask a Saint', icon: '✝️' },
    { value: 'emoji-story' as const, label: 'Emoji Story', icon: '📖' },
  ]

  return (
    <ButtonGroup className="w-100">
      {modes.map((m) => (
        <Button
          key={m.value}
          variant={mode === m.value ? 'primary' : 'outline-primary'}
          onClick={() => onModeChange(m.value)}
          disabled={disabled}
        >
          <span className="me-2" aria-hidden="true">{m.icon}</span>
          {m.label}
        </Button>
      ))}
    </ButtonGroup>
  )
}

