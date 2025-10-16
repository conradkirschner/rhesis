'use client';

import * as React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import Link from 'next/link';
import PersonIcon from '@mui/icons-material/Person';
import styles from '@/styles/ProjectDetailsStep.module.css';

// Icons for selection
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

const ERROR_MESSAGES = {
  required: (field: string) => `${field} is required`,
};

const SPACING = {
  sectionTop: 3,
  betweenSections: 4,
  betweenFields: 2,
};

type FormErrors = {
  projectName: boolean;
  description: boolean;
  owner_id: boolean;
};

interface FormData {
  projectName: string;
  description: string;
  icon: string;
  owner_id?: string;
}

interface ProjectDetailsStepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
  userName: string;
  userImage: string;
  userId: string;
}

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

const IconSelector = ({
                        selectedIcon,
                        onChange,
                      }: {
  selectedIcon: string;
  onChange: (icon: string) => void;
}) => {
  return (
      <FormControl fullWidth className={styles.iconSelector}>
        <InputLabel id="project-icon-label">Project Icon</InputLabel>
        <Select<string>
            labelId="project-icon-label"
            value={selectedIcon || 'SmartToy'}
            label="Project Icon"
            onChange={(e: SelectChangeEvent) => onChange(e.target.value as string)}
        >
          {PROJECT_ICONS.map((icon) => {
            const IconComponent = icon.component;
            return (
                <MenuItem key={icon.name} value={icon.name}>
                  <Box className={styles.iconOption}>
                    <IconComponent fontSize="small" />
                    <Typography>{icon.label}</Typography>
                  </Box>
                </MenuItem>
            );
          })}
        </Select>
      </FormControl>
  );
};

export default function ProjectDetailsStep({
                                             formData,
                                             updateFormData,
                                             onNext,
                                             userName,
                                             userImage,
                                             userId,
                                           }: ProjectDetailsStepProps) {
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({
    projectName: false,
    description: false,
    owner_id: false,
  });
  const [attemptedSubmit, setAttemptedSubmit] = React.useState(false);

  React.useEffect(() => {
    if (!formData.owner_id) {
      updateFormData({ owner_id: userId });
    }
  }, [formData.owner_id, userId, updateFormData]);

  const owners = React.useMemo(
      () => [
        {
          id: userId,
          name: userName,
          email: undefined as string | undefined,
          picture: userImage,
        },
      ],
      [userId, userName, userImage]
  );

  const validateForm = () => {
    const newErrors: FormErrors = {
      projectName: !formData.projectName?.trim(),
      description: !formData.description?.trim(),
      owner_id: !formData.owner_id?.trim(),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (validateForm()) {
      try {
        setLoading(true);
        onNext();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });

    if (attemptedSubmit && (name === 'projectName' || name === 'description')) {
      setErrors((prev) => ({ ...prev, [name]: false } as FormErrors));
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    updateFormData({ owner_id: event.target.value as string });
    if (attemptedSubmit && errors.owner_id) {
      setErrors((prev) => ({ ...prev, owner_id: false }));
    }
  };

  const handleIconChange = (icon: string) => {
    updateFormData({ icon });
  };

  if (loading) {
    return (
        <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
            }}
        >
          <CircularProgress />
        </Box>
    );
  }

  return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: SPACING.sectionTop, width: '100%' }}>
        <Typography variant="h6" gutterBottom align="center">
          Enter Project Details
        </Typography>

        <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: SPACING.betweenFields * 2 }}
        >
          Please provide basic information about this project
        </Typography>

        <Grid container spacing={SPACING.betweenFields} sx={{ width: '100%' }}>
          {/* Owner Dropdown (current user only; keep Select to allow future multi-user support) */}
          <Grid item xs={12}>
            <FormControl fullWidth error={errors.owner_id && attemptedSubmit}>
              <InputLabel id="owner-label">Owner</InputLabel>
              <Select
                  labelId="owner-label"
                  value={formData.owner_id ?? ''}
                  label="Owner"
                  onChange={handleSelectChange}
                  renderValue={(selected) => {
                    const selectedUser = owners.find((u) => u.id === selected);
                    return selectedUser ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                              src={selectedUser.picture}
                              alt={selectedUser.name ?? selectedUser.email ?? 'Owner'}
                              sx={{ width: 24, height: 24 }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Typography>{selectedUser.name ?? selectedUser.email ?? selectedUser.id}</Typography>
                        </Box>
                    ) : null;
                  }}
              >
                {owners.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <ListItemAvatar>
                        <Avatar
                            src={user.picture}
                            alt={user.name ?? user.email ?? 'User'}
                            sx={{ width: 32, height: 32 }}
                        >
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={user.name ?? user.email ?? user.id} secondary={user.email} />
                    </MenuItem>
                ))}
              </Select>
              {errors.owner_id && attemptedSubmit && (
                  <Typography color="error" variant="caption">
                    {ERROR_MESSAGES.required('Owner')}
                  </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Icon Selector */}
          <Grid item xs={12}>
            <IconSelector selectedIcon={formData.icon} onChange={handleIconChange} />
          </Grid>

          {/* Project Name */}
          <Grid item xs={12}>
            <TextField
                fullWidth
                label="Project Name"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                required
                error={attemptedSubmit && errors.projectName}
                helperText={
                  attemptedSubmit && errors.projectName ? ERROR_MESSAGES.required('Project name') : ''
                }
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
                rows={4}
                error={attemptedSubmit && errors.description}
                helperText={
                  attemptedSubmit && errors.description ? ERROR_MESSAGES.required('Description') : ''
                }
            />
          </Grid>
        </Grid>

        <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: SPACING.betweenSections,
              width: '100%',
            }}
        >
          <Button variant="outlined" color="inherit" component={Link} href="/projects">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            Continue
          </Button>
        </Box>
      </Box>
  );
}
