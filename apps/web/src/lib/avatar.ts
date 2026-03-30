import {
  corePrimaryDay,
  coreAccentDay,
  coreEcoDay,
  statusSuccessSpotDay,
  statusDangerSpotDay,
  statusWarningSpotDay,
  textErrorDay,
  textSecondaryDay,
} from '@skyscanner/bpk-foundations-web/tokens/base.es6';

const avatarColors = [
  corePrimaryDay,
  coreAccentDay,
  coreEcoDay,
  statusSuccessSpotDay,
  statusDangerSpotDay,
  statusWarningSpotDay,
  textErrorDay,
  textSecondaryDay,
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}
