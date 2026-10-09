import { vi } from 'vitest';
window.matchMedia = vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
Element.prototype.scrollIntoView = () => {};
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};
// jsdom has no CSS animation timeline; let Radix Presence close synchronously.
const computedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = element => new Proxy(computedStyle(element), {
  get(target, key) {
    if (key === 'animationName') return 'none';
    const value = Reflect.get(target, key, target);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});
