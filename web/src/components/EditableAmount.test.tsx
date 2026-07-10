import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditableAmount } from './EditableAmount';

describe('EditableAmount', () => {
  it('shows the formatted value and enters edit mode on click', async () => {
    const user = userEvent.setup();
    render(<EditableAmount value={32000} onSave={vi.fn()} />);

    expect(screen.getByText('32,000')).toBeInTheDocument();
    await user.click(screen.getByText('32,000'));

    expect(screen.getByRole('textbox')).toHaveValue('32000');
  });

  it('saves the new value on Enter and exits edit mode', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditableAmount value={32000} onSave={onSave} />);

    await user.click(screen.getByText('32,000'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '40000{Enter}');

    expect(onSave).toHaveBeenCalledWith(40000);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('cancels on Escape without calling onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditableAmount value={32000} onSave={onSave} />);

    await user.click(screen.getByText('32,000'));
    await user.type(screen.getByRole('textbox'), '999{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows an error and stays in edit mode on non-numeric input', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditableAmount value={32000} onSave={onSave} />);

    await user.click(screen.getByText('32,000'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'abc{Enter}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('not a number')).toBeInTheDocument();
  });

  it('surfaces a rejected save as an error and keeps editing', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error('server exploded'));
    render(<EditableAmount value={32000} onSave={onSave} />);

    await user.click(screen.getByText('32,000'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '40000{Enter}');

    expect(await screen.findByText('server exploded')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
