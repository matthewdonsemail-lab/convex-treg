/**
 * Pure helpers for calling treg.to. No network here — the action owns fetch
 * so tests can inject a fake. Protocol: GET https://treg.to/call/<id>?params
 * with an X-Treg-Token header; the upstream answer relays verbatim.
 */

export const TREG_DEFAULT_BASE_URL = "https://treg.to";

/** A catalog call: endpoint id plus flat string/number/boolean params. */
export type CatalogCall = {
  endpoint: string;
  params?: Record<string, string | number | boolean>;
};

export function buildCallUrl(baseUrl: string, call: CatalogCall): string {
  const query = Object.entries(call.params ?? {})
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return `${baseUrl.replace(/\/$/, "")}/call/${call.endpoint}${query ? `?${query}` : ""}`;
}

/**
 * Plain-words reason for a failed catalog call. Never includes a response
 * body or a key: 402 means the team balance is out (top up, then retry),
 * 503 means treg's own provider account is out (retry in a minute or pick
 * the next provider row), anything else stays generic.
 */
export function callFailureReason(status: number): string {
  if (status === 401 || status === 403) return "Treg refused the team token";
  if (status === 402) return "The team balance is out — top up, then try again";
  if (status === 429) return "Treg is busy, try again in a minute";
  if (status === 503) return "That provider is out right now, try again in a minute";
  return `Treg answered HTTP ${status}`;
}
