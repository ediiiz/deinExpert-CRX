import { writable } from 'svelte/store';

// Initialize the store with the current path
const currentPath = writable(window.location.pathname);

// Update the store when the path changes
const updatePath = () => currentPath.set(window.location.pathname);

// Listen for changes to the history state
window.addEventListener('popstate', updatePath);
window.addEventListener('pushstate', updatePath);
window.addEventListener('replacestate', updatePath);

// Monkey patching pushState and replaceState to detect programmatic navigation
const originalPushState = history.pushState;
history.pushState = function (...args) {
  originalPushState.apply(this, args);
  updatePath();
};

const originalReplaceState = history.replaceState;
history.replaceState = function (...args) {
  originalReplaceState.apply(this, args);
  updatePath();
};

export default currentPath;
