'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import dynamic from 'next/dynamic';
import { LoadingButton } from '@mui/lab';
import { useQuery, useMutation } from '@tanstack/react-query';

import {
  readProjectsProjectsGetOptions,
  updateEndpointEndpointsEndpointIdPutMutation,
  invokeEndpointEndpointsEndpointIdInvokePostMutation,
} from '@/api-client/@tanstack/react-query.gen';

import type {
  Endpoint,
  Project,
  JsonInput,
  EndpointEnvironment,
  EndpointProtocol, UpdateEndpointEndpointsEndpointIdPutData,
} from '@/api-client/types.gen';

import {
  EditIcon,
  SaveIcon,
  CancelIcon,
  PlayArrowIcon,
  SmartToyIcon,
  DevicesIcon,
  WebIcon,
  StorageIcon,
  CodeIcon,
  DataObjectIcon,
  CloudIcon,
  AnalyticsIcon,
  ShoppingCartIcon,
  TerminalIcon,
  VideogameAssetIcon,
  ChatIcon,
  PsychologyIcon,
  DashboardIcon,
  SearchIcon,
  AutoFixHighIcon,
  PhoneIphoneIcon,
  SchoolIcon,
  ScienceIcon,
  AccountTreeIcon,
} from '@/components/icons';
import { useNotifications } from '@/components/common/NotificationContext';

const PROTOCOLS = ['REST'] as const;
const ENVIRONMENTS = ['production', 'staging', 'development'] as const;
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const ICON_MAP: Record<string, React.ElementType> = {
  SmartToy: SmartToyIcon,
  Devices: DevicesIcon,
  Web: WebIcon,
  Storage: StorageIcon,
  Code: CodeIcon,
  DataObject: DataObjectIcon,
  Cloud: CloudIcon,
  Analytics: AnalyticsIcon,
  ShoppingCart: ShoppingCartIcon,
  Terminal: TerminalIcon,
  VideogameAsset: VideogameAssetIcon,
  Chat: ChatIcon,
  Psychology: PsychologyIcon,
  Dashboard: DashboardIcon,
  Search: SearchIcon,
  AutoFixHigh: AutoFixHighIcon,
  PhoneIphone: PhoneIphoneIcon,
  School: SchoolIcon,
  Science: ScienceIcon,
  AccountTree: AccountTreeIcon,
};

const getProjectIcon = (project: Project) => {
  const Cmp = ICON_MAP[project.icon ?? ''] ?? SmartToyIcon;
  return <Cmp />;
};

const getEnvironmentColor = (): 'default' => 'default';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
      <div role="tabpanel" hidden={value !== index} id={`endpoint-tabpanel-${index}`} {...other}>
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
  );
}

const editorWrapperStyle = {
  border: '1px solid rgba(0, 0, 0, 0.23)',
  borderRadius: '4px',
};

interface EndpointDetailProps {
  endpoint: Endpoint;
}

type JsonObject = { [k: string]: JsonInput };

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
      <Box
          sx={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 0, 0, 0.23)',
            borderRadius: '4px',
            backgroundColor: 'action.hover',
          }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading editor...
          </Typography>
        </Box>
      </Box>
  ),
});

export default function EndpointDetail({ endpoint: initialEndpoint }: EndpointDetailProps) {
  const notifications = useNotifications();

  const [endpoint, setEndpoint] = useState<Endpoint>(initialEndpoint);
  const [currentTab, setCurrentTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Partial<Endpoint>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [testResponse, setTestResponse] = useState<string>('');
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [testInput, setTestInput] = useState<string>(`{
  "input": "[place your input here]"
}`);

  // -------- Projects query (generated options; v5 single-arg) --------
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    ...readProjectsProjectsGetOptions({
      query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
  });

  const projectsById = useMemo<Record<string, Project>>(() => {
    const list = Array.isArray(projectsData) ? projectsData : [];
    const map: Record<string, Project> = {};
    for (const p of list) {
      if (p && p.id) map[p.id] = p;
    }
    return map;
  }, [projectsData]);

  // -------- Update mutation (generated; v5 single-arg) --------
  const updateMutation = useMutation({
    ...updateEndpointEndpointsEndpointIdPutMutation(),
    onSuccess: (updated: Endpoint) => {
      setEndpoint(updated);
      setIsEditing(false);
      setEditedValues({});
      notifications.show('Endpoint updated successfully', { severity: 'success' });
    },
    onError: (err: Error) => {
      notifications.show(`Failed to update endpoint: ${err.message}`, { severity: 'error' });
    },
  });

  // -------- Invoke mutation (generated; v5 single-arg) --------
  const invokeMutation = useMutation({
    ...invokeEndpointEndpointsEndpointIdInvokePostMutation(),
    onSuccess: (data: JsonInput) => {
      setTestResponse(JSON.stringify(data, null, 2));
    },
    onError: (err: Error) => {
      setTestResponse(JSON.stringify({ success: false, error: err.message }, null, 2));
    },
  });

  const handleTabChange = (_evt: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedValues(endpoint);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedValues({});
  };

  function handleChange<K extends keyof Endpoint>(field: K, value: Endpoint[K]) {
    setEditedValues(prev => ({ ...prev, [field]: value }));
  }

  const handleProtocolChange = (e: SelectChangeEvent) => {
    handleChange('protocol', e.target.value as EndpointProtocol);
  };

  const handleEnvironmentChange = (e: SelectChangeEvent) => {
    handleChange('environment', e.target.value as EndpointEnvironment);
  };

  const handleMethodChange = (e: SelectChangeEvent) => {
    // `Endpoint['method']` is typically a string union in your types
    handleChange('method', e.target.value as Endpoint['method']);
  };

  const handleJsonChange = (field: keyof Endpoint, value: string) => {
    try {
      const parsed = JSON.parse(value);
      // For editable JSON fields we accept any JSON value (object/array/primitive)
      handleChange(field, parsed as Endpoint[typeof field]);
    } catch {
      // Keep raw text if parsing fails so user can fix it
      handleChange(field, value as Endpoint[typeof field]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        path: { endpoint_id: endpoint.id },
        body: editedValues as UpdateEndpointEndpointsEndpointIdPutData['body'],
      };
      await updateMutation.mutateAsync(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTestingEndpoint(true);
    try {
      const parsed = JSON.parse(testInput);

      // Enforce the exact shape expected by the generated type:
      // body: { [key: string]: JsonInput }
      if (
          parsed === null ||
          Array.isArray(parsed) ||
          typeof parsed !== 'object'
      ) {
        setTestResponse(JSON.stringify({ success: false, error: 'Test input must be a JSON object (key/value map).' }, null, 2));
        return;
      }

      // Lightweight runtime validation to ensure values are JSON-compatible.
      // (Your generated JsonInput already represents valid JSON values.)
      const body: JsonObject = parsed as JsonObject;

      const payload = {
        path: { endpoint_id: endpoint.id },
        body,
      };

      await invokeMutation.mutateAsync(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setTestResponse(JSON.stringify({ success: false, error: msg }, null, 2));
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  return (
      <Paper elevation={2} sx={{ mb: 4 }}>
        <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pr: 2,
            }}
        >
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="endpoint configuration tabs">
            <Tab label="Basic Information" />
            <Tab label="Request Settings" />
            <Tab label="Response Settings" />
            <Tab label="Test Connection" />
          </Tabs>
          {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button startIcon={<CancelIcon />} variant="outlined" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </Box>
          ) : (
              <Button startIcon={<EditIcon />} variant="outlined" onClick={handleEdit}>
                Edit
              </Button>
          )}
        </Box>

        {/* Basic Information */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Basic Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  {isEditing ? (
                      <TextField
                          fullWidth
                          label="Name"
                          value={editedValues.name ?? ''}
                          onChange={(e) => handleChange('name', e.target.value as Endpoint['name'])}
                      />
                  ) : (
                      <>
                        <Typography variant="subtitle2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1">{endpoint.name}</Typography>
                      </>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {isEditing ? (
                      <TextField
                          fullWidth
                          label="Description"
                          value={editedValues.description ?? ''}
                          onChange={(e) => handleChange('description', e.target.value as Endpoint['description'])}
                          multiline
                          rows={1}
                      />
                  ) : (
                      <>
                        <Typography variant="subtitle2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">{endpoint.description || 'No description provided'}</Typography>
                      </>
                  )}
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Request Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  {isEditing ? (
                      <TextField
                          fullWidth
                          label="URL"
                          value={editedValues.url ?? ''}
                          onChange={(e) => handleChange('url', e.target.value as Endpoint['url'])}
                      />
                  ) : (
                      <>
                        <Typography variant="subtitle2" color="text.secondary">
                          URL
                        </Typography>
                        <Typography variant="body1">{endpoint.url}</Typography>
                      </>
                  )}
                </Grid>

                <Grid item xs={12} md={3}>
                  {isEditing ? (
                      <FormControl fullWidth>
                        <InputLabel>Protocol</InputLabel>
                        <Select
                            value={(editedValues.protocol ?? endpoint.protocol) as string}
                            label="Protocol"
                            onChange={handleProtocolChange}
                        >
                          {PROTOCOLS.map((protocol) => (
                              <MenuItem key={protocol} value={protocol}>
                                {protocol}
                              </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                  ) : (
                      <>
                        <Typography variant="subtitle2" color="text.secondary">
                          Protocol
                        </Typography>
                        <Typography variant="body1">{endpoint.protocol}</Typography>
                      </>
                  )}
                </Grid>

                <Grid item xs={12} md={3}>
                  {isEditing ? (
                      <FormControl fullWidth>
                        <InputLabel>Method</InputLabel>
                        <Select
                            value={(editedValues.method ?? endpoint.method) as string}
                            label="Method"
                            onChange={handleMethodChange}
                        >
                          {METHODS.map((method) => (
                              <MenuItem key={method} value={method}>
                                {method}
                              </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                  ) : (
                      <>
                        <Typography variant="subtitle2" color="text.secondary">
                          Method
                        </Typography>
                        <Typography variant="body1">{endpoint.method}</Typography>
                      </>
                  )}
                </Grid>
              </Grid>
            </Grid>

            {/* Project Selection */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Project
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {isEditing ? (
                      <FormControl fullWidth>
                        <InputLabel>Project</InputLabel>
                        <Select
                            value={editedValues.project_id ?? ''}
                            label="Project"
                            onChange={(e) => handleChange('project_id', e.target.value as Endpoint['project_id'])}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {loadingProjects ? (
                              <MenuItem disabled>
                                <CircularProgress size={20} />
                                <Box component="span" sx={{ ml: 1 }}>
                                  Loading projects...
                                </Box>
                              </MenuItem>
                          ) : (
                              Object.values(projectsById).map((project) => (
                                  <MenuItem key={project.id} value={project.id}>
                                    <ListItemIcon>{getProjectIcon(project)}</ListItemIcon>
                                    <ListItemText primary={project.name} secondary={project.description} />
                                  </MenuItem>
                              ))
                          )}
                        </Select>
                      </FormControl>
                  ) : (
                      <>
                        {endpoint.project_id ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {projectsById[endpoint.project_id] && (
                                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                    {getProjectIcon(projectsById[endpoint.project_id])}
                                  </Box>
                              )}
                              <Typography variant="body1">
                                {projectsById[endpoint.project_id]?.name || 'Loading project...'}
                              </Typography>
                            </Box>
                        ) : (
                            <Typography variant="body1">No project assigned</Typography>
                        )}
                      </>
                  )}
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              {isEditing ? (
                  <FormControl fullWidth>
                    <InputLabel>Environment</InputLabel>
                    <Select
                        value={(editedValues.environment ?? endpoint.environment) as string}
                        label="Environment"
                        onChange={handleEnvironmentChange}
                    >
                      {ENVIRONMENTS.map((env) => (
                          <MenuItem key={env} value={env}>
                            {env}
                          </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
              ) : (
                  <>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Environment
                    </Typography>
                    <Chip
                        label={endpoint.environment}
                        color={getEnvironmentColor()}
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                    />
                  </>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Request Settings */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Request Headers
              </Typography>
              <Box sx={editorWrapperStyle}>
                <Editor
                    height="200px"
                    defaultLanguage="json"
                    value={JSON.stringify(
                        isEditing ? editedValues.request_headers : endpoint.request_headers ?? {},
                        null,
                        2
                    )}
                    onChange={(value) => handleJsonChange('request_headers', value ?? '')}
                    options={{
                      readOnly: !isEditing,
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Request Body Template
              </Typography>
              <Box sx={editorWrapperStyle}>
                <Editor
                    height="300px"
                    defaultLanguage="json"
                    value={JSON.stringify(
                        isEditing ? editedValues.request_body_template : endpoint.request_body_template ?? {},
                        null,
                        2
                    )}
                    onChange={(value) => handleJsonChange('request_body_template', value ?? '')}
                    options={{
                      readOnly: !isEditing,
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Response Settings */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Response Mappings
              </Typography>
              <Box sx={editorWrapperStyle}>
                <Editor
                    height="200px"
                    defaultLanguage="json"
                    value={JSON.stringify(
                        isEditing ? editedValues.response_mappings : endpoint.response_mappings ?? {},
                        null,
                        2
                    )}
                    onChange={(value) => handleJsonChange('response_mappings', value ?? '')}
                    options={{
                      readOnly: !isEditing,
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Test Connection */}
        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Test your endpoint configuration with sample data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter sample JSON data that matches your request template structure
              </Typography>
              <Box sx={editorWrapperStyle}>
                <Editor
                    height="200px"
                    defaultLanguage="json"
                    value={testInput}
                    onChange={(value) => setTestInput(value ?? '')}
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      folding: true,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <LoadingButton
                  variant="contained"
                  color="primary"
                  onClick={handleTest}
                  loading={isTestingEndpoint}
                  loadingPosition="start"
                  startIcon={<PlayArrowIcon />}
              >
                Test Endpoint
              </LoadingButton>
            </Grid>

            {testResponse && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Response
                  </Typography>
                  <Box sx={editorWrapperStyle}>
                    <Editor
                        height="200px"
                        defaultLanguage="json"
                        value={testResponse}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          lineNumbers: 'on',
                          folding: true,
                          scrollBeyondLastLine: false,
                        }}
                    />
                  </Box>
                </Grid>
            )}
          </Grid>
        </TabPanel>
      </Paper>
  );
}
