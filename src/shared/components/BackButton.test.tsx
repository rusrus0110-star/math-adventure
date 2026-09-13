import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BackButton } from './BackButton';
import { SecondaryNavButton } from './SecondaryNavButton';

describe('BackButton', () => {
  it('shares secondary styling without giving forward navigation a back label or icon', () => {
    const back = renderToStaticMarkup(<MemoryRouter><BackButton to="/home" /></MemoryRouter>);
    const forward = renderToStaticMarkup(<MemoryRouter><SecondaryNavButton to="/parents" label="Elternbereich" icon="⚙" /></MemoryRouter>);
    expect(forward.match(/<a class="([^"]+)"/)?.[1]).toBe(back.match(/<a class="([^"]+)"/)?.[1]);
    expect(forward).toContain('href="/parents"');
    expect(forward).toContain('aria-hidden="true">⚙</span>');
    expect(forward).toContain('<span>Elternbereich</span>');
    expect(forward).not.toContain('Zurück');
    expect(forward).not.toContain('tabindex="-1"');
  });
  it('preserves link navigation with a visible label and decorative arrow', () => {
    const markup = renderToStaticMarkup(<MemoryRouter><BackButton to="/home" /></MemoryRouter>);
    expect(markup).toContain('<a ');
    expect(markup).toContain('href="/home"');
    expect(markup).toContain('<span>Zurück</span>');
    expect(markup).toContain('aria-hidden="true" focusable="false"');
    expect(markup).not.toContain('tabindex="-1"');
  });

  it('uses a native non-submit button and passes through the existing handler', () => {
    const onClick = vi.fn();
    const element = BackButton({ onClick });
    expect(element.props.onClick).toBe(onClick);
    element.props.onClick();
    expect(onClick).toHaveBeenCalledOnce();
    const markup = renderToStaticMarkup(element);
    expect(markup).toContain('<button ');
    expect(markup).toContain('type="button"');
    expect(markup).toContain('<span>Zurück</span>');
  });
});
