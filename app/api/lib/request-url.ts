const DEFAULT_SITE_URL = 'https://www.monotennisclub.com';

function normalizeProtocol(protocol: string | null): string | null {
  if (!protocol) return null;
  const trimmed = protocol.trim().replace(/:$/, '');
  return trimmed ? trimmed : null;
}

function normalizeHost(host: string | null): string | null {
  if (!host) return null;
  const trimmed = host.trim();
  return trimmed ? trimmed : null;
}

export function getRequestOrigin(request: Request): string {
  const forwardedProto = normalizeProtocol(request.headers.get('x-forwarded-proto'));
  const forwardedHost = normalizeHost(request.headers.get('x-forwarded-host'));

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
}

