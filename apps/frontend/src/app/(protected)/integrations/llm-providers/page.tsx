'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Stack,
} from '@mui/material';
import {
  SiOpenai,
  SiGoogle,
  SiHuggingface,
  SiOllama,
  SiReplicate,
} from '@icons-pack/react-simple-icons';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AnthropicIcon from '@mui/icons-material/Psychology';
import CohereLogo from '@mui/icons-material/AutoFixHigh';
import MistralIcon from '@mui/icons-material/AcUnit';

import { DeleteIcon, AddIcon } from '@/components/icons';
import { DeleteModal } from '@/components/common/DeleteModal';
import { useSession } from 'next-auth/react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  // Queries
  readTypeLookupsTypeLookupsGetOptions,
  readModelsModelsGetOptions,
  // Mutations
  createModelModelsPostMutation,
  deleteModelModelsModelIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

import type {
  TypeLookup,
  Model,
  ModelCreate,
} from '@/api-client/types.gen';

/* ----------------------------- Icons by provider ---------------------------- */

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  anthropic: <AnthropicIcon sx={{ fontSize: (t) => t.iconSizes.large }} />,
  cohere: <CohereLogo sx={{ fontSize: (t) => t.iconSizes.large }} />,
  google: <SiGoogle className="h-8 w-8" />,
  groq: <SmartToyIcon sx={{ fontSize: (t) => t.iconSizes.large }} />,
  huggingface: <SiHuggingface className="h-8 w-8" />,
  meta: <SmartToyIcon sx={{ fontSize: (t) => t.iconSizes.large }} />,
  mistral: <MistralIcon sx={{ fontSize: (t) => t.iconSizes.large }} />,
  ollama: <SiOllama className="h-8 w-8" />,
  openai: <SiOpenai className="h-8 w-8" />,
  perplexity: <SmartToyIcon sx={{ fontSize: (t) => t.iconSizes.large }} />,
  replicate: <SiReplicate className="h-8 w-8" />,
  together: <SmartToyIcon sx={{ fontSize: (t) => t.iconSizes.large }} />,
  vllm: <SmartToyIcon sx={{ fontSize: (t) => t.iconSizes.large }} />,
};

/* ----------------------------- Select Provider ------------------------------ */

interface ProviderSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectProvider: (provider: TypeLookup) => void;
  providers: TypeLookup[];
}

function ProviderSelectionDialog({
                                   open,
                                   onClose,
                                   onSelectProvider,
                                   providers,
                                 }: ProviderSelectionDialogProps) {
  if (!providers || providers.length === 0) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle>Select LLM Provider</DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No providers available. Please try again later.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Close</Button>
          </DialogActions>
        </Dialog>
    );
  }

  const sorted = [...providers].sort((a, b) =>
      a.type_value.localeCompare(b.type_value),
  );

  return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Select LLM Provider</DialogTitle>
        <DialogContent>
          <List>
            {sorted.map((provider) => {
              const icon =
                  PROVIDER_ICONS[provider.type_value] ?? (
                      <SmartToyIcon sx={{ fontSize: (t) => t.iconSizes.large }} />
                  );
              return (
                  <ListItemButton
                      key={provider.id}
                      onClick={() => onSelectProvider(provider)}
                      sx={{
                        borderRadius: (t) => t.shape.borderRadius * 0.25,
                        my: 0.5,
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                  >
                    <ListItemIcon>{icon}</ListItemIcon>
                    <ListItemText
                        primary={provider.description || provider.type_value}
                        secondary={provider.description || ''}
                    />
                  </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
  );
}

/* ---------------------------- Connect Provider ------------------------------ */

interface ConnectionDialogProps {
  open: boolean;
  provider: TypeLookup | null;
  onClose: () => void;
  onConnect: (payload: ModelCreate) => Promise<void>;
}

function ConnectionDialog({
                            open,
                            provider,
                            onClose,
                            onConnect,
                          }: ConnectionDialogProps) {
  const [name, setName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [modelName, setModelName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomProvider = provider?.type_value === 'vllm';

  // Reset form when opening for a provider
  useEffect(() => {
    if (provider) {
      setName('');
      setProviderName('');
      setModelName('');
      setEndpoint('');
      setApiKey('');
      setCustomHeaders({});
      setNewHeaderKey('');
      setNewHeaderValue('');
      setError(null);
    }
  }, [provider]);

  const handleAddHeader = () => {
    const key = newHeaderKey.trim();
    const val = newHeaderValue.trim();
    if (key && val) {
      setCustomHeaders((prev) => ({ ...prev, [key]: val }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    setCustomHeaders((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !name || !modelName || !endpoint || !apiKey) return;

    setLoading(true);
    setError(null);
    try {
      const request_headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...customHeaders,
      };

      const payload: ModelCreate = {
        name,
        description: `${
            isCustomProvider ? providerName : provider.description || provider.type_value
        } Connection`,
        icon: provider.type_value,
        model_name: modelName,
        endpoint,
        key: apiKey,
        request_headers,
        // Use provider lookup id if your backend expects the relation:
        provider_type_id: provider.id,
      };

      await onConnect(payload);
      onClose();
    } catch (err) {
      setError(
          err instanceof Error ? err.message : 'Failed to connect to provider',
      );
    } finally {
      setLoading(false);
    }
  };

  const providerIcon =
      PROVIDER_ICONS[provider?.type_value || ''] ?? (
          <SmartToyIcon sx={{ fontSize: (t) => t.iconSizes.medium }} />
      );

  const displayName = isCustomProvider
      ? 'Custom Provider'
      : provider?.description || provider?.type_value || 'Provider';

  return (
      <Dialog
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: (t) => t.shape.borderRadius * 0.5 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {providerIcon}
            <Box>
              <Typography variant="h6">Connect to {displayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                Configure your connection settings below
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, py: 2 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
            )}

            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                Basic Configuration
              </Typography>

              {isCustomProvider && (
                  <TextField
                      label="Provider Name"
                      fullWidth
                      required
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      helperText="A descriptive name for your custom LLM provider or deployment"
                  />
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                    label="Connection Name"
                    fullWidth
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    helperText="A unique name to identify this connection"
                />
                <TextField
                    label="Model Name"
                    fullWidth
                    required
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    helperText={
                      isCustomProvider
                          ? 'The model identifier for your deployment'
                          : 'The specific model to use from this provider'
                    }
                />
              </Stack>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'primary.main', mt: 1 }}>
                Connection Details
              </Typography>

              <TextField
                  label="API Endpoint"
                  fullWidth
                  required
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  helperText={
                    isCustomProvider
                        ? "The full URL of your model's API endpoint"
                        : 'The API endpoint URL provided by your LLM provider'
                  }
              />

              <TextField
                  label="API Key"
                  fullWidth
                  required
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  helperText={
                    isCustomProvider
                        ? 'Authentication key for your deployment (if required)'
                        : "Your API key from the provider's dashboard"
                  }
              />

              <Stack spacing={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>
                  Custom Headers (Optional)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add any additional HTTP headers required for your API calls. Authorization is included automatically.
                </Typography>

                {Object.entries(customHeaders).length > 0 && (
                    <Stack spacing={1}>
                      {Object.entries(customHeaders).map(([key, value]) => (
                          <Paper
                              key={key}
                              variant="outlined"
                              sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: 'grey.50',
                              }}
                          >
                            <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 120 }}>
                                {key}:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {value}
                              </Typography>
                            </Box>
                            <IconButton size="small" onClick={() => handleRemoveHeader(key)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                      ))}
                    </Stack>
                )}

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
                    <TextField
                        label="Header Name"
                        fullWidth
                        value={newHeaderKey}
                        onChange={(e) => setNewHeaderKey(e.target.value)}
                    />
                    <TextField
                        label="Header Value"
                        fullWidth
                        value={newHeaderValue}
                        onChange={(e) => setNewHeaderValue(e.target.value)}
                    />
                    <Button
                        variant="outlined"
                        onClick={handleAddHeader}
                        disabled={!newHeaderKey.trim() || !newHeaderValue.trim()}
                        sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                        startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={onClose} disabled={loading} size="large">
              Cancel
            </Button>
            <Button
                type="submit"
                variant="contained"
                disabled={
                    !provider ||
                    !name ||
                    !modelName ||
                    !endpoint ||
                    !apiKey ||
                    (isCustomProvider && !providerName) ||
                    loading
                }
                size="large"
                sx={{ minWidth: 120 }}
            >
              {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    Connecting...
                  </Box>
              ) : (
                  'Connect'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
  );
}

/* --------------------------------- Page ------------------------------------ */

export default function LLMProvidersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [selectedProvider, setSelectedProvider] = useState<TypeLookup | null>(null);
  const [providerSelectionOpen, setProviderSelectionOpen] = useState(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);

  /* ---------------------------- Queries (v5) ---------------------------- */

  const providersQuery = useQuery({
    ...readTypeLookupsTypeLookupsGetOptions({
      query: { $filter: "type_name eq 'ProviderType'" },
    }),
    enabled: !!session?.session_token,
  });

  const modelsQuery = useQuery({
    ...readModelsModelsGetOptions(),
    enabled: !!session?.session_token,
  });

  const providerTypes: TypeLookup[] = useMemo(
      () => (providersQuery.data as { data?: TypeLookup[] } | undefined)?.data ?? [],
      [providersQuery.data],
  );

  const connectedModels: Model[] = useMemo(
      () => (modelsQuery.data as { data?: Model[] } | undefined)?.data ?? [],
      [modelsQuery.data],
  );

  const loading = providersQuery.isLoading || modelsQuery.isLoading;
  const error =
      (providersQuery.error && providersQuery.error.message) ||
      (modelsQuery.error && modelsQuery.error.message) ||
      null;

  /* --------------------------- Mutations (v5) --------------------------- */

  const createModel = useMutation({
    ...createModelModelsPostMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: readModelsModelsGetOptions().queryKey });
    },
  });

  const deleteModel = useMutation({
    ...deleteModelModelsModelIdDeleteMutation(),
    onSuccess: () => {
      voidqueryClient.invalidateQueries({ queryKey: readModelsModelsGetOptions().queryKey });
    },
  });

  /* ------------------------------ Handlers ------------------------------ */

  const handleAddLLM = () => {
    setProviderSelectionOpen(true);
  };

  const handleDeleteClick = (model: Model, e: React.MouseEvent) => {
    e.stopPropagation();
    setModelToDelete(model);
    setDeleteDialogOpen(true);
  };

  /* -------------------------------- Render ------------------------------ */

  return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            LLM Providers
          </Typography>
          <Typography color="text.secondary">
            Connect to leading AI providers to power your evaluation and testing workflows.
          </Typography>
          {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
          )}
        </Box>

        {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
        ) : (
            <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  },
                  gap: 3,
                  '& > *': { minHeight: '200px', display: 'flex' },
                }}
            >
              {connectedModels.map((model) => (
                  <Paper
                      key={model.id}
                      sx={{
                        p: 3,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        minHeight: 'inherit',
                      }}
                  >
                    <IconButton
                        size="small"
                        onClick={(e) => handleDeleteClick(model, e)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: 'error.main',
                          '&:hover': { backgroundColor: 'error.light', color: 'error.main' },
                        }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {PROVIDER_ICONS[model.icon || 'custom'] ?? (
                            <SmartToyIcon sx={{ fontSize: (t) => t.iconSizes.large }} />
                        )}
                        <CheckCircleIcon sx={{ ml: -1, mt: -2, fontSize: 16, color: 'success.main' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{model.name}</Typography>
                        <Typography color="text.secondary" variant="body2">
                          {model.description}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 1, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Model: {model.model_name}
                      </Typography>
                      {model.key && (
                          <Typography variant="body2" color="text.secondary">
                            API Key: •••••{model.key.slice(-4)}
                          </Typography>
                      )}
                    </Box>

                    <Box sx={{ mt: 'auto' }}>
                      <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          size="small"
                          disableElevation
                          disableRipple
                          sx={{
                            textTransform: 'none',
                            borderRadius: (t) => t.shape.borderRadius * 0.375,
                            pointerEvents: 'none',
                            cursor: 'default',
                          }}
                      >
                        Connected
                      </Button>
                    </Box>
                  </Paper>
              ))}

              {/* Add LLM Card */}
              <Paper
                  sx={{
                    p: 3,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'action.hover',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: 'inherit',
                    '&:hover': { bgcolor: 'action.selected', transform: 'translateY(-2px)' },
                  }}
                  onClick={handleAddLLM}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <AddIcon sx={{ fontSize: (t) => t.iconSizes.large, color: 'grey.500' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" color="text.secondary">
                      Add LLM
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Connect to a new LLM provider
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 'auto' }}>
                  <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ textTransform: 'none', borderRadius: (t) => t.shape.borderRadius * 0.375 }}
                  >
                    Add Provider
                  </Button>
                </Box>
              </Paper>
            </Box>
        )}

        <ProviderSelectionDialog
            open={providerSelectionOpen}
            onClose={() => setProviderSelectionOpen(false)}
            onSelectProvider={(p) => {
              setSelectedProvider(p);
              setProviderSelectionOpen(false);
              setConnectionDialogOpen(true);
            }}
            providers={providerTypes}
        />

        <ConnectionDialog
            open={connectionDialogOpen}
            provider={selectedProvider}
            onClose={() => {
              setConnectionDialogOpen(false);
              setSelectedProvider(null);
            }}
            onConnect={async (payload) => {
              await createModel.mutateAsync({ body: payload });
            }}
        />

        <DeleteModal
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setModelToDelete(null);
            }}
            onConfirm={async () => {
              if (!modelToDelete) return;
              await deleteModel.mutateAsync({ path: { model_id: modelToDelete.id } });
              setDeleteDialogOpen(false);
              setModelToDelete(null);
            }}
            itemType="model connection"
            itemName={modelToDelete?.name}
            title="Delete Model Connection"
        />
      </Box>
  );
}
