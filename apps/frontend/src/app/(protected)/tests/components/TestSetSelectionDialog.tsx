'use client';

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';

// Generated SDK hook options
import { readTestSetsTestSetsGetOptions } from '@/api-client/@tanstack/react-query.gen';

// Minimal shape we actually need in this dialog
type TestSetOption = { id: string; name: string };

interface TestSetSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (testSet: TestSetOption) => Promise<void> | void;
}

export default function TestSetSelectionDialog({
                                                 open,
                                                 onClose,
                                                 onSelect,
                                               }: TestSetSelectionDialogProps) {
  const notifications = useNotifications();

  const [selected, setSelected] = React.useState<TestSetOption | null>(null);
  const [inputValue, setInputValue] = React.useState<string>('');
  const [serverSearch, setServerSearch] = React.useState<string>('');

  // Debounce input -> serverSearch (except when we explicitly force it)
  React.useEffect(() => {
    const handle = window.setTimeout(() => setServerSearch(inputValue), 500);
    return () => window.clearTimeout(handle);
  }, [inputValue]);

  // Build $filter for case-insensitive contains(name)
  const filter = React.useMemo(() => {
    if (!serverSearch.trim()) return undefined;
    const escaped = serverSearch.replace(/'/g, "''");
    return `contains(tolower(name), tolower('${escaped}'))`;
  }, [serverSearch]);

  // Query test sets (enabled only while dialog is open)
  const testSetsQuery = useQuery({
    ...readTestSetsTestSetsGetOptions({
      query: {
        sort_by: 'name',
        sort_order: 'asc',
        limit: 100,
        ...(filter ? { $filter: filter } : {}),
      },
    }),
    enabled: open,
  });

  // Surface fetch errors as a toast
  React.useEffect(() => {
    if (testSetsQuery.isError) {
      const msg =
          (testSetsQuery.error as Error | undefined)?.message ??
          'Failed to load test sets';
      notifications.show(msg, {
        severity: 'error',
        autoHideDuration: 6000,
      });
    }
  }, [testSetsQuery.isError, testSetsQuery.error, notifications]);

  // Map API rows to the option shape we use locally
  const options: TestSetOption[] = React.useMemo(() => {
    const rows = testSetsQuery.data?.data ?? [];
    return rows
        .map((r) => ({ id: r.id ?? '', name: (r.name ?? '').trim() }))
        .filter((o) => o.id && o.name);
  }, [testSetsQuery.data]);

  const loading = testSetsQuery.isFetching;

  const handleClose = () => {
    setSelected(null);
    setInputValue('');
    setServerSearch('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      await onSelect(selected);
      notifications.show(`Test successfully added to "${selected.name}"`, {
        severity: 'success',
        autoHideDuration: 4000,
      });
      handleClose();
    } catch (error) {
      const msg =
          error instanceof Error
              ? error.message
              : 'Failed to associate test with test set';
      // Special-case duplicate association text if present
      if (
          typeof msg === 'string' &&
          msg.includes('One or more tests are already associated with this test set')
      ) {
        notifications.show(
            'One or more tests are already associated with this test set',
            { severity: 'warning', autoHideDuration: 6000 },
        );
      } else {
        notifications.show(msg, { severity: 'error', autoHideDuration: 6000 });
      }
    }
  };

  return (
      <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '500px',
              m: 0,
            },
          }}
      >
        <DialogTitle>Select Test Set</DialogTitle>
        <DialogContent>
          <Autocomplete
              options={options}
              value={selected}
              inputValue={inputValue}
              onChange={(_, v) => setSelected(v)}
              onInputChange={(_, v, reason) => {
                setInputValue(v);
                // If cleared/reset, immediately reflect to server to show all
                if (v === '' || reason === 'reset') {
                  setServerSearch('');
                }
              }}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              filterOptions={(x) => x} // no client-side filtering; server does it
              loading={loading}
              renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
              )}
              renderInput={(params) => (
                  <TextField
                      {...params}
                      label="Search Test Sets"
                      placeholder="Type to search test sets..."
                      variant="outlined"
                      margin="normal"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                              {loading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                        ),
                      }}
                  />
              )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" disabled={!selected}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
  );
}
