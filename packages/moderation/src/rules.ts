import type { ModerationRule } from '@nija/shared-types';

export function isBlockedDomain(url: string, rules: ModerationRule[]): boolean {
  try {
    const { hostname } = new URL(url);
    return rules
      .filter((rule) => rule.type === 'blocked_domain')
      .some((rule) => hostname === rule.value || hostname.endsWith(`.${rule.value}`));
  } catch {
    return false;
  }
}

export function isTrustedDomain(url: string, rules: ModerationRule[]): boolean {
  try {
    const { hostname } = new URL(url);
    return rules
      .filter((rule) => rule.type === 'trusted_domain')
      .some((rule) => hostname === rule.value || hostname.endsWith(`.${rule.value}`));
  } catch {
    return false;
  }
}

export function shouldEscalate(confidence: number, rules: ModerationRule[]): boolean {
  const thresholdRule = rules.find((rule) => rule.type === 'escalation_threshold');
  const threshold = thresholdRule ? parseFloat(thresholdRule.value) : 0.5;
  return confidence < threshold;
}
