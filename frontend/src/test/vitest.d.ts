import type { Assertion, AsymmetricMatchersContaining } from 'vitest';

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toBeVisible(): R;
  toBeDisabled(): R;
  toBeEnabled(): R;
  toBeChecked(): R;
  toHaveClass(...classNames: string[]): R;
  toHaveAttribute(attr: string, value?: string): R;
  toHaveValue(value: any): R;
  toHaveTextContent(text: string | RegExp): R;
  toContainElement(element: HTMLElement | null): R;
  toHaveStyle(css: string | Record<string, any>): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
