'use client';

import * as React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  ListItemAvatar,
  ListItemText,
  Box,
  Typography,
  Stack,
  FormHelperText,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import PersonIcon from '@mui/icons-material/Person';
import BaseDrawer from '@/components/common/BaseDrawer';

// Icons
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

import type { ProjectDetail, ProjectUpdate } from '@/api-client/types.gen';
import type { ProjectMeta } from '../types/project-ui';

type Owner = NonNullable<ProjectDetail['owner']>;

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


export interface ProjectEditDrawerProps {
  open: boolean;
  onClose: () => void;

  // API object (server shape)
  project: ProjectDetail;

  // UI-only meta (client shape)
  meta?: ProjectMeta;

  /**
   * Persist handler: caller updates API with `updatedProject`
   * and stores UI meta (`updatedMeta`) on their side.
   */
  onSave: (
      updatedProject: Partial<ProjectUpdate>,
      updatedMeta: ProjectMeta
  ) => Promise<void>;

  // Optional owner selection data (parent-supplied)
  users?: Owner[];
  usersLoading?: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  owner_id?: string;
  is_active?: string;
  icon?: string;
  form?: string;
}

export default function EditDrawer({
                                     open,
                                     onClose,
                                     project,
                                     meta,
                                     onSave,
                                     users,
                                     usersLoading = false,
                                   }: ProjectEditDrawerProps) {
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formData, setFormData] = React.useState({
    name: project.name ?? '',
    description: project.description ?? '',
    owner_id: project.owner?.id ?? project.owner_id ?? '',
    is_active: Boolean(project.is_active),
    icon: (meta?.icon ?? project.icon ?? 'SmartToy') as string,
  });

  // Reset form data when project/meta changes while open
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: project.name ?? '',
        description: project.description ?? '',
        owner_id: project.owner?.id ?? project.owner_id ?? '',
        is_active: Boolean(project.is_active),
        icon: (meta?.icon ?? project.icon ?? 'SmartToy') as string,
      });
      setErrors({});
    }
  }, [project, meta, open]);

  // Handlers
  const handleTextChange =
      (field: 'name' | 'description') =>
          (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setFormData((prev) => ({ ...prev, [field]: event.target.value }));
            if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
          };

  // Correct MUI Select typing
  const handleSelectChange =
      (field: 'owner_id' | 'icon') =>
          (event: SelectChangeEvent<string>) => {
            setFormData((prev) => ({ ...prev, [field]: event.target.value }));
            if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
          };

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, is_active: event.target.checked }));
    if (errors.is_active) setErrors((prev) => ({ ...prev, is_active: undefined }));
  };

  const validateForm = React.useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    else if (formData.name.length > 100) newErrors.name = 'Project name must be less than 100 characters';

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!formData.owner_id || formData.owner_id.trim() === '') {
      newErrors.owner_id = 'Owner is required';
    }

    if (!formData.icon) newErrors.icon = 'Project icon is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSaveWrapper = React.useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare API update (snake_case as per API)
      const projectUpdate: Partial<ProjectUpdate> = {};
      if (formData.name !== project.name) projectUpdate.name = formData.name;
      if (formData.description !== project.description) projectUpdate.description = formData.description;
      if (formData.owner_id !== project.owner_id) projectUpdate.owner_id = formData.owner_id;
      if (Boolean(project.is_active) !== formData.is_active) projectUpdate.is_active = formData.is_active;

      // Prepare UI meta update (icon is UI-only here)
      const updatedMeta: ProjectMeta = { icon: formData.icon };

      await onSave(projectUpdate, updatedMeta);
      onClose();
    } catch (error) {
      // Generic form-level error
      setErrors((prev) => ({ ...prev, form: 'Failed to save. Please try again.' }));
    } finally {
      setLoading(false);
    }
  }, [formData, project, onSave, onClose, validateForm]);

  return (
      <BaseDrawer
          open={open}
          onClose={onClose}
          title="Edit Project"
          loading={loading}
          onSave={handleSaveWrapper}
          error={errors.form}
      >
        <Stack spacing={3}>
          {/* Owner */}
          <FormControl fullWidth error={!!errors.owner_id} disabled={usersLoading}>
            <InputLabel id="owner-label">Owner</InputLabel>
            <Select<string>
                labelId="owner-label"
                value={formData.owner_id}
                label="Owner"
                onChange={handleSelectChange('owner_id')}
                renderValue={(selected) => {
                  const selectedUser = (users ?? []).find((u) => u.id === String(selected));
                  return selectedUser ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            src={selectedUser.picture ?? undefined}
                            alt={selectedUser.name ?? selectedUser.email ?? 'Owner'}
                            sx={{ width: 24, height: 24 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Typography>{selectedUser.name ?? selectedUser.email}</Typography>
                      </Box>
                  ) : (
                      <Typography color="text.secondary">Select owner</Typography>
                  );
                }}
            >
              {(users ?? []).map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    <ListItemAvatar>
                      <Avatar
                          src={user.picture ?? undefined}
                          alt={user.name ?? user.email ?? 'User'}
                          sx={{ width: 32, height: 32 }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={user.name ?? user.email} secondary={user.email} />
                  </MenuItem>
              ))}
            </Select>
            {errors.owner_id && <FormHelperText>{errors.owner_id}</FormHelperText>}
          </FormControl>

          {/* Icon */}
          <FormControl fullWidth error={!!errors.icon}>
            <InputLabel id="project-icon-label">Project Icon</InputLabel>
            <Select<string>
                labelId="project-icon-label"
                value={formData.icon}
                label="Project Icon"
                onChange={handleSelectChange('icon')}
            >
              {PROJECT_ICONS.map((icon) => {
                const IconComponent = icon.component;
                return (
                    <MenuItem key={icon.name} value={icon.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconComponent fontSize="small" aria-hidden />
                        <Typography>{icon.label}</Typography>
                      </Box>
                    </MenuItem>
                );
              })}
            </Select>
            {errors.icon && <FormHelperText>{errors.icon}</FormHelperText>}
          </FormControl>

          {/* Name */}
          <TextField
              label="Project Name"
              value={formData.name}
              onChange={handleTextChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
          />

          {/* Description */}
          <TextField
              label="Description"
              value={formData.description}
              onChange={handleTextChange('description')}
              error={!!errors.description}
              helperText={errors.description}
              fullWidth
              multiline
              rows={4}
          />

          {/* Active */}
          <FormControlLabel
              control={<Switch checked={formData.is_active} onChange={handleToggleChange} color="primary" />}
              label="Active Project"
          />
        </Stack>
      </BaseDrawer>
  );
}
