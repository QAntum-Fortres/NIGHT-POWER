/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM HYBRID v1.0.0 - POM Module
 * Page Object Model exports
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Base classes
export { BaseElement } from './BaseElement';
export type { 
  LocatorStrategy, 
  ElementOptions, 
  ElementMetadata, 
  ElementState,
  InteractionRecord,
  ErrorRecord,
  HealingRecord 
} from './BaseElement';

export { BasePage } from './BasePage';
export type { 
  PageOptions, 
  PageMetadata, 
  ActionOptions, 
  ActionFunction, 
  PageAction 
} from './BasePage';

export { 
  BaseComponent,
  HeaderComponent,
  FooterComponent,
  ModalComponent,
  FormComponent,
  TableComponent,
  DropdownComponent
} from './BaseComponent';
export type { ComponentOptions, ComponentMetadata } from './BaseComponent';

// Locator utilities
export { 
  LocatorFactory, 
  By, 
  LocatorBuilder, 
  locator 
} from './LocatorFactory';

// Page Factory
export { 
  PageFactory, 
  getFactory, 
  getPage, 
  definePage, 
  definePages,
  RegisterPage,
  RegisterComponent
} from './PageFactory';
export type { PageDefinition, PageFactoryOptions } from './PageFactory';
