'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  Grid2 as Grid,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Avatar,
  Stack,
  FormHelperText,
} from '@mui/material';
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

import type { UiProjectFormFields, UiStepOverviewProps } from '../types';

const ICONS = [
  { value: 'SmartToy', label: 'AI Assistant', Icon: SmartToyIcon },
  { value: 'Psychology', label: 'AI Brain', Icon: PsychologyIcon },
  { value: 'Chat', label: 'Chatbot', Icon: ChatIcon },
  { value: 'Web', label: 'Web App', Icon: WebIcon },
  { value: 'Devices', label: 'Multi-platform', Icon: DevicesIcon },
  { value: 'Code', label: 'Development', Icon: CodeIcon },
  { value: 'Terminal', label: 'CLI Tool', Icon: TerminalIcon },
  { value: 'Storage', label: 'Database', Icon: StorageIcon },
  { value: 'DataObject', label: 'Data Model', Icon: DataObjectIcon },
  { value: 'Cloud', label: 'Cloud Service', Icon: CloudIcon },
  { value: 'Analytics', label: 'Analytics', Icon: AnalyticsIcon },
  { value: 'Dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { value: 'ShoppingCart', label: 'E-commerce', Icon: ShoppingCartIcon },
  { value: 'VideogameAsset', label: 'Game', Icon: VideogameAssetIcon },
  { value: 'Search', label: 'Search Tool', Icon: SearchIcon },
  { value: 'AutoFixHigh', label: 'Automation', Icon: AutoFixHighIcon },
  { value: 'PhoneIphone', label: 'Mobile App', Icon: PhoneIphoneIcon },
  { value: 'School', label: 'Education', Icon: SchoolIcon },
  { value: 'Science', label: 'Research', Icon: ScienceIcon },
  { value: 'AccountTree', label: 'Workflow', Icon: AccountTreeIcon },
] as const;

function renderIcon(value: string) {
  const entry = ICONS.find((i) => i.value === value) ?? ICONS[0];
  const I = entry.Icon;
  return <I fontSize="small" aria-hidden />;
}

export default function StepOverview({ isEditing, fields, users, errors, onChange }: UiStepOverviewProps) {
  const onFieldChange = <K extends keyof UiProjectFormFields>(key: K, value: UiProjectFormFields[K]) => {
    onChange({ ...fields, [key]: value });
  };

  const selectedUser = users.find((u) => u.id === fields.ownerId);

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {isEditing ? (
              <Stack spacing={2}>
                <TextField
                  label="Project Name"
                  value={fields.name}
                  onChange={(e) => onFieldChange('name', e.target.value)}
                  error={Boolean(errors?.name)}
                  helperText={errors?.name}
                  fullWidth
                  required
                  inputProps={{ 'data-test-id': 'field-name' }}
                />

                <TextField
                  label="Description"
                  value={fields.description}
                  onChange={(e) => onFieldChange('description', e.target.value)}
                  error={Boolean(errors?.description)}
                  helperText={errors?.description}
                  fullWidth
                  multiline
                  rows={4}
                  inputProps={{ 'data-test-id': 'field-description' }}
                />

                <TextField
                  label="Owner ID"
                  value={fields.ownerId}
                  onChange={(e) => onFieldChange('ownerId', e.target.value)}
                  error={Boolean(errors?.ownerId)}
                  helperText={errors?.ownerId}
                  fullWidth
                  inputProps={{ 'data-test-id': 'field-owner-id' }}
                />

                <FormControl fullWidth error={Boolean(errors?.icon)}>
                  <InputLabel id="icon-label">Project Icon</InputLabel>
                  <Select
                    labelId="icon-label"
                    value={fields.icon}
                    label="Project Icon"
                    onChange={(e) => onFieldChange('icon', e.target.value)}
                    inputProps={{ 'data-test-id': 'field-icon' }}
                  >
                    {ICONS.map((it) => (
                      <MenuItem key={it.value} value={it.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {renderIcon(it.value)}
                          <Typography>{it.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors?.icon ? <FormHelperText>{errors.icon}</FormHelperText> : null}
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={fields.isActive}
                      onChange={(e) => onFieldChange('isActive', e.target.checked)}
                      inputProps={{ 'data-test-id': 'field-is-active' }}
                      color="primary"
                    />
                  }
                  label="Active Project"
                />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="h6">{fields.name}</Typography>
                {fields.description ? <Typography color="text.secondary">{fields.description}</Typography> : null}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Owner:
                  </Typography>
                  <Avatar
                    src={selectedUser?.picture ?? undefined}
                    alt={selectedUser?.name ?? selectedUser?.email ?? 'Owner'}
                    sx={{ width: 24, height: 24 }}
                  >
                    <PersonIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="body2">
                    {selectedUser?.name ?? selectedUser?.email ?? fields.ownerId}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Icon:
                  </Typography>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    {renderIcon(fields.icon)}
                    <Typography variant="body2">{fields.icon}</Typography>
                  </Box>
                </Stack>

                <Typography variant="body2">Status: {fields.isActive ? 'Active' : 'Inactive'}</Typography>
              </Stack>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'background.paper',
                }}
              >
                {renderIcon(fields.icon)}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Project ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {fields.ownerId ? `${fields.ownerId.slice(0, 6)}…` : '—'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}