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
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
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

import BaseDrawer from '@/components/common/BaseDrawer';
import styles from '@/styles/ProjectEditDrawer.module.css';

import type { ProjectDetail, ProjectUpdate } from '@/api-client/types.gen';
import type { ProjectMeta } from '../types/project-ui';

type IconKey =
    | 'SmartToy'
    | 'Devices'
    | 'Web'
    | 'Storage'
    | 'Code'
    | 'DataObject'
    | 'Cloud'
    | 'Analytics'
    | 'ShoppingCart'
    | 'Terminal'
    | 'VideogameAsset'
    | 'Chat'
    | 'Psychology'
    | 'Dashboard'
    | 'Search'
    | 'AutoFixHigh'
    | 'PhoneIphone'
    | 'School'
    | 'Science'
    | 'AccountTree';

const PROJECT_ICONS: ReadonlyArray<{
  name: IconKey;
  component: React.ElementType;
  label: string;
}> = [
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
];

type Owner = NonNullable<ProjectDetail['owner']>;

export interface ProjectEditDrawerProps {
  open: boolean;
  onClose: () => void;

  project: ProjectDetail;

  meta?: ProjectMeta;

  /**
   * Persist handler.
   * Your parent should call the API with `updatedProject`,
   * and store `updatedMeta` wherever you keep UI meta.
   */
  onSave: (updatedProject: Partial<ProjectUpdate>, updatedMeta: ProjectMeta) => Promise<void>;

  users?: Owner[];

  usersLoading?: boolean;
}

interface FormState {
  name: string;
  description: string;
  owner_id?: string;
  // UI-only fields:
  environment?: ProjectMeta['environment'];
  useCase?: ProjectMeta['useCase'];
  icon: IconKey;
  tags: string[];
}

const IconSelector = ({
                        selectedIcon,
                        onChange,
                      }: {
  selectedIcon: IconKey;
  onChange: (icon: IconKey) => void;
}) => {
  return (
      <Box className={styles.iconSelectorContainer}>
        <Typography variant="subtitle1" gutterBottom className={styles.iconSelectorTitle}>
          Project Icon
        </Typography>
        <Paper variant="outlined" className={styles.iconSelectorPaper}>
          <ToggleButtonGroup
              value={selectedIcon}
              exclusive
              onChange={(_, newIcon: IconKey | null) => {
                if (newIcon) onChange(newIcon);
              }}
              aria-label="project icon"
              className={styles.toggleButtonGroup}
          >
            {PROJECT_ICONS.map((icon) => {
              const IconComponent = icon.component;
              return (
                  <ToggleButton
                      key={icon.name}
                      value={icon.name}
                      aria-label={icon.label}
                      className={styles.toggleButton}
                  >
                    <IconComponent fontSize="medium" />
                    <Typography variant="caption" noWrap className={styles.toggleButtonLabel}>
                      {icon.label}
                    </Typography>
                  </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Paper>
      </Box>
  );
};

export default function ProjectEditDrawer({
                                            open,
                                            onClose,
                                            project,
                                            meta,
                                            onSave,
                                            users,
                                            usersLoading = false,
                                          }: ProjectEditDrawerProps) {
  const initialForm: FormState = {
    name: project.name ?? '',
    description: project.description ?? '',
    owner_id: project.owner_id ?? project.owner?.id ?? undefined,
    environment: meta?.environment,
    useCase: meta?.useCase,
    icon: (meta?.icon as IconKey) ?? 'SmartToy',
    tags: meta?.tags ?? [],
  };

  const [form, setForm] = React.useState<FormState>(initialForm);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        name: project.name ?? '',
        description: project.description ?? '',
        owner_id: project.owner_id ?? project.owner?.id ?? undefined,
        environment: meta?.environment,
        useCase: meta?.useCase,
        icon: (meta?.icon as IconKey) ?? 'SmartToy',
        tags: meta?.tags ?? [],
      });
    }
  }, [open, project, meta]);

  const handleChange =
      <K extends keyof FormState>(key: K) =>
          (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setForm((prev) => ({ ...prev, [key]: e.target.value as FormState[K] }));
          };

  const handleSelect =
      <K extends keyof FormState>(key: K) =>
          (event: SelectChangeEvent) => {
            setForm((prev) => ({ ...prev, [key]: event.target.value as FormState[K] }));
          };

  const handleIconChange = (icon: IconKey) => {
    setForm((prev) => ({ ...prev, icon }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    setForm((prev) => ({ ...prev, tags }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedProject: Partial<ProjectUpdate> = {};
      if (form.name !== project.name) updatedProject.name = form.name;
      if (form.description !== project.description) updatedProject.description = form.description;
      if (form.owner_id !== project.owner_id) updatedProject.owner_id = form.owner_id;

      const updatedMeta: ProjectMeta = {
        environment: form.environment,
        useCase: form.useCase,
        icon: form.icon,
        tags: form.tags,
      };

      await onSave(updatedProject, updatedMeta);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
      <BaseDrawer open={open} onClose={onClose} title="Edit Project" loading={saving} onSave={handleSave}>
        {/* Owner */}
        <FormControl fullWidth>
          <InputLabel id="owner-label">Owner</InputLabel>
          <Select<string>
              labelId="owner-label"
              value={form.owner_id ?? ''}
              label="Owner"
              onChange={handleSelect('owner_id')}
              displayEmpty
              disabled={usersLoading || !users || users.length === 0}
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
        </FormControl>

        {/* Icon selection (UI-only) */}
        <IconSelector selectedIcon={form.icon} onChange={handleIconChange} />

        {/* Name */}
        <TextField fullWidth label="Project Name" value={form.name} onChange={handleChange('name')} required />

        {/* Description */}
        <TextField fullWidth label="Description" multiline rows={4} value={form.description} onChange={handleChange('description')} />

        {/* Environment (UI-only) */}
        <FormControl fullWidth>
          <InputLabel id="env-label">Environment</InputLabel>
          <Select<string>
              labelId="env-label"
              value={form.environment ?? ''}
              label="Environment"
              onChange={handleSelect('environment')}
          >
            <MenuItem value="development">Development</MenuItem>
            <MenuItem value="staging">Staging</MenuItem>
            <MenuItem value="production">Production</MenuItem>
          </Select>
        </FormControl>

        {/* Use Case (UI-only) */}
        <FormControl fullWidth>
          <InputLabel id="usecase-label">Use Case</InputLabel>
          <Select<string>
              labelId="usecase-label"
              value={form.useCase ?? ''}
              label="Use Case"
              onChange={handleSelect('useCase')}
          >
            <MenuItem value="chatbot">Chatbot</MenuItem>
            <MenuItem value="assistant">Assistant</MenuItem>
            <MenuItem value="advisor">Advisor</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        {/* Tags (UI-only) */}
        <TextField
            fullWidth
            label="Tags"
            value={form.tags.join(', ')}
            onChange={handleTagsChange}
            helperText="Separate tags with commas"
        />

        {/* Quick tags helper */}
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['nextjs', 'ai', 'demo'].map((t) => (
              <Chip
                  key={t}
                  label={`+ ${t}`}
                  size="small"
                  onClick={() =>
                      setForm((prev) => ({ ...prev, tags: Array.from(new Set([...prev.tags, t])) }))
                  }
              />
          ))}
        </Box>
      </BaseDrawer>
  );
}
