// 16×16 templates for enemies (96×96 canvas at PS=6)
export type EnemyTemplateKey = 'slime'|'bat'|'goblin'|'mushroom'|'skull'|'gear'|'ghost'|'crystal'|'mimic'

export const ENEMY_TEMPLATES: Record<EnemyTemplateKey, string[]> = {

  // Fat round blob with drip, angry dual eyes, highlight + shadow gradient feel
  slime: [
    '................',
    '.....KKKKKK.....',
    '....KBBBBBBK....',
    '...KBBBBBBBBK...',
    '..KBBABBBBABBK..',
    '..KBBXBBBBXBBK..',
    '..KBBBBBBBBBBK..',
    '..KBBDDDDDDBBK..',
    '..KBBBBBBBBBBK..',
    '...KBBBBBBBBK...',
    '....KBBBBBBK....',
    '.....KBBBBK.....',
    '......KBBK......',
    '......KBBK......',
    '....SSSSSSSS....',
    '................',
  ],

  // Wide vampire-bat wings, small hanging face with glowing eyes
  bat: [
    'KDDD......DDDDK.',
    'KDDDD....DDDDDK.',
    '.KDDDKBBKDDDK...',
    '..KDDKBBKDDK....',
    '...KBBABBABK....',
    '...KBBXBBXBBK...',
    '....KBBBBBBBBK..',
    '....KBBBBBBBBK..',
    '.....KBBBBBBK...',
    '.....KBBBBBBK...',
    '......KBBBBK....',
    '.......KBBK.....',
    '.......KBBK.....',
    '................',
    '.....SSSSSS.....',
    '................',
  ],

  // Goblin with pointy ears, big head, gap-tooth grin, belt, boots
  goblin: [
    '....K......K....',
    '...KHK....KHK...',
    '..KHHHHHHHHHK...',
    '..KHHHHHHHHHK...',
    '..KHHHXHHXHHHK..',
    '..KHHHAHHHAHHHK.',
    '...KKKHHHHKKKK..',
    '....KBBBBBBK....',
    '....KBPBBPBK....',
    '....KBBBBBBK....',
    '....KDDDDDDK....',
    '...KLLKKLLK.....',
    '...KLLKKLLK.....',
    '...KFFKKFFK.....',
    '....SSSSSSSS....',
    '................',
  ],

  // Wide spotted cap with glowing eyes, pale narrow stalk, gnarled roots
  mushroom: [
    '................',
    '.....KKKKKK.....',
    '....KBBBBBBK....',
    '...KBBBBBBBBK...',
    '..KBBABBBABBK...',
    '..KBBBXBBXBBBK..',
    '..KBBBBBBBBBBK..',
    '...KKKHHHKKKK...',
    '....KHHHHHHHK...',
    '....KHHHHHHHK...',
    '....KHHHHHHHK...',
    '....KHHHHHHHK...',
    '....KHHDDHHK....',
    '....KFFFFFFK....',
    '...SSSSSSSSSSS..',
    '................',
  ],

  // Bone dome, wide double eye-sockets, zig-zag teeth jaw
  skull: [
    '................',
    '.....KKKKKK.....',
    '...KHHHHHHHHK...',
    '..KHHHHHHHHHHK..',
    '..KHXXHHHHHHXXK.',
    '..KHHHHHHHHHHHK.',
    '..KHHHHHHHHHHHK.',
    '..KKKHHHHHHKKKK.',
    '...KDDDDDDDDDK..',
    '...KHKHKHKHKHK..',
    '....KDDDDDDDK...',
    '................',
    '................',
    '................',
    '.....SSSSSS.....',
    '................',
  ],

  // Small bug head, wide oval armored body, 3 pairs of gear-claw legs
  gear: [
    '......KKKK......',
    '....KKBBBBKK....',
    '....KBBXBBXK....',
    '....KBBBBBBK....',
    '..KBBBBBBBBBBK..',
    '.KPKBBBBBBBBKPK.',
    '.KPKBBAPBAPBBKPK',
    '.KPKBBBBBBBBKPK.',
    '..KBBBBBBBBBBK..',
    '...KBBBBBBBBK...',
    '....KDDDDDDK....',
    '................',
    '................',
    '................',
    '....SSSSSSSSSS..',
    '................',
  ],

  // Wispy pale translucent body, glowing eyes, split wavy hem wisps
  ghost: [
    '................',
    '....KAAAAAAAAK..',
    '...KAAAAAAAAAK..',
    '..KAAAAAAAAAAAK.',
    '..KAAXAAAAXAAAK.',
    '..KAAAAAAAAAAAK.',
    '..KAAAAAAAAAAAK.',
    '..KAAAAAAAAAAAK.',
    '..KAAAAAAAAAAAK.',
    '..KAAKAAKAAKAK..',
    '..KAK...KAK...K.',
    '..KAK...KAK.....',
    '................',
    '................',
    '....SSSSSSSS....',
    '................',
  ],

  // Twin crystal horn spires, massive armored body, faceted highlights (elite)
  crystal: [
    '...KBK....KBK...',
    '..KBBBK..KBBBK..',
    '..KBBBBBBBBBBK..',
    '.KBBBAABBBBAAABK',
    '.KBBBBXBBBXBBBBK',
    'KBBBBBBBBBBBBBBK',
    'KBBAABBBBBAAABBK',
    'KBBBBBBBBBBBBBBK',
    '.KBBBBBBBBBBBBK.',
    '..KBBBBBBBBBBK..',
    '..KBBBBBBBBBBK..',
    '...KBBBBBBBBK...',
    '....KBBBBBBK....',
    '....KDDDDDDDK...',
    '....SSSSSSSSSS..',
    '................',
  ],

  // Evil mimic chest: lid, hinge, reaching arms, rows of jagged teeth (elite)
  mimic: [
    '................',
    '..KKKKKKKKKKKK..',
    '.KBBBBBBBBBBBBK.',
    '.KBBAABBBBBBABK.',
    '..KPPPPPPPPPPK..',
    'KPKBBBBBBBBBBKPK',
    'KPKBBAXBBXABBKPK',
    'KPKBBDDDDDDBBKPK',
    'KPKBHKHKHKHBBKPK',
    '.KBBBBBBBBBBBBK.',
    '..KBBBBBBBBBBK..',
    '...KBBBBBBBBK...',
    '....KDDDDDDDK...',
    '................',
    '....SSSSSSSSSS..',
    '................',
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
