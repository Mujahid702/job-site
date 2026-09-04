/**
 * lib/tenant.ts
 * Multi-Tenant & Environment Resolution Engine
 * 
 * Supports a 3-tier hierarchy:
 * 1. DEV: Development & unit testing of UI and automation.
 * 2. STAGE: User Acceptance Testing (UAT), manual and automated end-to-end suites.
 * 3. PROD: Live production tenant for students, recruiters, and corporate partners.
 */

export type TenantId = 'dev' | 'stage' | 'prod';

export interface TenantFeatures {
  allowMockPayments: boolean;
  allowMockDataSeed: boolean;
  verboseLogging: boolean;
  showDevTools: boolean;
  strictAuth: boolean;
  enableLiveIntegrations: boolean;
}

export interface TenantConfig {
  id: TenantId;
  name: string;
  shortName: string;
  tagline: string;
  badgeLabel: string;
  badgeColor: 'amber' | 'purple' | 'emerald';
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  isDev: boolean;
  isStage: boolean;
  isProd: boolean;
  redisPrefix: string;
  cookiePrefix: string;
  features: TenantFeatures;
  urls: {
    app: string;
    api: string;
  };
}

export const TENANT_CONFIGS: Record<TenantId, TenantConfig> = {
  dev: {
    id: 'dev',
    name: 'Development Tenant',
    shortName: 'DEV',
    tagline: 'Developer workspace for new features, bug fixes, unit testing, and UI automation.',
    badgeLabel: 'DEV TENANT',
    badgeColor: 'amber',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-400',
    isDev: true,
    isStage: false,
    isProd: false,
    redisPrefix: 'dev:',
    cookiePrefix: 'bb_dev_',
    features: {
      allowMockPayments: true,
      allowMockDataSeed: true,
      verboseLogging: true,
      showDevTools: true,
      strictAuth: false,
      enableLiveIntegrations: false,
    },
    urls: {
      app: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      api: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api',
    },
  },
  stage: {
    id: 'stage',
    name: 'Staging Tenant (UAT)',
    shortName: 'STAGE',
    tagline: 'Pre-production environment for User Acceptance Testing (UAT) and regression suites.',
    badgeLabel: 'STAGE (UAT)',
    badgeColor: 'purple',
    badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-300',
    isDev: false,
    isStage: true,
    isProd: false,
    redisPrefix: 'stage:',
    cookiePrefix: 'bb_stage_',
    features: {
      allowMockPayments: true, // Sandbox mode enabled
      allowMockDataSeed: true,
      verboseLogging: true,
      showDevTools: true,
      strictAuth: true,
      enableLiveIntegrations: false,
    },
    urls: {
      app: process.env.NEXT_PUBLIC_APP_URL || 'https://stage.buggedbrain.vercel.app',
      api: (process.env.NEXT_PUBLIC_APP_URL || 'https://stage.buggedbrain.vercel.app') + '/api',
    },
  },
  prod: {
    id: 'prod',
    name: 'Production Tenant',
    shortName: 'PROD',
    tagline: 'Live tenant serving candidates, recruiters, and corporate placement drives.',
    badgeLabel: '',
    badgeColor: 'emerald',
    badgeBg: '',
    badgeBorder: '',
    badgeText: '',
    isDev: false,
    isStage: false,
    isProd: true,
    redisPrefix: 'prod:',
    cookiePrefix: 'bb_prod_',
    features: {
      allowMockPayments: false, // Live gateway only
      allowMockDataSeed: false,
      verboseLogging: false,
      showDevTools: false,
      strictAuth: true,
      enableLiveIntegrations: true,
    },
    urls: {
      app: process.env.NEXT_PUBLIC_APP_URL || 'https://buggedbrain.vercel.app',
      api: (process.env.NEXT_PUBLIC_APP_URL || 'https://buggedbrain.vercel.app') + '/api',
    },
  },
};

/**
 * Resolves active tenant from environment variable or current hostname.
 * Order of resolution:
 * 1. NEXT_PUBLIC_APP_ENV / APP_ENV
 * 2. VERCEL_ENV (preview -> stage, production -> prod, development -> dev)
 * 3. Client hostname checks (e.g. localhost -> dev, stage.* -> stage)
 * 4. Fallback: dev locally, prod in production build
 */
export function getCurrentTenant(): TenantId {
  // 1. Client-side path, query parameter and localStorage override (allows 1-click cloud tenant switching)
  if (typeof window !== 'undefined') {
    try {
      // Check path first
      const pathname = window.location.pathname.toLowerCase();
      if (pathname === '/dev' || pathname.startsWith('/dev/')) {
        localStorage.setItem('bb_active_tenant', 'dev');
        return 'dev';
      }
      if (pathname === '/stage' || pathname.startsWith('/stage/')) {
        localStorage.setItem('bb_active_tenant', 'stage');
        return 'stage';
      }
      if (pathname === '/prod' || pathname.startsWith('/prod/')) {
        localStorage.setItem('bb_active_tenant', 'prod');
        return 'prod';
      }

      // Check query parameters (?tenant=dev|stage|prod or ?env=dev|stage|prod)
      const params = new URLSearchParams(window.location.search);
      const queryTenant = (params.get('tenant') || params.get('env'))?.toLowerCase();
      if (queryTenant === 'dev' || queryTenant === 'stage' || queryTenant === 'prod') {
        localStorage.setItem('bb_active_tenant', queryTenant);
        return queryTenant;
      }

      const storedTenant = localStorage.getItem('bb_active_tenant')?.toLowerCase();
      if (storedTenant === 'dev' || storedTenant === 'stage' || storedTenant === 'prod') {
        return storedTenant as TenantId;
      }
    } catch {}
  }

  // 2. Explicit environment variable
  const explicitEnv = (
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.APP_ENV ||
    ''
  ).toLowerCase();

  if (explicitEnv === 'dev' || explicitEnv === 'development') return 'dev';
  if (explicitEnv === 'stage' || explicitEnv === 'staging' || explicitEnv === 'uat') return 'stage';
  if (explicitEnv === 'prod' || explicitEnv === 'production') return 'prod';

  // 3. Vercel environment detection
  const vercelEnv = (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || '').toLowerCase();
  if (vercelEnv === 'preview') return 'stage';
  if (vercelEnv === 'production') return 'prod';

  // 4. Browser hostname detection (client-side)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('stage') || hostname.includes('uat') || hostname.includes('-stage-')) {
      return 'stage';
    }
    if (hostname.includes('dev') || hostname.includes('-dev-') || hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'dev';
    }
    if (hostname.includes('vercel.app') && !hostname.includes('-git-') && !hostname.includes('stage')) {
      return 'prod';
    }
  }

  // 4. Fallback based on NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'prod';
  }

  return 'dev';
}

/**
 * Returns full configuration for the currently active tenant
 */
export function getTenantConfig(): TenantConfig {
  const tenantId = getCurrentTenant();
  return TENANT_CONFIGS[tenantId] || TENANT_CONFIGS.dev;
}

/**
 * Helper to check if current environment is Development
 */
export function isDevTenant(): boolean {
  return getCurrentTenant() === 'dev';
}

/**
 * Helper to check if current environment is Staging / UAT
 */
export function isStageTenant(): boolean {
  return getCurrentTenant() === 'stage';
}

/**
 * Helper to check if current environment is Live Production
 */
export function isProdTenant(): boolean {
  return getCurrentTenant() === 'prod';
}

/**
 * Returns namespaced key for Redis cache to prevent cross-tenant collisions
 */
export function getTenantCacheKey(rawKey: string): string {
  const config = getTenantConfig();
  return `${config.redisPrefix}${rawKey}`;
}

/**
 * Returns tenant-isolated cookie name
 */
export function getTenantCookieName(baseName: string): string {
  const config = getTenantConfig();
  return `${config.cookiePrefix}${baseName}`;
}

/**
 * Programmatically switches the active tenant on the client
 */
export function setActiveTenant(tenantId: TenantId): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bb_active_tenant', tenantId);
    document.cookie = `bb_tenant=${tenantId}; path=/; max-age=2592000; SameSite=Lax`;
    window.location.href = `/?tenant=${tenantId}`;
  }
}
