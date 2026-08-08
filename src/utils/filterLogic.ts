const profanityDict: Record<string, string> = {
  'fuck': 'feck',
  'shit': 'crap',
  'bitch': 'witch',
  'bastard': 'scoundrel',
  'damn': 'darn',
  'ass': 'bottom',
  'cunt': 'scoundrel',
  'dick': 'pete',
  'cock': 'rooster',
  'pussy': 'kitty',
  'slut': 'rogue',
  'whore': 'rogue'
};

export const sanitizeInput = (input: string, mode: 'kid' | 'adult' | 'unrestricted'): string => {
  if (mode !== 'kid') return input;

  let sanitized = input;
  Object.keys(profanityDict).forEach(badWord => {
    const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
    sanitized = sanitized.replace(regex, profanityDict[badWord]);
  });
  return sanitized;
};
