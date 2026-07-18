// Shared trust policy for real citation URLs attached to plant content
// (PlantDefinition.sourceRefs, PlantUse.sourceRefs — PR29/30/32). A source
// must be a real HTTPS page on a Japanese government or public-institution
// domain; see docs/DATA_SOURCES_AND_LICENSES.md for how these are sourced
// and verified. Exported so every test asserting this policy checks the
// exact same rule instead of maintaining independent, driftable copies.

const AUTHORITATIVE_HOST_PATTERN = /\.(go\.jp|lg\.jp)$/;

export function isAuthoritativeSourceUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && AUTHORITATIVE_HOST_PATTERN.test(parsed.hostname);
  } catch {
    return false;
  }
}
