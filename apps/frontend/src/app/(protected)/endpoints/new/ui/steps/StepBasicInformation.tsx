'use client';

import * as React from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  ListItemIcon,
  ListItemText,
  FormHelperText,
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  Devices as DevicesIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  DataObject as DataObjectIcon,
  Cloud as CloudIcon,
  Analytics as AnalyticsIcon,
  ShoppingCart as ShoppingCartIcon,
  Terminal as TerminalIcon,
  SportsEsports as SportsEsportsIcon,
  Chat as ChatIcon,
  Psychology as PsychologyIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  AutoFixHigh as AutoFixHighIcon,
  PhoneIphone as PhoneIphoneIcon,
  School as SchoolIcon,
  Science as ScienceIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import type { UiStepBasicInformationProps } from '../types';

const ICON_MAP = {
  SmartToy: <SmartToyIcon />,
  Devices: <DevicesIcon />,
  Web: <LanguageIcon />,
  Storage: <StorageIcon />,
  Code: <CodeIcon />,
  DataObject: <DataObjectIcon />,
  Cloud: <CloudIcon />,
  Analytics: <AnalyticsIcon />,
  ShoppingCart: <ShoppingCartIcon />,
  Terminal: <TerminalIcon />,
  VideogameAsset: <SportsEsportsIcon />,
  Chat: <ChatIcon />,
  Psychology: <PsychologyIcon />,
  Dashboard: <DashboardIcon />,
  Search: <SearchIcon />,
  AutoFixHigh: <AutoFixHighIcon />,
  PhoneIphone: <PhoneIphoneIcon />,
  School: <SchoolIcon />,
  Science: <ScienceIcon />,
  AccountTree: <AccountTreeIcon />,
} as const;

export default function StepBasicInformation({
  name,
  description,
  url,
  urlError,
  protocol,
  method,
  environment,
  environments,
  protocols,
  methods,
  projects,
  projectId,
  onChange,
}: UiStepBasicInformationProps) {
  const projectError = !projectId;

  return (
    <Card sx={{ p: 3 }}>
      <Grid container spacing={3}>
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
                value={name}
                onChange={(e) => onChange('name', e.target.value)}
                helperText="A unique name to identify this endpoint"
                inputProps={{ 'data-test-id': 'name-input' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={description}
                onChange={(e) => onChange('description', e.target.value)}
                inputProps={{ 'data-test-id': 'description-input' }}
              />
            </Grid>
          </Grid>
        </Grid>

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
                value={url}
                onChange={(e) => onChange('url', e.target.value)}
                required
                error={Boolean(urlError)}
                helperText={urlError ?? ' '}
                placeholder="https://api.example.com"
                inputProps={{ 'data-test-id': 'url-input' }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Protocol</InputLabel>
                <Select
                  value={protocol}
                  label="Protocol"
                  onChange={(e) => onChange('protocol', e.target.value as typeof protocol)}
                  inputProps={{ 'data-test-id': 'protocol-select' }}
                >
                  {protocols.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  value={method}
                  label="Method"
                  onChange={(e) => onChange('method', e.target.value as typeof method)}
                  inputProps={{ 'data-test-id': 'method-select' }}
                >
                  {methods.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Project
          </Typography>
          <FormControl fullWidth required error={projectError}>
            <InputLabel id="project-select-label">Select Project</InputLabel>
            <Select
              labelId="project-select-label"
              id="project-select"
              value={projectId}
              label="Select Project"
              onChange={(e) => onChange('project_id', e.target.value as string)}
              inputProps={{ 'data-test-id': 'project-select' }}
              renderValue={(selected) => {
                const selectedProject = projects.find((p) => p.id === selected);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      {selectedProject?.icon && ICON_MAP[selectedProject.icon as keyof typeof ICON_MAP]}
                    </Box>
                    {selectedProject?.name ?? 'No project selected'}
                  </Box>
                );
              }}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <ListItemIcon>
                    {p.icon && ICON_MAP[p.icon as keyof typeof ICON_MAP]}
                  </ListItemIcon>
                  <ListItemText primary={p.name} secondary={p.description ?? ''} />
                </MenuItem>
              ))}
            </Select>
            {projectError && <FormHelperText error>A project is required</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Environment
          </Typography>
          <ToggleButtonGroup
            value={environment}
            exclusive
            onChange={(_e, val: typeof environment | null) => {
              if (val) onChange('environment', val);
            }}
            aria-label="environment selection"
            sx={{
              '& .MuiToggleButton-root.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { backgroundColor: 'primary.dark' },
              },
            }}
            data-test-id="environment-toggle"
          >
            {environments.map((env) => (
              <ToggleButton key={env} value={env} sx={{ textTransform: 'capitalize' }}>
                {env}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Grid>
      </Grid>
    </Card>
  );
}