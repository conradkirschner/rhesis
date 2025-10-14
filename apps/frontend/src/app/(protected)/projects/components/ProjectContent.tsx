'use client';

import * as React from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Divider,
  Avatar,
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import type { Theme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

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

import { AVATAR_SIZES } from '@/constants/avatar-sizes';
import type { ProjectView } from '../types/project-ui';

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

const ICON_MAP: Record<IconKey, React.ElementType> = {
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

const getEnvironmentColor = (environment?: string | null): ChipProps['color'] => {
  if (!environment) return 'default';
  switch (environment.toLowerCase()) {
    case 'production':
      return 'success';
    case 'staging':
      return 'warning';
    case 'development':
      return 'info';
    default:
      return 'default';
  }
};

const iconSize =
    (fallback?: number) =>
        (t: Theme & { iconSizes?: { medium?: number } }): number | undefined =>
            t.iconSizes?.medium ?? fallback;

const getProjectIcon = (icon?: string | null, useCase?: string | null): React.ReactNode => {
  const key = icon as IconKey | undefined;
  if (key && ICON_MAP[key]) {
    const Cmp = ICON_MAP[key];
    return <Cmp />;
  }
  const uc = (useCase ?? '').toLowerCase();
  if (uc === 'chatbot') return <ChatIcon />;
  if (uc === 'assistant') return <PsychologyIcon />;
  if (uc === 'advisor') return <SmartToyIcon />;
  return <SmartToyIcon />;
};

export default function ProjectContent({ project }: { project: ProjectView }) {
  const { api, meta } = project;

  // API-sourced fields
  const name = api.name;
  const description = api.description ?? null;
  const isActive = api.is_active ?? null;
  const owner = api.owner ?? null;

  // UI/meta-sourced fields
  const environment = meta?.environment ?? null;
  const useCase = meta?.useCase ?? null;
  const icon = meta?.icon ?? null;
  const tags = meta?.tags ?? [];

  const createdAtStr = api.created_at ?? meta?.createdAt ?? null;
  const createdAtDate = createdAtStr ? new Date(createdAtStr) : null;

  const iconNode = getProjectIcon(icon, useCase);

  return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{iconNode}</Avatar>
              <Typography variant="h5">{name}</Typography>
              {isActive !== null && (
                  <Chip
                      icon={
                        isActive ? (
                            <CheckCircleIcon fontSize="small" />
                        ) : (
                            <DoNotDisturbAltIcon fontSize="small" />
                        )
                      }
                      label={isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={isActive ? 'success' : 'error'}
                      variant="outlined"
                      sx={{ ml: 2 }}
                  />
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Body */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {/* Description */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {description ?? 'No description provided'}
                  </Typography>
                </Box>

                {/* Owner */}
                {owner && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Owner
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            src={owner.picture ?? undefined}
                            alt={owner.name ?? owner.email ?? 'Owner'}
                            sx={{ width: AVATAR_SIZES.MEDIUM, height: AVATAR_SIZES.MEDIUM }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Typography variant="body1">
                          {owner.name ?? owner.email}
                        </Typography>
                      </Box>
                    </Box>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                {/* Environment & Type */}
                {(environment || useCase) && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Environment & Type
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {environment && (
                            <Chip
                                label={environment}
                                size="medium"
                                variant="outlined"
                                color={getEnvironmentColor(environment)}
                            />
                        )}
                        {useCase && (
                            <Chip label={useCase} size="medium" variant="outlined" color="primary" />
                        )}
                      </Box>
                    </Box>
                )}

                {/* Created At */}
                {createdAtDate && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                      <CalendarTodayIcon
                          sx={{
                            fontSize: iconSize(),
                            color: 'text.secondary',
                            mr: 2,
                            mt: 0.5,
                          }}
                      />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Created At
                        </Typography>
                        <Typography variant="body1">
                          {/*@Todo refactor this to fit user requested time format*/}
                          {createdAtDate.toDateString()} {createdAtDate.toTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                )}
              </Grid>
            </Grid>

            {/* Tags */}
            {tags.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 3 }} />
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <LocalOfferIcon
                        sx={{
                          fontSize: iconSize(),
                          color: 'text.secondary',
                          mr: 2,
                          mt: 0.5,
                        }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {tags.map((tag) => (
                            <Chip key={tag} label={tag} size="medium" variant="outlined" color="secondary" />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
  );
}
