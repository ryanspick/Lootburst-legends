// 12×12 gear icon templates (48×48 canvas)
export type GearTemplateKey = 'weapon'|'armor'|'charm'|'boots'|'relic'|'toy'

export const GEAR_TEMPLATES: Record<GearTemplateKey, string[]> = {
  weapon: [
    '.....KK.....',
    '....KPPK....',
    '....KPPK....',
    '....KPPK....',
    '...KPPPPK...',
    '..KPPPPPPK..',
    '.KPPPPPPPPK.',
    '..KPPPPPPK..',
    '...KPPPPK...',
    '.KKK....KKK.',
    'KAAAK..KAAAK',
    '.KKK....KKK.',
  ],
  armor: [
    '............',
    '...KKKKKK...',
    '..KBBBBBBK..',
    '.KBBBBBBBBK.',
    '.KBAABBBABK.',
    '.KBBBBBBBBK.',
    '.KBBBBBBBBK.',
    '.KBBBBBBBBK.',
    '..KBBBBBBK..',
    '..KBK..KBK..',
    '..KBK..KBK..',
    '..KKK..KKK..',
  ],
  charm: [
    '....KKKK....',
    '...KAAAAK...',
    '..KAAGGAAK..',
    '.KAAGBBGAAK.',
    '.KAAGBBGAAK.',
    '..KAAGGAAK..',
    '...KAAAAK...',
    '....KPPK....',
    '....KPPK....',
    '...KPPPPK...',
    '....KPPK....',
    '............',
  ],
  boots: [
    '............',
    '............',
    '...KKKK.....',
    '..KBBBBK....',
    '.KBBBBBBK...',
    'KBBBBBBBBK..',
    '.KBBBBBBK...',
    '..KBBBBBBBK.',
    '..KBBBBBBBK.',
    '..KBBBBBBBK.',
    '..KAAAAAAK..',
    '..KKKKKKKK..',
  ],
  relic: [
    '....KKKK....',
    '...KPPPPK...',
    '..KPPBBPPK..',
    '.KPPBBBBBPK.',
    '.KPBBXXXBBPK',
    '.KPBBXXXBBPK',
    '.KPBBXXXBBPK',
    '.KPPBBBBBPK.',
    '..KPPBBPPK..',
    '...KPPPPK...',
    '....KKKK....',
    '....GGGG....',
  ],
  toy: [
    '....KKKK....',
    '...KBBBBK...',
    '..KBBBBBBK..',
    '..KBAABBAK..',
    '..KBBBBBBK..',
    '..KBBBBBBK..',
    '..KPPPPPPPK.',
    '...KPPPPPK..',
    '....KPPPK...',
    '.....KPK....',
    '....KPPPK...',
    '....KPPPK...',
  ],
}

export function slotToGearTemplate(slot: string): GearTemplateKey {
  switch (slot) {
    case 'weapon': return 'weapon'
    case 'armor':  return 'armor'
    case 'charm':  return 'charm'
    case 'boots':  return 'boots'
    case 'relic':  return 'relic'
    case 'toy':    return 'toy'
    default:       return 'charm'
  }
}
