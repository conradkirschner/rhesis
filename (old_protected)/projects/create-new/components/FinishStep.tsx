'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Avatar,
  ListItemIcon,
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

import { useQuery } from '@tanstack/react-query';
import { readUserUsersUserIdGetOptions } from '@/api-client/@tanstack/react-query.gen';

type IconKey =
    | 'SmartToy' | 'Psychology' | 'Chat' | 'Web' | 'Devices' | 'Code' | 'Terminal' | 'Storage'
    | 'DataObject' | 'Cloud' | 'Analytics' | 'Dashboard' | 'ShoppingCart' | 'VideogameAsset'
    | 'Search' | 'AutoFixHigh' | 'PhoneIphone' | 'School' | 'Science' | 'AccountTree';

const PROJECT_ICONS: Record<IconKey, React.ElementType> = {
  SmartToy: SmartToyIcon,
  Psychology: PsychologyIcon,
  Chat: ChatIcon,
  Web: WebIcon,
  Devices: DevicesIcon,
  Code: CodeIcon,
  Terminal: TerminalIcon,
  Storage: StorageIcon,
  DataObject: DataObjectIcon,
  Cloud: CloudIcon,
  Analytics: AnalyticsIcon,
  Dashboard: DashboardIcon,
  ShoppingCart: ShoppingCartIcon,
  VideogameAsset: VideogameAssetIcon,
  Search: SearchIcon,
  AutoFixHigh: AutoFixHighIcon,
  PhoneIphone: PhoneIphoneIcon,
  School: SchoolIcon,
  Science: ScienceIcon,
  AccountTree: AccountTreeIcon,
};

const ICON_LABELS: Record<IconKey, string> = {
  SmartToy: 'AI Assistant',
  Psychology: 'AI Brain',
  Chat: 'Chatbot',
  Web: 'Web App',
  Devices: 'Multi-platform',
  Code: 'Development',
  Terminal: 'CLI Tool',
  Storage: 'Database',
  DataObject: 'Data Model',
  Cloud: 'Cloud Service',
  Analytics: 'Analytics',
  Dashboard: 'Dashboard',
  ShoppingCart: 'E-commerce',
  VideogameAsset: 'Game',
  Search: 'Search Tool',
  AutoFixHigh: 'Automation',
  PhoneIphone: 'Mobile App',
  School: 'Education',
  Science: 'Research',
  AccountTree: 'Workflow',
};

interface FormData {
  projectName: string;
  description: string;
  icon: string;
  owner_id?: string;
}

interface FinishStepProps {
  formData: FormData;
  onComplete: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}
export default function FinishStep({
                                     formData,
                                     onComplete,
                                     onBack,
                                     isSubmitting = false,
                                   }: FinishStepProps) {
  const userQuery = useQuery({
    ...readUserUsersUserIdGetOptions({
      path: { user_id: (formData.owner_id ?? '') as string },
    }),
    enabled: Boolean(formData.owner_id),
  });

  const owner = (userQuery.data) ?? undefined;
  const loadingOwner = userQuery.isLoading;

  const iconKey: IconKey =
      (formData.icon as IconKey) in PROJECT_ICONS ? (formData.icon as IconKey) : 'SmartToy';
  const IconComponent = PROJECT_ICONS[iconKey];
  const iconLabel = ICON_LABELS[iconKey];

  return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h6" gutterBottom>Almost done!</Typography>
          <Typography variant="body1" color="text.secondary">
            Please review your project information before completing
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Project Information
          </Typography>

          <List disablePadding>
            {/* Owner */}
            <ListItem sx={{ py: 1 }}>
              {loadingOwner ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading owner details...</Typography>
                  </Box>
              ) : owner ? (
                  <>
                    <ListItemIcon>
                      <Avatar
                          src={owner.picture ?? undefined}
                          alt={owner.name ?? owner.email ?? 'Owner'}
                          sx={{ width: 32, height: 32 }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText primary="Owner" secondary={owner.name ?? owner.email} />
                  </>
              ) : (
                  <ListItemText primary="Owner" secondary={formData.owner_id ?? 'Not specified'} />
              )}
            </ListItem>
            <Divider component="li" />

            {/* Icon */}
            <ListItem sx={{ py: 1 }}>
              <ListItemIcon>
                <IconComponent aria-hidden="true" />
              </ListItemIcon>
              <ListItemText primary="Project Icon" secondary={iconLabel} />
            </ListItem>
            <Divider component="li" />

            {/* Name */}
            <ListItem sx={{ py: 1 }}>
              <ListItemText primary="Project Name" secondary={formData.projectName || '—'} />
            </ListItem>
            <Divider component="li" />

            {/* Description */}
            <ListItem sx={{ py: 1 }}>
              <ListItemText primary="Description" secondary={formData.description || '—'} />
            </ListItem>
          </List>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button onClick={onBack} disabled={isSubmitting} variant="outlined">
            Back
          </Button>
          <Button
              variant="contained"
              color="primary"
              onClick={onComplete}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'Creating Project...' : 'Create Project'}
          </Button>
        </Box>
      </Box>
  );
}
