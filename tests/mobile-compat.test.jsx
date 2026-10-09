import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AuthLayout from '@/components/AuthLayout';
import { TabStateProvider, useTabState, useTabNavigation } from '@/lib/TabStateContext';
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: { id: 'test-user' }, isAuthenticated: true }) }));
afterEach(cleanup);
beforeEach(() => sessionStorage.clear());

function Picker({ onChange = () => {} }) {
  return <Select defaultValue="a" onValueChange={onChange} name="choice">
    <SelectTrigger aria-label="Model"><SelectValue /></SelectTrigger>
    <SelectContent><SelectItem value="a">Alpha</SelectItem><SelectItem value="b">Beta</SelectItem>
      <SelectItem value="c" disabled>Disabled</SelectItem></SelectContent>
  </Select>;
}

describe('responsive Select', () => {
  it('opens a mobile drawer, supports keyboard selection, submits value and restores focus', async () => {
    window.matchMedia = vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    const onChange = vi.fn();
    render(<form aria-label="test"><Picker onChange={onChange} /></form>);
    const trigger = screen.getByRole('button', { name: 'Model' });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeTruthy();
    await waitFor(() => expect(document.activeElement.textContent).toBe('Alpha'));
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
    expect(document.activeElement.textContent).toBe('Beta');
    fireEvent.click(document.activeElement);
    expect(onChange).toHaveBeenCalledWith('b');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(new FormData(screen.getByRole('form')).get('choice')).toBe('b');
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    fireEvent.click(trigger);
    expect(screen.getByRole('option', { name: 'Disabled' }).disabled).toBe(true);
  });
  it('keeps the desktop Radix trigger and listbox', async () => {
    window.matchMedia = vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    render(<Picker />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(trigger.textContent).toBe('Beta');
  });
});

function Draft() {
  const [draft, setDraft] = useTabState('draft', '');
  const location = useLocation();
  return <><input aria-label="draft" value={draft} onChange={e => setDraft(e.target.value)} />
    <output>{location.search}</output><Link to="/waivers">Other tab</Link></>;
}
function Other() {
  const saved = useTabNavigation();
  return <Link to={saved('/warroom')}>Return</Link>;
}
function SessionApp() {
  return <MemoryRouter initialEntries={['/warroom?compare=1,2']}><TabStateProvider>
    <Routes><Route path="/warroom" element={<Draft />} /><Route path="/waivers" element={<Other />} /></Routes>
  </TabStateProvider></MemoryRouter>;
}
it('restores drafts and query parameters after switching tabs and remounting the app', () => {
  const app = render(<SessionApp />);
  fireEvent.change(screen.getByLabelText('draft'), { target: { value: 'PPR trade filter' } });
  fireEvent.click(screen.getByText('Other tab'));
  fireEvent.click(screen.getByText('Return'));
  expect(screen.getByLabelText('draft').value).toBe('PPR trade filter');
  expect(screen.getByText('?compare=1,2')).toBeTruthy();
  app.unmount();
  render(<SessionApp />);
  expect(screen.getByLabelText('draft').value).toBe('PPR trade filter');
});
it('keeps drafts in memory when WebView storage is unavailable', () => {
  const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  render(<SessionApp />);
  fireEvent.change(screen.getByLabelText('draft'), { target: { value: 'retained' } });
  fireEvent.click(screen.getByText('Other tab'));
  fireEvent.click(screen.getByText('Return'));
  expect(screen.getByLabelText('draft').value).toBe('retained');
  blocked.mockRestore();
});
it('auth back arrow falls back to home for a direct entry', () => {
  window.history.replaceState({ idx: 0 }, '');
  const Icon = () => <span />;
  render(<MemoryRouter initialEntries={['/login']}><Routes>
    <Route path="/login" element={<AuthLayout showBack icon={Icon} title="Login">Form</AuthLayout>} />
    <Route path="/" element={<div>Home fallback</div>} />
  </Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByText('Home fallback')).toBeTruthy();
});
