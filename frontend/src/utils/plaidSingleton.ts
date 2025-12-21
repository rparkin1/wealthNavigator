/**
 * Plaid Singleton Utility
 * Ensures Plaid script is loaded only once to prevent duplicate initialization
 */

let plaidScriptLoaded = false;
let plaidInitialized = false;

export function ensurePlaidScript(): Promise<void> {
  if (plaidScriptLoaded) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Check if script is already in DOM
    if (document.querySelector('script[src*="plaid.com/link"]')) {
      plaidScriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    script.onload = () => {
      plaidScriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Plaid script'));
    };
    document.body.appendChild(script);
  });
}

export function isPlaidInitialized(): boolean {
  return plaidInitialized;
}

export function markPlaidInitialized(): void {
  plaidInitialized = true;
}
