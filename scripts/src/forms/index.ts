/**
 * Form Automation Module
 * @module forms
 */

export {
  SmartFormFiller,
  FormValidator,
  MultiStepFormHandler,
  FormDataGenerator,
  FormTemplateBuilder,
  FORM_TEMPLATES,
  createSmartFormFiller,
  createFormValidator,
  createMultiStepHandler,
  createDataGenerator,
  createTemplateBuilder
} from './FormAutomation';

export type {
  FormField,
  ValidationRule,
  FormData,
  FillResult,
  FieldError,
  FormStep,
  FormTemplate
} from './FormAutomation';
