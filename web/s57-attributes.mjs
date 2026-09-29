// Supported S-57 subset, version 1. Sources and scope: docs/feature-inspection.md.
export const vocabularyVersion = 1;
const definitions = {
  COLOUR: {'1': 'White', '3': 'Red', '4': 'Green', '6': 'Yellow'},
  LITCHR: {'2': 'Flashing'},
  WATLEV: {
    '1': 'Partly submerged at high water', '2': 'Always dry',
    '3': 'Always under water/submerged', '4': 'Covers and uncovers',
    '5': 'Awash', '6': 'Subject to inundation or flooding', '7': 'Floating',
  },
  CATWRK: {
    '1': 'Non-dangerous wreck', '2': 'Dangerous wreck', '3': 'Distributed remains of wreck',
    '4': 'Wreck showing mast/masts', '5': 'Wreck showing hull or superstructure',
  },
  QUASOU: {
    '1': 'Depth known', '2': 'Depth unknown', '3': 'Doubtful sounding',
    '4': 'Unreliable sounding', '5': 'No bottom found at value shown', '6': 'Least depth known',
    '7': 'Least depth unknown, safe clearance at value shown',
    '8': 'Value reported (not surveyed)', '9': 'Value reported (not confirmed)',
    '10': 'Maintained depth', '11': 'Not regularly maintained',
  },
};

export function list(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map(String);
  try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.map(String); } catch {}
  return [String(value)];
}

export function attributeValues(attribute, value) {
  const dictionary = Object.hasOwn(definitions, attribute) ? definitions[attribute] : {};
  return list(value).map(code => {
    if (Object.hasOwn(dictionary, code)) return dictionary[code];
    if (attribute === 'COLOUR') return `Unknown colour (${code})`;
    return `Unknown ${attribute} code (${code})`;
  });
}

export function decodeAttribute(attribute, value) {
  return attributeValues(attribute, value).join('; ') || 'Not recorded';
}

export function numericValue(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}
