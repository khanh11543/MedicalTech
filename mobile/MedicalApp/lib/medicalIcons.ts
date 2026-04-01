import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Map specialty name (any locale) to a tabler-style medical icon. */
export function pickSpecialtyIcon(name: string): MciName {
  const n = name.toLowerCase();
  if (/răng|nha|dent|tooth/i.test(n)) return 'tooth-outline';
  if (/sản|phụ|gyne|obstet/i.test(n)) return 'human-female';
  if (/tim|cardio|heart/i.test(n)) return 'heart-pulse';
  if (/thần kinh|neuro|não/i.test(n)) return 'brain';
  if (/chỉnh hình|ortho|xương|bone/i.test(n)) return 'bone';
  if (/mắt|nhãn|ophthal|eye/i.test(n)) return 'eye-outline';
  if (/dị ứng|allerg/i.test(n)) return 'clipboard-pulse-outline';
  return 'medical-bag';
}

/** Map content title keywords to an icon for guides / articles. */
export function pickContentTitleIcon(title: string): MciName {
  const n = title.toLowerCase();
  if (/gene|di truyền/i.test(n)) return 'dna';
  if (/xét nghiệm|lab|hóa|tế bào/i.test(n)) return 'flask-outline';
  if (/chụp|ảnh|imaging|ct|mri/i.test(n)) return 'image-filter-center-focus';
  if (/đo|measure/i.test(n)) return 'pulse';
  return 'stethoscope';
}
