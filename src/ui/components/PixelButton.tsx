import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { Rarity } from '@/constants/palette'
import { playSound } from '@/audio/soundEvents'
import styles from './PixelButton.module.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  rarity?: Rarity
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function PixelButton({
  children, variant = 'secondary', rarity, pulse, size = 'md',
  onClick, className, ...rest
}: Props) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    playSound('ui_button_pop')
    onClick?.(e)
  }

  return (
    <button
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        pulse ? styles.pulse : '',
        className ?? '',
      ].join(' ')}
      data-rarity={rarity}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  )
}
