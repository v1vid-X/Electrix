/** Widget registry: `::widget{id=ohms-law}` in a lesson looks up this map.
 *  Add a widget here and it is immediately usable from any lesson. */
import type { ComponentType } from 'react';
import { OhmsLaw } from './OhmsLaw';
import { WaterAnalogy } from './WaterAnalogy';

export const WIDGETS: Record<string, ComponentType> = {
  'ohms-law': OhmsLaw,
  'water-analogy': WaterAnalogy,
};
