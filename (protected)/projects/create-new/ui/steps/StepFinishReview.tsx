'use client';

import * as React from 'react';
import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
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

import type { UiFinishStepProps } from '../types';

type IconKey =
  | 'SmartToy' | 'Psychology' | 'Chat' | 'Web' | 'Devices' | 'Code' | 'Terminal' | 'Storage'
  | 'DataObject' | 'Cloud' | 'Analytics' | 'Dashboard' | 'ShoppingCart' | 'VideogameAsset'
  | 'Search' | 'AutoFixHigh' | 'PhoneIphone' | 'School' | 'Science' | 'AccountTree';

const ICONS: Record<IconKey, React.ElementType> = {
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

export default function StepFinishReview({ form, owner, isOwnerLoading }: UiFinishStepProps) {
  const k = (form.icon in ICONS ? form.icon : 'SmartToy') as IconKey;
  const Icon = ICONS[k];
  const iconLabel = ICON_LABELS[k];

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
          <ListItem sx={{ py: 1 }}>
            {isOwnerLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography>Loading owner details...</Typography>
              </Box>
            ) : owner ? (
              <>
                <ListItemIcon>
                  <Avatar src={owner.picture} alt={owner.name} sx={{ width: 32, height: 32 }}>
                    <PersonIcon />
                  </Avatar>
                </ListItemIcon>
                <ListItemText primary="Owner" secondary={owner.name} />
              </>
            ) : (
              <ListItemText primary="Owner" secondary="Not specified" />
            )}
          </ListItem>
          <Divider component="li" />

          <ListItem sx={{ py: 1 }}>
            <ListItemIcon>
              <Icon aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary="Project Icon" secondary={iconLabel} />
          </ListItem>
          <Divider component="li" />

          <ListItem sx={{ py: 1 }}>
            <ListItemText primary="Project Name" secondary={form.projectName || '—'} />
          </ListItem>
          <Divider component="li" />

          <ListItem sx={{ py: 1 }}>
            <ListItemText primary="Description" secondary={form.description || '—'} />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}