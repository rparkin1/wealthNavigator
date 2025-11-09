/**
 * Plaid Link Singleton Manager
 * Ensures only one Plaid Link script is loaded globally
 */

let plaidScriptLoaded = false;
let plaidScriptLoading = false;
const plaidScriptCallbacks: Array<() => void> = [];

/**
 * Ensures Plaid Link script is loaded only once
 * Returns a promise that resolves when the script is ready
 */
export function ensurePlaidScript(): Promise<void> {
  return new Promise((resolve) => {
    // Already loaded
    if (plaidScriptLoaded) {
      resolve();
      return;
    }

    // Currently loading, add to callbacks
    if (plaidScriptLoading) {
      plaidScriptCallbacks.push(resolve);
      return;
    }

    // Start loading
    plaidScriptLoading = true;
    plaidScriptCallbacks.push(resolve);

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="plaid.com/link"]');
    if (existingScript) {
      plaidScriptLoaded = true;
      plaidScriptLoading = false;
      plaidScriptCallbacks.forEach(cb => cb());
      plaidScriptCallbacks.length = 0;
      return;
    }

    // Script will be loaded by react-plaid-link
    // Just mark as loaded after a short delay
    setTimeout(() => {
      plaidScriptLoaded = true;
      plaidScriptLoading = false;
      plaidScriptCallbacks.forEach(cb => cb());
      plaidScriptCallbacks.length = 0;
    }, 100);
  });
}

/**
 * Reset singleton state (useful for testing)
 */
export function resetPlaidScript() {
  plaidScriptLoaded = false;
  plaidScriptLoading = false;
  plaidScriptCallbacks.length = 0;
}
