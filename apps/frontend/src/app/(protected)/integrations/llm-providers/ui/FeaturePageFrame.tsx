import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  CheckCircle,
  DeleteOutline,
  Psychology,
  AutoFixHigh,
  SmartToy,
  AcUnit,
} from '@mui/icons-material';
import { memo, useMemo, useState } from 'react';
import StepperHeader from './StepperHeader';
import ActionBar from './ActionBar';
import InlineLoader from './InlineLoader';
import ErrorBanner from './ErrorBanner';
import type {
  UiFeaturePageFrameProps,
  UiModelCard,
  UiProvider,
  UiConnectForm,
} from './types';

const ProviderIcon: React.FC<{ code?: string }> = ({ code }) => {
  switch (code) {
    case 'anthropic':
      return <Psychology fontSize="large" />;
    case 'cohere':
      return <AutoFixHigh fontSize="large" />;
    case 'mistral':
      return <AcUnit fontSize="large" />;
    default:
      return <SmartToy fontSize="large" />;
  }
};

function ModelGridCard({
  model,
  onDelete,
}: {
  model: UiModelCard;
  onDelete: (id: string) => void;
}) {
  return (
    <Card sx={{ height: '100%', position: 'relative' }} variant="outlined">
      <IconButton
        aria-label="delete-connection"
        data-test-id={`delete-model-${model.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(model.id);
        }}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
        }}
      >
        <DeleteOutline />
      </IconButton>

      <CardActionArea disableRipple sx={{ height: '100%', alignItems: 'stretch' }}>
        <CardContent sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <ProviderIcon code={model.icon} />
              <CheckCircle sx={{ color: 'success.main', fontSize: 16, mt: -1 }} />
            </Stack>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" noWrap>{model.name}</Typography>
              {model.description ? (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {model.description}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              Model: {model.modelName}
            </Typography>
            {model.keySuffix ? (
              <Typography variant="body2" color="text.secondary" noWrap>
                API Key: •••••{model.keySuffix}
              </Typography>
            ) : null}
          </Box>
        </CardContent>

        <Box sx={{ flexGrow: 1 }} />

        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="small"
            disableElevation
            disableRipple
            data-test-id="connected-badge"
            sx={{ textTransform: 'none', pointerEvents: 'none' }}
          >
            Connected
          </Button>
        </CardActions>
      </CardActionArea>
    </Card>
  );
}

function ProviderSelectionDialog({
  open,
  providers,
  onClose,
  onSelect,
}: {
  open: boolean;
  providers: readonly UiProvider[];
  onClose: () => void;
  onSelect: (providerId: string) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select LLM Provider</DialogTitle>
      <DialogContent dividers>
        {providers.length === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No providers available. Please try again later.
            </Typography>
          </Box>
        ) : (
          <List>
            {providers.map((p) => (
              <ListItemButton
                key={p.id}
                onClick={() => onSelect(p.id)}
                data-test-id={`provider-${p.code}`}
              >
                <ListItemIcon>
                  <ProviderIcon code={p.code} />
                </ListItemIcon>
                <ListItemText primary={p.label} secondary={p.code} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-test-id="cancel-provider-select">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function ConnectDialog({
  open,
  provider,
  onClose,
  onSubmit,
}: {
  open: boolean;
  provider: UiProvider | null;
  onClose: () => void;
  onSubmit: (form: UiConnectForm) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  // local form state
  const [connectionName, setConnectionName] = useState('');
  const [modelName, setModelName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const isCustom = provider?.code === 'vllm';
  const [customProviderLabel, setCustomProviderLabel] = useState('');

  const providerLabel = isCustom ? customProviderLabel : provider?.label ?? 'Provider';
  const providerIcon = provider?.code;

  const handleAddHeader = () => {
    const k = newHeaderKey.trim();
    const v = newHeaderValue.trim();
    if (k && v) {
      setCustomHeaders((prev) => ({ ...prev, [k]: v }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- creating new object without the removed key
    const { [key]: _, ...rest } = customHeaders;
    setCustomHeaders(rest);
  };

  const canSubmit =
    !!provider &&
    connectionName.trim().length > 0 &&
    modelName.trim().length > 0 &&
    endpoint.trim().length > 0 &&
    apiKey.trim().length > 0 &&
    (!isCustom || customProviderLabel.trim().length > 0);

  const resetForm = () => {
    setConnectionName('');
    setModelName('');
    setEndpoint('');
    setApiKey('');
    setNewHeaderKey('');
    setNewHeaderValue('');
    setCustomHeaders({});
    setCustomProviderLabel('');
  };

  const submit = async () => {
    if (!provider) return;
    setSubmitting(true);
    try {
      await onSubmit({
        providerTypeId: provider.id,
        providerLabel,
        providerIcon,
        connectionName,
        modelName,
        endpoint,
        apiKey,
        customHeaders,
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ProviderIcon code={provider?.code} />
          <Box>
            <Typography variant="h6">Connect to {providerLabel}</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your connection settings
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Basic Configuration
          </Typography>
          {isCustom ? (
            <Stack spacing={2}>
              <input
                aria-label="custom-provider-name"
                placeholder="Provider Name"
                value={customProviderLabel}
                onChange={(e) => setCustomProviderLabel(e.currentTarget.value)}
                data-test-id="custom-provider-name"
                style={{ padding: 12, borderRadius: 8, border: '1px solid var(--mui-palette-divider)' }}
              />
            </Stack>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <input
              aria-label="connection-name"
              placeholder="Connection Name"
              value={connectionName}
              onChange={(e) => setConnectionName(e.currentTarget.value)}
              data-test-id="connection-name"
              style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--mui-palette-divider)' }}
            />
            <input
              aria-label="model-name"
              placeholder="Model Name"
              value={modelName}
              onChange={(e) => setModelName(e.currentTarget.value)}
              data-test-id="model-name"
              style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--mui-palette-divider)' }}
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Connection Details
          </Typography>
          <input
            aria-label="api-endpoint"
            placeholder="API Endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.currentTarget.value)}
            data-test-id="api-endpoint"
            style={{ padding: 12, borderRadius: 8, border: '1px solid var(--mui-palette-divider)' }}
          />
          <input
            aria-label="api-key"
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.currentTarget.value)}
            data-test-id="api-key"
            type="password"
            style={{ padding: 12, borderRadius: 8, border: '1px solid var(--mui-palette-divider)' }}
          />

          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Custom Headers (Optional)
          </Typography>
          <Stack spacing={1}>
            {Object.entries(customHeaders).map(([k, v]) => (
              <Stack
                key={k}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  px: 2,
                  py: 1,
                }}
              >
                <Typography variant="body2">
                  <strong>{k}</strong>: {v}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveHeader(k)}
                  data-test-id={`remove-header-${k}`}
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <input
                aria-label="header-name"
                placeholder="Header Name"
                value={newHeaderKey}
                onChange={(e) => setNewHeaderKey(e.currentTarget.value)}
                data-test-id="header-name"
                style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--mui-palette-divider)' }}
              />
              <input
                aria-label="header-value"
                placeholder="Header Value"
                value={newHeaderValue}
                onChange={(e) => setNewHeaderValue(e.currentTarget.value)}
                data-test-id="header-value"
                style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--mui-palette-divider)' }}
              />
              <Button
                variant="outlined"
                startIcon={<AddRounded />}
                onClick={handleAddHeader}
                disabled={!newHeaderKey.trim() || !newHeaderValue.trim()}
                data-test-id="add-header"
              >
                Add
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-test-id="cancel-connect" disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={!canSubmit || submitting}
          data-test-id="submit-connect"
          startIcon={submitting ? <CircularProgress size={16} /> : undefined}
        >
          {submitting ? 'Connecting…' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmDeleteDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Model Connection</DialogTitle>
      <DialogContent dividers>
        <Typography>
          Are you sure you want to delete this model connection?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} data-test-id="cancel-delete">Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm} data-test-id="confirm-delete">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EmptyAddCard({ onAdd }: { onAdd: () => void }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        bgcolor: 'action.hover',
        '&:hover': { bgcolor: 'action.selected' },
      }}
    >
      <CardActionArea onClick={onAdd} data-test-id="add-provider-card" sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%' }}>
          <Stack spacing={1.5} alignItems="flex-start">
            <AddRounded fontSize="large" sx={{ color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              Add LLM
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect to a new LLM provider
            </Typography>
          </Stack>
        </CardContent>
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button fullWidth variant="outlined" data-test-id="add-provider-btn">
            Add Provider
          </Button>
        </CardActions>
      </CardActionArea>
    </Card>
  );
}

function Content({
  models,
  onDelete,
  onAdd,
}: {
  models: readonly UiModelCard[];
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <Grid container spacing={3}>
      {models.map((m) => (
        <Grid key={m.id} item xs={12} sm={6} md={4} lg={3}>
          <ModelGridCard model={m} onDelete={onDelete} />
        </Grid>
      ))}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <EmptyAddCard onAdd={onAdd} />
      </Grid>
    </Grid>
  );
}

function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <StepperHeader title={title} subtitle={subtitle} />
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}

function FeaturePageFrameImpl(props: UiFeaturePageFrameProps) {
  const {
    title,
    subtitle,
    loading,
    errorMessage,
    models,
    actions,
    providers,
    dialogs,
  } = props;

  const providersSorted = useMemo(
    () => [...providers].sort((a, b) => a.code.localeCompare(b.code)),
    [providers],
  );

  return (
    <Box sx={{ p: 3 }}>
      <Header title={title} subtitle={subtitle} />
      <ActionBar onAdd={actions.onAdd} />
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
      {loading ? (
        <InlineLoader />
      ) : (
        <Box sx={{ mt: 2 }}>
          <Content models={models} onDelete={dialogs.onRequestDelete} onAdd={actions.onAdd} />
        </Box>
      )}

      <ProviderSelectionDialog
        open={dialogs.selectOpen}
        onClose={dialogs.onCloseSelect}
        onSelect={dialogs.onSelectProvider}
        providers={providersSorted}
      />

      <ConnectDialog
        open={dialogs.connectOpen}
        onClose={dialogs.onCloseConnect}
        onSubmit={dialogs.onSubmitConnect}
        provider={dialogs.selectedProvider ?? null}
      />

      <ConfirmDeleteDialog
        open={dialogs.deleteOpen}
        onCancel={dialogs.onCloseDelete}
        onConfirm={dialogs.onConfirmDelete}
      />
    </Box>
  );
}

export default memo(FeaturePageFrameImpl);