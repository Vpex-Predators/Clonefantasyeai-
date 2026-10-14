import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, act, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NativeAppBridge from '@/components/NativeAppBridge';
import { validateNativeEnvironment } from '../scripts/native-config.mjs';
const native = vi.hoisted(() => ({ enabled: true, back: null, minimize: vi.fn(), remove: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.enabled } }));
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(async (event, handler) => { native.back = handler; return { remove: native.remove }; }), minimizeApp: native.minimize } }));
vi.mock('@capacitor/browser', () => ({ Browser: { open: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); native.enabled = true; });

describe('Android release environment', () => {
  it('rejects absent and insecure backend origins', () => {
    expect(validateNativeEnvironment({})).toHaveLength(3);
    expect(validateNativeEnvironment({ VITE_BASE44_APP_ID: 'a'.repeat(24), VITE_BASE44_APP_BASE_URL: 'http://example.com', VITE_BASE44_API_URL: 'https://secret@example.com' })).toHaveLength(2);
  });
  it('accepts explicit HTTPS routing', () => {
    expect(validateNativeEnvironment({ VITE_BASE44_APP_ID: 'a'.repeat(24), VITE_BASE44_APP_BASE_URL: 'https://app.example.com', VITE_BASE44_API_URL: 'https://api.example.com' })).toEqual([]);
  });
});
it('Android back minimizes at the app root', async () => {
  window.history.replaceState({ idx: 0 }, '');
  await act(async () => render(<MemoryRouter><NativeAppBridge /></MemoryRouter>));
  act(() => native.back());
  expect(native.minimize).toHaveBeenCalledOnce();
});
it('Android back dismisses an open dialog before navigating', async () => {
  await act(async () => render(<MemoryRouter><NativeAppBridge /><div role="dialog" data-state="open">Pick</div></MemoryRouter>));
  const dismiss = vi.fn();
  screen.getByRole('dialog').addEventListener('keydown', dismiss);
  act(() => native.back());
  expect(dismiss.mock.calls[0][0].key).toBe('Escape');
  expect(native.minimize).not.toHaveBeenCalled();
});
it('web builds do not install native back behavior', async () => {
  native.enabled = false;
  const { App } = await import('@capacitor/app');
  await act(async () => render(<MemoryRouter><NativeAppBridge /></MemoryRouter>));
  expect(App.addListener).not.toHaveBeenCalled();
});
