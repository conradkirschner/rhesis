'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

type ExpiryOption = '30' | '60' | '90' | 'custom' | 'never';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreateToken: (name: string, expiresInDays: number | null) => Promise<void>;
};

export default function CreateTokenModal({ open, onClose, onCreateToken }: Props) {
  const [name, setName] = useState('');
  const [expiryOption, setExpiryOption] = useState<ExpiryOption>('30');
  const [customDate, setCustomDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [submitting, setSubmitting] = useState(false);

  const minCustomDate = useMemo(() => dayjs().startOf('day').add(1, 'day'), []);

  const resetForm = useCallback(() => {
    setName('');
    setExpiryOption('30');
    setCustomDate(dayjs().add(1, 'day'));
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const computeExpiresInDays = useCallback((): number | null => {
    if (expiryOption === 'never') return null;
    if (expiryOption === 'custom') {
      if (!customDate) return null;
      const diff = customDate.startOf('day').diff(dayjs().startOf('day'), 'day');
      return Math.max(1, diff);
    }
    return parseInt(expiryOption, 10);
  }, [expiryOption, customDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (expiryOption === 'custom' && !customDate) return;

    try {
      setSubmitting(true);
      const expiresInDays = computeExpiresInDays();
      await onCreateToken(name.trim(), expiresInDays);
      handleClose();
    } catch {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleExpiryChange = (e: SelectChangeEvent<ExpiryOption>) => {
    setExpiryOption(e.target.value as ExpiryOption);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>Create New Token</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              label="Token Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              inputProps={{ 'data-test-id': 'token-name' }}
            />

            <FormControl fullWidth>
              <InputLabel id="token-expiration-label">Token Expiration</InputLabel>
              <Select
                labelId="token-expiration-label"
                value={expiryOption}
                label="Token Expiration"
                onChange={handleExpiryChange}
                inputProps={{ 'data-test-id': 'token-expiration' }}
              >
                <MenuItem value="30">30 days</MenuItem>
                <MenuItem value="60">60 days</MenuItem>
                <MenuItem value="90">90 days</MenuItem>
                <MenuItem value="custom">Custom date</MenuItem>
                <MenuItem value="never">Never expire</MenuItem>
              </Select>
            </FormControl>

            {expiryOption === 'custom' && (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Expiration Date"
                  value={customDate}
                  onChange={(newValue) => setCustomDate(newValue)}
                  minDate={minCustomDate}
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                      inputProps: { 'data-test-id': 'token-expiration-date' },
                    },
                  }}
                />
              </LocalizationProvider>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={submitting} data-test-id="cancel-create-token">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !name.trim()}
            data-test-id="submit-create-token"
          >
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}