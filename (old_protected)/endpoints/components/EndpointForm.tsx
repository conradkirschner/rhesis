'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  Alert,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  FormHelperText,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
  readProjectsProjectsGetOptions,
  createEndpointEndpointsPostMutation,
} from '@/api-client/@tanstack/react-query.gen';

import type {
  Endpoint,
  JsonInput,
  EndpointProtocol,
  EndpointEnvironment,
  CreateEndpointEndpointsPostData, ProjectDetail,
} from '@/api-client/types.gen';

import {
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

const ICON_MAP: Record<string, React.ComponentType> = {
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
            backgroundColor: 'grey.100',
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

const PROTOCOLS: readonly EndpointProtocol[] = ['REST'];
const ENVIRONMENTS: readonly EndpointEnvironment[] = [
  'production',
  'staging',
  'development',
];
const METHODS: readonly Endpoint['method'][] = ['POST'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
      <div
          role="tabpanel"
          hidden={value !== index}
          id={`endpoint-tabpanel-${index}`}
          aria-labelledby={`endpoint-tab-${index}`}
          {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
  );
}

type JsonMap = Record<string, JsonInput>;

interface FormData {
  name: string;
  description: string;
  protocol: EndpointProtocol;
  url: string;
  environment: EndpointEnvironment;
  config_source: Endpoint['config_source'];
  response_format: Endpoint['response_format'];
  method: Endpoint['method'];
  endpoint_path: string;
  project_id: string;
  request_headers?: string;
  request_body_template?: string;
  response_mappings?: string;
}

const editorWrapperStyle = {
  border: '1px solid rgba(0, 0, 0, 0.23)',
  borderRadius: '4px',
  '&:hover': {
    border: '1px solid rgba(0, 0, 0, 0.87)',
  },
  '&:focus-within': {
    border: '2px solid',
    borderColor: 'primary.main',
    margin: '-1px',
  },
};

const getProjectIcon = (project: ProjectDetail) => {
  if (project?.icon && ICON_MAP[project.icon]) {
    const IconComponent = ICON_MAP[project.icon];
    return <IconComponent />;
  }
  return <SmartToyIcon />;
};

function parseJsonMap(input?: string): JsonMap | undefined {
  if (!input || !input.trim()) return undefined;
  try {
    const parsed = JSON.parse(input) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: JsonMap = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        out[k] = v as JsonInput;
      }
      return out;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function parseStringMap(input?: string): Record<string, string> | undefined {
  if (!input || !input.trim()) return undefined;
  try {
    const parsed = JSON.parse(input) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === 'string') out[k] = v;
        else if (v === null || typeof v === 'undefined') {
        } else {
          out[k] = JSON.stringify(v);
        }
      }
      return out;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export default function EndpointForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<string>('');
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    protocol: 'REST',
    url: '',
    environment: 'development',
    config_source: 'manual',
    response_format: 'json',
    method: 'POST',
    endpoint_path: '',
    project_id: '',
  });

  const {
    data: projects = [],
    isLoading: loadingProjects,
  } = useQuery({
    ...readProjectsProjectsGetOptions({
      query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
    select: (data) => data.data
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const validateUrl = (val: string): boolean => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  };

  function handleChange<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleJsonChange(field: keyof FormData, value: string) {
    try {
      if (value.trim()) {
        JSON.parse(value);
      }
      setFormData(prev => ({ ...prev, [field]: value }));
      setError(null);
    } catch {
      setError(`Invalid JSON in ${String(field)}`);
    }
  }

  const createMutation = useMutation({
    ...createEndpointEndpointsPostMutation(),
    onSuccess: () => {
      router.push('/endpoints');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.url || !validateUrl(formData.url)) {
      setUrlError('Please enter a valid URL');
      return;
    }
    setUrlError(null);

    if (!formData.project_id) {
      setError('Please select a project');
      return;
    }

    const body: CreateEndpointEndpointsPostData['body'] = {
      name: formData.name,
      description: formData.description,
      protocol: formData.protocol,
      url: formData.url,
      environment: formData.environment,
      config_source: formData.config_source,
      response_format: formData.response_format,
      method: formData.method,
      endpoint_path: formData.endpoint_path,
      project_id: formData.project_id || undefined,
      request_headers: parseStringMap(formData.request_headers),
      response_mappings: parseStringMap(formData.response_mappings),
      request_body_template: parseJsonMap(formData.request_body_template),
    };

    try {
      await createMutation.mutateAsync({ body });
    } catch (err) {
      setError(
          err instanceof Error ? err.message : 'Failed to create endpoint'
      );
    }
  };

  return (
      <form onSubmit={handleSubmit}>
        <Card>
          {/* Action buttons row */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => router.push('/endpoints')}>
                Cancel
              </Button>
              <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={projects.length === 0 && !loadingProjects}
              >
                Create Endpoint
              </Button>
            </Box>
          </Box>

          {/* Tabs row */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={currentTab}
                onChange={handleTabChange}
                aria-label="endpoint configuration tabs"
            >
              <Tab label="Basic Information" />
              <Tab label="Request Settings" />
              <Tab label="Response Settings" />
              <Tab label="Test Connection" />
            </Tabs>
          </Box>

          {/* Basic Information Tab */}
          <TabPanel value={currentTab} index={0}>
            <Grid container spacing={3}>
              {/* General Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  General Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        required
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        helperText="A unique name to identify this endpoint"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={e => handleChange('description', e.target.value)}
                        multiline
                        rows={1}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Request Configuration */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Request Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="URL"
                        name="url"
                        value={formData.url}
                        onChange={e => handleChange('url', e.target.value)}
                        required
                        error={Boolean(urlError)}
                        helperText={urlError ?? ' '}
                        placeholder="https://api.example.com"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Protocol</InputLabel>
                      <Select
                          name="protocol"
                          value={formData.protocol}
                          onChange={e =>
                              handleChange('protocol', e.target.value as EndpointProtocol)
                          }
                          label="Protocol"
                          required
                      >
                        {PROTOCOLS.map(protocol => (
                            <MenuItem key={protocol} value={protocol}>
                              {protocol}
                            </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Method</InputLabel>
                      <Select
                          name="method"
                          value={formData.method}
                          onChange={e =>
                              handleChange('method', e.target.value as Endpoint['method'])
                          }
                          label="Method"
                      >
                        {METHODS.map(method => (
                            method ? <MenuItem key={method} value={method}>
                              {method}
                            </MenuItem> : <></>
                        ))}
                      </Select>
                    </FormControl>
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
                    {projects.length === 0 && !loadingProjects ? (
                        <Alert
                            severity="warning"
                            action={
                              <Button
                                  color="inherit"
                                  size="small"
                                  component="a"
                                  href="/projects/create-new"
                              >
                                Create Project
                              </Button>
                            }
                        >
                          No projects available. Please create a project first.
                        </Alert>
                    ) : (
                        <FormControl
                            fullWidth
                            required
                            error={Boolean(error && !formData.project_id)}
                        >
                          <InputLabel id="project-select-label">
                            Select Project
                          </InputLabel>
                          <Select
                              labelId="project-select-label"
                              id="project-select"
                              name="project_id"
                              value={formData.project_id}
                              onChange={e =>
                                  handleChange('project_id', e.target.value)
                              }
                              label="Select Project"
                              disabled={loadingProjects}
                              required
                              renderValue={selected => {
                                const selectedProject = projects.find(
                                    p => p.id === selected
                                );
                                return (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {selectedProject && (
                                          <Box
                                              sx={{
                                                mr: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                              }}
                                          >
                                            {getProjectIcon(selectedProject)}
                                          </Box>
                                      )}
                                      {selectedProject?.name || 'No project selected'}
                                    </Box>
                                );
                              }}
                          >
                            {loadingProjects ? (
                                <MenuItem disabled>
                                  <CircularProgress size={20} sx={{ mr: 1 }} />
                                  Loading projects...
                                </MenuItem>
                            ) : (
                                projects.map(project => (
                                    <MenuItem key={project.id} value={project.id}>
                                      <ListItemIcon>
                                        {getProjectIcon(project)}
                                      </ListItemIcon>
                                      <ListItemText
                                          primary={project.name}
                                          secondary={project.description}
                                      />
                                    </MenuItem>
                                ))
                            )}
                          </Select>
                          {error && !formData.project_id && (
                              <FormHelperText error>
                                A project is required
                              </FormHelperText>
                          )}
                        </FormControl>
                    )}
                  </Grid>
                </Grid>
              </Grid>

              {/* Environment */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Environment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ToggleButtonGroup
                        value={formData.environment}
                        exclusive
                        onChange={(_e, newValue: EndpointEnvironment | null) => {
                          if (newValue !== null)
                            handleChange('environment', newValue);
                        }}
                        aria-label="environment selection"
                        sx={{
                          '& .MuiToggleButton-root.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': { backgroundColor: 'primary.dark' },
                          },
                        }}
                    >
                      {ENVIRONMENTS.map(env => (
                          <ToggleButton
                              key={env}
                              value={env}
                              sx={{
                                textTransform: 'capitalize',
                                '&.Mui-selected': { borderColor: 'primary.main' },
                                '&:hover': { backgroundColor: 'action.hover' },
                              }}
                          >
                            {env}
                          </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Request Settings Tab */}
          <TabPanel value={currentTab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Request Headers define key-value pairs for authentication and
                  other required headers.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Example:{' '}
                  <code>{`{
  "Authorization": "Bearer {API_KEY}",
  "x-api-key": "{API_KEY}",
  "Content-Type": "application/json"
}`}</code>
                </Typography>
                <Box sx={editorWrapperStyle}>
                  <Editor
                      height="200px"
                      defaultLanguage="json"
                      value={formData.request_headers}
                      onChange={value =>
                          handleJsonChange('request_headers', value || '')
                      }
                      options={{
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        folding: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        padding: { top: 8, bottom: 8 },
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                        },
                        fontSize: 14,
                        theme: 'light',
                      }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Request Body Template defines the structure of your request with
                  placeholders for dynamic values.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Example:{' '}
                  <code>{`{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "{user_input}"
    }
  ],
  "temperature": 0.7
}`}</code>
                </Typography>
                <Box sx={editorWrapperStyle}>
                  <Editor
                      height="300px"
                      defaultLanguage="json"
                      value={formData.request_body_template}
                      onChange={value =>
                          handleJsonChange('request_body_template', value || '')
                      }
                      options={{
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        folding: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        padding: { top: 8, bottom: 8 },
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                        },
                        fontSize: 14,
                        theme: 'light',
                      }}
                  />
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Response Settings Tab */}
          <TabPanel value={currentTab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Response Mappings define how to extract values from the API
                  response using JSONPath syntax.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Example:{' '}
                  <code>{'{ "output": "$.choices[0].message.content" }'}</code>
                </Typography>
                <Box sx={editorWrapperStyle}>
                  <Editor
                      height="200px"
                      defaultLanguage="json"
                      value={formData.response_mappings}
                      onChange={value =>
                          handleJsonChange('response_mappings', value || '')
                      }
                      options={{
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        folding: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        padding: { top: 8, bottom: 8 },
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                        },
                        fontSize: 14,
                        theme: 'light',
                      }}
                  />
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Test Connection Tab */}
          <TabPanel value={currentTab} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Test your endpoint configuration with sample data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter sample JSON data that matches your request template
                  structure
                </Typography>
                <Box sx={editorWrapperStyle}>
                  <Editor
                      height="200px"
                      defaultLanguage="json"
                      defaultValue={`{
  "input": "[place your input here]"
}`}
                      options={{
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        folding: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        padding: { top: 8, bottom: 8 },
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                        },
                        fontSize: 14,
                        theme: 'light',
                      }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <LoadingButton
                    variant="contained"
                    color="primary"
                    onClick={async () => {
                      setIsTestingEndpoint(true);
                      try {
                        await new Promise(resolve => setTimeout(resolve, 800)); // placeholder
                        setTestResponse(
                            JSON.stringify(
                                {
                                  success: true,
                                  message: 'Response from endpoint (sample)',
                                  data: { output: 'Sample response data' },
                                },
                                null,
                                2
                            )
                        );
                      } catch (err) {
                        setTestResponse(
                            JSON.stringify(
                                { success: false, error: (err as Error).message },
                                null,
                                2
                            )
                        );
                      } finally {
                        setIsTestingEndpoint(false);
                      }
                    }}
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
                            minimap: { enabled: false },
                            lineNumbers: 'on',
                            folding: true,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            readOnly: true,
                            padding: { top: 8, bottom: 8 },
                            scrollbar: {
                              vertical: 'visible',
                              horizontal: 'visible',
                            },
                            fontSize: 14,
                            theme: 'light',
                          }}
                      />
                    </Box>
                  </Grid>
              )}
            </Grid>
          </TabPanel>
        </Card>

        {error && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
        )}
      </form>
  );
}
