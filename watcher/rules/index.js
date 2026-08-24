import { strollLoyalty } from './stroll-loyalty.js';
import { aiBuildingFix } from './ai-building-fix.js';
import { affiliateSalaryCap } from './affiliate-salary-cap.js';

const ALL_RULES = {
  strollLoyalty,
  aiBuildingFix,
  affiliateSalaryCap,
};

export function getEnabledRules(config) {
  return Object.entries(config.rules)
    .filter(([, enabled]) => enabled)
    .map(([name]) => ALL_RULES[name])
    .filter(Boolean);
}
