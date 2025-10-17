'use client';

import {
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { StepBasicInformationProps, UiProjectOption } from '../types';
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

const PROTOCOLS = ['REST'] as const;
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const ENVIRONMENTS = ['production', 'staging', 'development'] as const;

const ICON_MAP: Record<string, React.ElementType> = {
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

function ProjectIcon({ iconKey }: { iconKey: UiProjectOption['iconKey'] }) {
  const Cmp = (iconKey && ICON_MAP[iconKey]) || SmartToyIcon;
  return <Cmp />;
}

export default function StepBasicInformation({
  isEditing,
  values,
  projects,
  onChange,
}: StepBasicInformationProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Basic Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {isEditing ? (
              <TextField
                fullWidth
                label="Name"
                value={values.name ?? ''}
                onChange={(e) => onChange({ name: e.target.value })}
                data-test-id="name-input"
              />
            ) : (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{values.name || '—'}</Typography>
              </>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {isEditing ? (
              <TextField
                fullWidth
                label="Description"
                value={values.description ?? ''}
                onChange={(e) => onChange({ description: e.target.value })}
                multiline
                rows={1}
                data-test-id="description-input"
              />
            ) : (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">{values.description || 'No description provided'}</Typography>
              </>
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Request Configuration
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {isEditing ? (
              <TextField
                fullWidth
                label="URL"
                value={values.url ?? ''}
                onChange={(e) => onChange({ url: e.target.value })}
                data-test-id="url-input"
              />
            ) : (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  URL
                </Typography>
                <Typography variant="body1">{values.url || '—'}</Typography>
              </>
            )}
          </Grid>

          <Grid item xs={12} md={3}>
            {isEditing ? (
              <FormControl fullWidth>
                <InputLabel>Protocol</InputLabel>
                <Select
                  value={(values.protocol ?? 'REST') as string}
                  label="Protocol"
                  onChange={(e) => onChange({ protocol: e.target.value })}
                  data-test-id="protocol-select"
                >
                  {PROTOCOLS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Protocol
                </Typography>
                <Typography variant="body1">{values.protocol || '—'}</Typography>
              </>
            )}
          </Grid>

          <Grid item xs={12} md={3}>
            {isEditing ? (
              <FormControl fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  value={(values.method ?? 'GET') as string}
                  label="Method"
                  onChange={(e) => onChange({ method: e.target.value })}
                  data-test-id="method-select"
                >
                  {METHODS.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Method
                </Typography>
                <Typography variant="body1">{values.method || '—'}</Typography>
              </>
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Project
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {isEditing ? (
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={values.projectId ?? ''}
                  label="Project"
                  onChange={(e) => onChange({ projectId: e.target.value })}
                  data-test-id="project-select"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      <ListItemIcon>
                        <ProjectIcon iconKey={project.iconKey} />
                      </ListItemIcon>
                      <ListItemText primary={project.name} secondary={project.description ?? undefined} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : values.projectId ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  <ProjectIcon iconKey={projects.find((p) => p.id === values.projectId)?.iconKey ?? null} />
                </Box>
                <Typography variant="body1">
                  {projects.find((p) => p.id === values.projectId)?.name || '—'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1">No project assigned</Typography>
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        {isEditing ? (
          <FormControl fullWidth>
            <InputLabel>Environment</InputLabel>
            <Select
              value={(values.environment ?? 'production') as string}
              label="Environment"
              onChange={(e) => onChange({ environment: e.target.value })}
              data-test-id="environment-select"
            >
              {ENVIRONMENTS.map((env) => (
                <MenuItem key={env} value={env}>
                  {env}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Environment
            </Typography>
            <Chip
              label={values.environment ?? '—'}
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          </>
        )}
      </Grid>
    </Grid>
  );
}