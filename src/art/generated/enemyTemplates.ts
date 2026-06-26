// 12×12 templates for enemies (48×48 canvas at PS=4)
export type EnemyTemplateKey = 'slime'|'bat'|'goblin'|'mushroom'|'skull'|'gear'|'ghost'|'crystal'|'mimic'

export const ENEMY_TEMPLATES: Record<EnemyTemplateKey, string[]> = {
  // Fat blob, wide body, drip bottom, angry eyes
  slime: [
    '............',
    '....KKKK....',
    '..KKBBBBKK..',
    '.KBBBBBBBBK.',
    '.KBABBBBABK.',
    '.KBBXBBBXBK.',
    '.KBBBBBBBBK.',
    '.KBDDDDDDBK.',
    '..KKBBBBKK..',
    '....KBBK....',
    '............',
    '...SSSSSS...',
  ],

  // Wide wingspan top, small face hanging below
  bat: [
    'KDD......DDK',
    'KDDD....DDDK',
    'KDDDKBBKDDDK',
    '.KDDKBBKDDK.',
    '..KBBABBABK.',
    '..KBBXBBXBK.',
    '...KBBBBBBK.',
    '....KBBBBK..',
    '.....KBBK...',
    '......KK....',
    '............',
    '.....SSSS...',
  ],

  // Humanoid, pointy ears, gap-tooth grin, tool belt
  goblin: [
    '..K......K..',
    '.KHK....KHK.',
    '.KHHHHHHHHK.',
    '.KHHXHHHXHK.',
    '.KHAHHHHAHK.',
    '..KKHHHKKK..',
    '...KBBBBK...',
    '...KBPBBK...',
    '...KDDDDK...',
    '...KLLKLLK..',
    '...KFFKFFK..',
    '....KSSSK...',
  ],

  // Wide cap with spots, narrow stalk, face on cap edge
  mushroom: [
    '............',
    '....KKKK....',
    '..KBBBBBBK..',
    '.KBBBBBBBBK.',
    '.KBABBBBABK.',
    '.KBBXBBXBBK.',
    '..KKHHHHKK..',
    '....KHHK....',
    '....KHHK....',
    '....KHHK....',
    '....KFFK....',
    '....SSSS....',
  ],

  // Bone dome, 2-pixel wide eye sockets, zig-zag teeth, dark jaw
  skull: [
    '............',
    '....KKKK....',
    '..KHHHHHHK..',
    '.KHHHHHHHHK.',
    '.KHXXHHHXXK.',
    '.KHHHHHHHHK.',
    '..KHHHHHHHK.',
    '...KHKHKHK..',
    '...KDDDDDK..',
    '....KDDDK...',
    '............',
    '....SSSS....',
  ],

  // Small bug head, wide oval body, 3 pairs of gear-legs
  gear: [
    '....KKKK....',
    '...KBBBBK...',
    '...KBXBXK...',
    '...KBBBBK...',
    '.KBBBBBBBBK.',
    'KPKBBBBBBKPK',
    'KPKBAPBAPKPK',
    'KPKBBBBBBKPK',
    '.KBBBBBBBBK.',
    '..KKBBBBKK..',
    '............',
    '...KSSSSSK..',
  ],

  // Wispy pale body, glowing eyes, wavy-hem split wisps
  ghost: [
    '....KKKK....',
    '..KAAAAAAK..',
    '..KAAAAAAK..',
    '.KAAAAAAAAK.',
    '.KAAXAAAXAK.',
    '.KAAAAAAAAK.',
    '.KAAAAAAAAK.',
    '.KAAAAAAAAK.',
    '.KAAKAAKAAK.',
    '..KAK...KAK.',
    '..KAK...KAK.',
    '...SS...SS..',
  ],

  // Twin crystal horns, wide body, angular facet highlights (elite)
  crystal: [
    '..KBK...KBK.',
    '..KBBK.KBBK.',
    '..KBBBBBBBK.',
    '.KBBBAABBBK.',
    '.KBBXBBBXBK.',
    'KBBBBBBBBBBK',
    'KBBAABBBABK.',
    'KBBBBBBBBBBK',
    '.KBBBBBBBBK.',
    '..KBBBBBBK..',
    '..KBBBBBBK..',
    '...KSSSSSK..',
  ],

  // Evil chest: lid + hinge + reaching arms + teeth (elite)
  mimic: [
    '............',
    '..KKKKKKKK..',
    '.KBBBBBBBBK.',
    '.KBAABBBBAK.',
    '..KPPPPPPK..',
    'KPKBBBBBBKPK',
    'KPKBBXBBXKPK',
    'KPKBKDDDKBPK',
    'KPKBHKHKHBPK',
    '.KBBBBBBBBK.',
    '..KBBBBBBK..',
    '...KSSSSSK..',
  ],
}

export function tagsToEnemyTemplate(tags: string[]): EnemyTemplateKey {
  const t = tags.map(s => s.toLowerCase()).join(' ')
  if (t.includes('slime'))                          return 'slime'
  if (t.includes('bat') || t.includes('flying'))   return 'bat'
  if (t.includes('goblin'))                        return 'goblin'
  if (t.includes('mushroom'))                      return 'mushroom'
  if (t.includes('undead') || t.includes('skull')) return 'skull'
  if (t.includes('machine') || t.includes('gear')) return 'gear'
  if (t.includes('ghost'))                         return 'ghost'
  if (t.includes('ice') || t.includes('crystal'))  return 'crystal'
  if (t.includes('mimic') || t.includes('gold'))   return 'mimic'
  return 'slime'
}
