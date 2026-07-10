import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataExport } from './DataExport';

describe('DataExport', () => {
  it('links to the JSON backup endpoint with a download attribute', () => {
    render(<DataExport />);
    const link = screen.getByRole('link', { name: /Download backup/ });
    expect(link).toHaveAttribute('href', '/api/export');
    expect(link).toHaveAttribute('download');
  });

  it('links to the expenses CSV endpoint', () => {
    render(<DataExport />);
    const link = screen.getByRole('link', { name: /Export expenses/ });
    expect(link).toHaveAttribute('href', '/api/export/expenses.csv');
    expect(link).toHaveAttribute('download');
  });
});
