import Image from 'next/image'
import { theme } from '../lib/styles'

const CLASS_MAP = {
  'Assassin':    '/icons/Assassin.png',
  'Paladin':     '/icons/Paladin.png',
  'Priest':      '/icons/Priest.png',
  'Doram':       '/icons/Doram.png',
  'Bard':        '/icons/Bard.png',
  'Mastersmith': '/icons/Mastersmith.png',
  'Sniper':      '/icons/Sniper.png',
  'Alchemist':   '/icons/Alchemist.png',
  'Wizard':      '/icons/wizard.png',
  'Gypsy':       '/icons/Gypsy.png',
  'Professor':   '/icons/Professor.png',
  'Lord Knight': '/icons/Lord_Knight.png',
  'Stalker':     '/icons/Stalker.png',
  'Champion':    '/icons/Champion.png',
}

export default function ClassIcon({ className, size = 28 }) {
  const src = CLASS_MAP[className]

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: theme.bgSurf,
      border: `0.5px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {src ? (
        <Image src={src} alt={className} width={size} height={size} style={{ objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: size * 0.45, color: theme.textM }}>?</span>
      )}
    </div>
  )
}
