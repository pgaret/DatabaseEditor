import { strollLoyalty } from './stroll-loyalty.js';

const ALL_RULES = {
  strollLoyalty,
};

export function getEnabledRules(config) {
  return Object.entries(config.rules)
    .filter(([, enabled]) => enabled)
    .map(([name]) => ALL_RULES[name])
    .filter(Boolean);
}
