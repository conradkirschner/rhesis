import { Stack, Button, Typography } from '@mui/material';
import { AddRounded } from '@mui/icons-material';
import type { UiConnectForm, UiProvider } from '../types';
import { useState } from 'react';

export default function StepConnectProvider({
  provider,
  onSubmit,
}: {
  provider: UiProvider;
  onSubmit: (form: UiConnectForm) => void;
}) {
  const [name, setName] = useState('');
  const [modelName, setModelName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');

  const canSubmit = name && modelName && endpoint && apiKey;

  return (
    <Stack spacing={2}>
      <Typography>Connect to {provider.label}</Typography>
      <input
        aria-label="connection-name"
        placeholder="Connection Name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />
      <input
        aria-label="model-name"
        placeholder="Model Name"
        value={modelName}
        onChange={(e) => setModelName(e.currentTarget.value)}
      />
      <input
        aria-label="endpoint"
        placeholder="API Endpoint"
        value={endpoint}
        onChange={(e) => setEndpoint(e.currentTarget.value)}
      />
      <input
        aria-label="api-key"
        placeholder="API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.currentTarget.value)}
      />
      <Button
        variant="contained"
        startIcon={<AddRounded />}
        onClick={() =>
          onSubmit({
            providerTypeId: provider.id,
            providerLabel: provider.label,
            providerIcon: provider.code,
            connectionName: name,
            modelName,
            endpoint,
            apiKey,
            customHeaders: {},
          })
        }
        disabled={!canSubmit}
      >
        Connect
      </Button>
    </Stack>
  );
}