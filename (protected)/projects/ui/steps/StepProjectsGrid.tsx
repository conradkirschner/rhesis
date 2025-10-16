'use client';

import {
  Avatar,
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Typography,
  Button,
  Divider,
  Paper,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import type { UiProjectsGridProps, UiProject } from '../types';

function ProjectCard({ project, onView }: { project: UiProject; onView: (id: string) => void }) {
  const ownerName = project.owner?.name ?? project.owner?.email ?? '';
  const created =
    project.createdAt ? new Date(project.createdAt).toDateString() : undefined;

  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ width: 40, height: 40 }}>
            <FolderIcon />
          </Avatar>
        }
        title={project.name}
        titleTypographyProps={{ variant: 'h6', noWrap: true, sx: { fontWeight: 500 } }}
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ flexGrow: 1, pt: 2, pb: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            {project.description
              ? project.description.length > 250
                ? `${project.description.slice(0, 250)}…`
                : project.description
              : 'No description provided'}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip
            icon={project.isActive ? <CheckCircleIcon fontSize="small" /> : <DoNotDisturbAltIcon fontSize="small" />}
            label={project.isActive ? 'Active' : 'Inactive'}
            size="small"
            color={project.isActive ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>

        {ownerName ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={project.owner?.picture}
              alt={ownerName}
              sx={{ width: 24, height: 24, mr: 1 }}
            />
            <Typography variant="body2">{ownerName}</Typography>
          </Box>
        ) : null}

        {created ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Created: {created}
            </Typography>
          </Box>
        ) : null}
      </CardContent>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', p: 1.5 }}>
        <Button
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => onView(project.id)}
          variant="contained"
          sx={{ minWidth: 80 }}
          data-test-id="view-project-btn"
        >
          View
        </Button>
      </CardActions>
    </Card>
  );
}

export default function StepProjectsGrid({ projects, onView }: UiProjectsGridProps) {
  if (projects.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <FolderIcon fontSize="large" />
        </Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          No projects found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create your first project to start building and testing your AI applications.
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {projects.map((project) => (
        <Grid item key={project.id} xs={12} md={6} lg={4}>
          <ProjectCard project={project} onView={onView} />
        </Grid>
      ))}
    </Grid>
  );
}