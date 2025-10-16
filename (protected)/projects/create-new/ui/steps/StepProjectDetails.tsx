'use client';

import * as React from 'react';
import {
  Avatar,
  Box,
  FormControl,
  Grid,
  InputLabel,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import PersonIcon from '@mui/icons-material/Person';

import SmartToyIcon from '@mui/icons-material/SmartToy';
import DevicesIcon from '@mui/icons-material/Devices';
import WebIcon from '@mui/icons-material/Web';
import StorageIcon from '@mui/icons-material/Storage';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CloudIcon from '@mui/icons-material/Cloud';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TerminalIcon from '@mui/icons-material/Terminal';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import ChatIcon from '@mui/icons-material/Chat';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import type { UiProjectDetailsStepProps } from '../types';

const PROJECT_ICONS = [
  { name: 'SmartToy', component: SmartToyIcon, label: 'AI Assistant' },
  { name: 'Psychology', component: PsychologyIcon, label: 'AI Brain' },
  { name: 'Chat', component: ChatIcon, label: 'Chatbot' },
  { name: 'Web', component: WebIcon, label: 'Web App' },
  { name: 'Devices', component: DevicesIcon, label: 'Multi-platform' },
  { name: 'Code', component: CodeIcon, label: 'Development' },
  { name: 'Terminal', component: TerminalIcon, label: 'CLI Tool' },
  { name: 'Storage', component: StorageIcon, label: 'Database' },
  { name: 'DataObject', component: DataObjectIcon, label: 'Data Model' },
  { name: 'Cloud', component: CloudIcon, label: 'Cloud Service' },
  { name: 'Analytics', component: AnalyticsIcon, label: 'Analytics' },
  { name: 'Dashboard', component: DashboardIcon, label: 'Dashboard' },
  { name: 'ShoppingCart', component: ShoppingCartIcon, label: 'E-commerce' },
  { name: 'VideogameAsset', component: VideogameAssetIcon, label: 'Game' },
  { name: 'Search', component: SearchIcon, label: 'Search Tool' },
  { name: 'AutoFixHigh', component: AutoFixHighIcon, label: 'Automation' },
  { name: 'PhoneIphone', component: PhoneIphoneIcon, label: 'Mobile App' },
  { name: 'School', component: SchoolIcon, label: 'Education' },
  { name: 'Science', component: ScienceIcon, label: 'Research' },
  { name: 'AccountTree', component: AccountTreeIcon, label: 'Workflow' },
] as const;

export default function StepProjectDetails({ owners, form, onFormChange }: UiProjectDetailsStepProps) {
  const [attempted, setAttempted] = React.useState(false);

  const setForm = (patch: Partial<typeof form>) => onFormChange(patch);

  const onIconChange = (icon: string) => setForm({ icon });

  const onOwnerChange = (event: SelectChangeEvent<string>) => {
    setForm({ ownerId: event.target.value as string });
  };

  const onInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.currentTarget;
    setForm({ [name]: value } as Partial<typeof form>);
    if (!attempted) setAttempted(true);
  };

  const errors = {
    projectName: attempted && !form.projectName.trim(),
    description: attempted && !form.description.trim(),
    ownerId: attempted && !form.ownerId.trim(),
  } as const;

  return (
    <Box sx={{ mt: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom align="center">
        Enter Project Details
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Please provide basic information about this project
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth error={errors.ownerId}>
            <InputLabel id="owner-label">Owner</InputLabel>
            <Select
              labelId="owner-label"
              value={form.ownerId}
              label="Owner"
              onChange={onOwnerChange}
              data-test-id="owner-select"
              renderValue={(selected) => {
                const u = owners.find((o) => o.id === selected);
                return u ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={u.picture} alt={u.name ?? u.email ?? 'Owner'} sx={{ width: 24, height: 24 }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography>{u.name ?? u.email ?? u.id}</Typography>
                  </Box>
                ) : null;
              }}
            >
              {owners.map((u) => (
                <MenuItem key={u.id} value={u.id} data-test-id={`owner-option-${u.id}`}>
                  <ListItemAvatar>
                    <Avatar src={u.picture} alt={u.name ?? u.email ?? 'User'} sx={{ width: 32, height: 32 }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={u.name ?? u.email ?? u.id} secondary={u.email ?? undefined} />
                </MenuItem>
              ))}
            </Select>
            {errors.ownerId ? (
              <Typography color="error" variant="caption">
                Owner is required
              </Typography>
            ) : null}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="project-icon-label">Project Icon</InputLabel>
            <Select
              labelId="project-icon-label"
              value={form.icon || 'SmartToy'}
              label="Project Icon"
              onChange={(e: SelectChangeEvent) => onIconChange(e.target.value as string)}
              data-test-id="icon-select"
            >
              {PROJECT_ICONS.map((icon) => {
                const Icon = icon.component;
                return (
                  <MenuItem key={icon.name} value={icon.name} data-test-id={`icon-${icon.name}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon fontSize="small" />
                      <Typography>{icon.label}</Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Project Name"
            name="projectName"
            value={form.projectName}
            onChange={onInput}
            required
            error={errors.projectName}
            helperText={errors.projectName ? 'Project name is required' : ''}
            inputProps={{ 'data-test-id': 'project-name-input' }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={form.description}
            onChange={onInput}
            required
            multiline
            rows={4}
            error={errors.description}
            helperText={errors.description ? 'Description is required' : ''}
            inputProps={{ 'data-test-id': 'project-description-input' }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}