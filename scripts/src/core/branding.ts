/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚛️ QANTUM BRANDING - Single Source of Truth for Identity
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This file is the CENTRAL authority for all branding elements.
 * Any change here propagates to the entire system.
 * 
 * @author dp
 * @organization QAntum Labs
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const QANTUM_IDENTITY = {
  name: 'QAntum',
  version: '1.0.0',
  tagline: 'The Autonomous QA Agent - Beyond Classical Testing',
  
  author: {
    name: 'dp',
    organization: 'QAntum Labs',
    year: 2025
  }
} as const;

/**
 * ┌──────────────────────────────────────┐
 * │                                      │
 * │            ╭──────────╮              │
 * │            │    dp    │              │
 * │            ╰──────────╯              │
 * │                                      │
 * │         qantum labs © 2025           │
 * └──────────────────────────────────────┘
 */
export const AUTHOR_LOGO = `
┌──────────────────────────────────────┐
│                                      │
│            ╭──────────╮              │
│            │    dp    │              │
│            ╰──────────╯              │
│                                      │
│         qantum labs © 2025           │
└──────────────────────────────────────┘
`;

export const AUTHOR_LOGO_MINIMAL = `  dp  `;

export const AUTHOR_LOGO_INLINE = `[ dp ] qantum labs`;

/**
 * Primary QAntum ASCII Art Logo
 */
export const QANTUM_LOGO = `
    ██████╗  █████╗ ███╗   ██╗████████╗██╗   ██╗███╗   ███╗
   ██╔═══██╗██╔══██╗████╗  ██║╚══██╔══╝██║   ██║████╗ ████║
   ██║   ██║███████║██╔██╗ ██║   ██║   ██║   ██║██╔████╔██║
   ██║▄▄ ██║██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╔╝██║
   ╚██████╔╝██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚═╝ ██║
    ╚══▀▀═╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝
`;

/**
 * Compact QAntum Logo
 */
export const QANTUM_LOGO_COMPACT = `
 ╔═══════════════════════════════════════════════╗
 ║  ⚛️  QAntum v${QANTUM_IDENTITY.version.padEnd(6)}                        ║
 ║  The Autonomous QA Agent                      ║
 ╚═══════════════════════════════════════════════╝
`;

/**
 * Full banner with author branding
 */
export const QANTUM_BANNER = `
═══════════════════════════════════════════════════════════════════════════════

    ██████╗  █████╗ ███╗   ██╗████████╗██╗   ██╗███╗   ███╗
   ██╔═══██╗██╔══██╗████╗  ██║╚══██╔══╝██║   ██║████╗ ████║
   ██║   ██║███████║██╔██╗ ██║   ██║   ██║   ██║██╔████╔██║
   ██║▄▄ ██║██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╔╝██║
   ╚██████╔╝██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚═╝ ██║
    ╚══▀▀═╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝

                     ⚛️ VERSION ${QANTUM_IDENTITY.version} ⚛️
           "${QANTUM_IDENTITY.tagline}"

═══════════════════════════════════════════════════════════════════════════════
                            ╭──────────╮
                            │    dp    │
                            ╰──────────╯
                       qantum labs © ${QANTUM_IDENTITY.author.year}
═══════════════════════════════════════════════════════════════════════════════
`;

/**
 * Footer with minimal branding
 */
export const QANTUM_FOOTER = `
───────────────────────────────────────────────────────────────────────────────
  ⚛️ QAntum v${QANTUM_IDENTITY.version}  │  ${QANTUM_IDENTITY.tagline}  │  [ dp ] qantum labs
───────────────────────────────────────────────────────────────────────────────
`;

/**
 * Print the full banner to console
 */
export function printBanner(): void {
  console.log(QANTUM_BANNER);
}

/**
 * Print compact header
 */
export function printHeader(): void {
  console.log(QANTUM_LOGO_COMPACT);
}

/**
 * Print footer
 */
export function printFooter(): void {
  console.log(QANTUM_FOOTER);
}

/**
 * Get version string with branding
 */
export function getVersionString(): string {
  return `⚛️ QAntum v${QANTUM_IDENTITY.version} by dp`;
}

/**
 * Get copyright string
 */
export function getCopyright(): string {
  return `© ${QANTUM_IDENTITY.author.year} ${QANTUM_IDENTITY.author.organization}`;
}

/**
 * Color codes for terminal output
 */
export const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Brand colors
  primary: '\x1b[38;5;99m',    // Purple/Indigo
  accent: '\x1b[38;5;141m',    // Light purple
  success: '\x1b[38;5;82m',    // Green
  warning: '\x1b[38;5;220m',   // Yellow
  error: '\x1b[38;5;196m',     // Red
  info: '\x1b[38;5;39m',       // Blue
  
  // Grayscale
  white: '\x1b[37m',
  gray: '\x1b[90m',
} as const;

/**
 * Styled console output
 */
export const styled = {
  brand: (text: string) => `${COLORS.primary}${COLORS.bright}${text}${COLORS.reset}`,
  success: (text: string) => `${COLORS.success}✓ ${text}${COLORS.reset}`,
  error: (text: string) => `${COLORS.error}✗ ${text}${COLORS.reset}`,
  warning: (text: string) => `${COLORS.warning}⚠ ${text}${COLORS.reset}`,
  info: (text: string) => `${COLORS.info}ℹ ${text}${COLORS.reset}`,
  dim: (text: string) => `${COLORS.dim}${text}${COLORS.reset}`,
};

export default {
  QANTUM_IDENTITY,
  QANTUM_LOGO,
  QANTUM_BANNER,
  QANTUM_FOOTER,
  AUTHOR_LOGO,
  AUTHOR_LOGO_MINIMAL,
  AUTHOR_LOGO_INLINE,
  COLORS,
  styled,
  printBanner,
  printHeader,
  printFooter,
  getVersionString,
  getCopyright,
};
