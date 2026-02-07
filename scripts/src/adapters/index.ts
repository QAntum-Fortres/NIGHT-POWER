/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: ADAPTERS INDEX
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Selenium Adapter - Full WebDriver API compatibility
export {
  Builder,
  By,
  Key,
  until,
  WebDriver,
  WebElement,
  Actions,
  Alert,
  Options,
  Timeouts,
  WindowOptions,
  Navigation,
  TargetLocator,
  type WebDriverOptions
} from './SeleniumAdapter';

// Re-export as default for drop-in replacement
export { default as selenium } from './SeleniumAdapter';
