'use client';

import React, {
    useMemo,
    useCallback,
    useState,
    useEffect,
    useRef,
} from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Box,
    Chip,
    Button,
    Avatar,
    Divider,
    Tooltip,
    CardHeader,
    useTheme,
    Skeleton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';

// Optional icon set (project.icon → component)
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

import { useRouter } from 'next/navigation';

import type {ProjectDetail} from '@/api-client/types.gen';
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

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

// Map of icon names to components for easy lookup
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

const getProjectIcon = (project: ProjectDetail): React.ReactNode => {
    const key = project.icon as IconKey | null | undefined;
    const IconComponent = key && ICON_MAP[key] ? ICON_MAP[key] : SmartToyIcon;
    return <IconComponent />;
};

interface ProjectCardProps {
    project: ProjectDetail;
    isLoading?: boolean;
}

// Skeleton while loading
const ProjectCardSkeleton = () => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
            avatar={<Skeleton variant="circular" width={40} height={40} />}
            title={<Skeleton variant="text" width="80%" />}
        />
        <Divider />
        <CardContent sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rounded" width="40%" height={24} sx={{ mt: 2, mb: 2 }} />
            <Skeleton variant="rounded" width="60%" height={24} sx={{ mb: 2 }} />
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: 1.5 }}>
            <Skeleton variant="rounded" width={80} height={36} sx={{ mr: 1 }} />
            <Skeleton variant="rounded" width={80} height={36} />
        </CardActions>
    </Card>
);

const ProjectCard = React.memo(({ project, isLoading = false }: ProjectCardProps) => {
    const router = useRouter();
    const theme = useTheme();
    const cardHeaderRef = useRef<HTMLDivElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    // Truncation check for title
    useEffect(() => {
        const checkTruncation = () => {
            setTimeout(() => {
                if (cardHeaderRef.current) {
                    const el = cardHeaderRef.current.querySelector(
                        '.MuiCardHeader-content .MuiTypography-root'
                    ) as HTMLElement | null;
                    if (el) {
                        const overflow = el.scrollWidth > el.clientWidth;
                        setIsTruncated(overflow);
                    }
                }
            }, 10);
        };
        checkTruncation();
        const onResize = () => setTimeout(checkTruncation, 100);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [project.name]);

    const handleViewClick = useCallback(() => {
        router.push(`/projects/${project.id}`);
    }, [router, project.id]);

    const getThemeColor = useCallback(
        (name?: string | null) => {
            const palette = [theme.palette.primary.main];
            const idx = (name?.charCodeAt(0) ?? 'A'.charCodeAt(0)) % palette.length;
            return palette[idx];
        },
        [theme],
    );

    const cardHeader = useMemo(
        () => (
            <CardHeader
                ref={cardHeaderRef}
                avatar={
                    <Avatar
                        sx={{
                            bgcolor: getThemeColor(project.name),
                            width: 40,
                            height: 40,
                        }}
                    >
                        {getProjectIcon(project)}
                    </Avatar>
                }
                title={
                    isTruncated ? (
                        <Tooltip title={project.name} arrow placement="top">
                            <span style={{ cursor: 'help' }}>{project.name}</span>
                        </Tooltip>
                    ) : (
                        <span>{project.name}</span>
                    )
                }
                titleTypographyProps={{
                    variant: 'h6',
                    component: 'div',
                    noWrap: true,
                    sx: { fontWeight: 'medium' },
                }}
                sx={{
                    pb: 1,
                    display: 'flex',
                    overflow: 'hidden',
                    '& .MuiCardHeader-content': { overflow: 'hidden' },
                }}
            />
        ),
        [getThemeColor, project, isTruncated],
    );

    if (isLoading) return <ProjectCardSkeleton />;

    const projectOwner = project.owner;
    let projectOwnerDisplayName = ''
    if (projectOwner) {
        projectOwnerDisplayName= projectOwner.name ?? projectOwner.email ?? '';
    }
    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                borderRadius: (t) => t.shape.borderRadius * 0.5,
                overflow: 'hidden',
            }}
            elevation={2}
        >
            {/* Header */}
            {cardHeader}

            <Divider />

            {/* Content */}
            <CardContent sx={{ flexGrow: 1, pt: 2, pb: 1 }}>
                {/* Description */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <DescriptionIcon
                        sx={{
                            fontSize: (t) => (t as unknown as { iconSizes?: { medium: number } }).iconSizes?.medium ?? undefined,
                            color: 'text.secondary',
                            mr: 1,
                            mt: 0.3,
                        }}
                    />
                    <Typography variant="body2">
                        {project.description
                            ? project.description.length > 250
                                ? `${project.description.substring(0, 250)}...`
                                : project.description
                            : 'No description provided'}
                    </Typography>
                </Box>

                {/* Active status */}
                {project.is_active !== undefined && project.is_active !== null && (
                    <Box sx={{ mb: 2 }}>
                        <Chip
                            icon={
                                project.is_active ? (
                                    <CheckCircleIcon fontSize="small" />
                                ) : (
                                    <DoNotDisturbAltIcon fontSize="small" />
                                )
                            }
                            label={project.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={project.is_active ? 'success' : 'error'}
                            variant="outlined"
                        />
                    </Box>
                )}

                {/* Owner ID (only if available) */}
                {projectOwner && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                            src={projectOwner.picture??undefined}
                            alt={projectOwnerDisplayName}
                            sx={{ width: 24, height: 24, mr: 1 }}
                        />
                        <Typography variant="body2">{projectOwner.name}</Typography>
                    </Box>
                )}
                {/* Environment Chip - if needed */}
                {/*{project.environment && (*/}
                {/*    <Box sx={{ mb: 2 }}>*/}
                {/*        <Chip*/}
                {/*            label={project.environment}*/}
                {/*            size="small"*/}
                {/*            variant="outlined"*/}
                {/*            color={getEnvironmentColor(project.environment)}*/}
                {/*        />*/}
                {/*        {project.useCase && (*/}
                {/*            <Chip*/}
                {/*                label={project.useCase}*/}
                {/*                size="small"*/}
                {/*                variant="outlined"*/}
                {/*                color="primary"*/}
                {/*                sx={{ ml: 1 }}*/}
                {/*            />*/}
                {/*        )}*/}
                {/*    </Box>*/}
                {/*)}*/}
                {/* Creation Date */}
                {project.created_at && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CalendarTodayIcon
                            sx={{
                                fontSize: theme => theme.iconSizes.medium,
                                color: 'text.secondary',
                                mr: 1,
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            Created: {new Date(project.created_at).toDateString()}
                        </Typography>
                    </Box>
                )}
            </CardContent>

            <Box sx={{ flexGrow: 1 }} />
            <Divider />

            {/* Actions */}
            <CardActions sx={{ justifyContent: 'flex-end', p: 1.5 }}>
                <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={handleViewClick}
                    variant="contained"
                    sx={{ minWidth: '80px' }}
                >
                    View
                </Button>
            </CardActions>
        </Card>
    );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;
