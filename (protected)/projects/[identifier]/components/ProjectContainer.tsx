'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectData } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepOverview from '../ui/steps/StepOverview';
import type {
  UiActionBarProps,
  UiBreadcrumb,
  UiProjectFormFields,
  UiStepOverviewProps,
} from '../ui/types';

interface Props {
  readonly projectId: string;
  readonly sessionToken: string;
}

export default function ProjectContainer({ projectId, sessionToken }: Props) {
  const router = useRouter();

  const { project, isLoading, isError, errorMessage, refetch, updateProject, deleteProject, isUpdating, isDeleting } =
    useProjectData({ projectId, sessionToken });

  const [isEditing, setIsEditing] = useState(false);

  const [fields, setFields] = useState<UiProjectFormFields>({
    name: '',
    description: '',
    ownerId: '',
    isActive: true,
    icon: 'SmartToy',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UiProjectFormFields, string>>>({});

  // Seed form when project loads
  useMemo(() => {
    if (project) {
      setFields({
        name: project.name,
        description: project.description ?? '',
        ownerId: project.ownerId,
        isActive: project.isActive,
        icon: project.icon ?? 'SmartToy',
      });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const breadcrumbs = useMemo<readonly UiBreadcrumb[]>(() => {
    const title = project?.name || `Project ${projectId}`;
    return [
      { title: 'Projects', path: '/projects' },
      { title, path: `/projects/${projectId}` },
    ] as const;
  }, [project?.name, projectId]);

  const title = project?.name || `Project ${projectId}`;

  const validate = (): boolean => {
    const next: Partial<Record<keyof UiProjectFormFields, string>> = {};
    if (!fields.name.trim()) next.name = 'Project name is required';
    if (fields.name.length > 100) next.name = 'Project name must be less than 100 characters';
    if (fields.description && fields.description.length > 500) next.description = 'Description must be less than 500 characters';
    if (!fields.ownerId.trim()) next.ownerId = 'Owner is required';
    if (!fields.icon.trim()) next.icon = 'Icon is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = async () => {
    if (!project) return;
    if (!validate()) return;

    const update: Record<string, unknown> = {};
    if (fields.name !== project.name) update.name = fields.name;
    if ((fields.description || null) !== (project.description ?? null)) update.description = fields.description || null;
    if (fields.ownerId !== project.ownerId) update.owner_id = fields.ownerId;
    if (fields.isActive !== project.isActive) update.is_active = fields.isActive;

    await updateProject(update);
    setIsEditing(false);
  };

  const onDelete = async () => {
    if (!project) return;
    // eslint-disable-next-line no-restricted-globals
    const ok = typeof window !== 'undefined' ? window.confirm(`Delete project "${project.name}"?`) : false;
    if (!ok) return;
    await deleteProject();
    router.push('/projects');
  };

  if (isLoading) {
    return <InlineLoader label="Loading project…" />;
  }

  if (isError) {
    return <ErrorBanner message={errorMessage ?? 'Failed to load project'} onRetry={() => refetch()} />;
  }

  const actionBarProps = {
    mode: isEditing ? 'edit' : 'view',
    onEdit: () => setIsEditing(true),
    onSave,
    onCancel: () => {
      // reset to snapshot from server
      if (project) {
        setFields({
          name: project.name,
          description: project.description ?? '',
          ownerId: project.ownerId,
          isActive: project.isActive,
          icon: project.icon ?? 'SmartToy',
        });
      }
      setErrors({});
      setIsEditing(false);
    },
    onDelete,
    disabled: isUpdating || isDeleting,
  } satisfies UiActionBarProps;

  const stepProps = {
    isEditing,
    fields,
    errors,
    users: [], // No lookup in this feature; owner is a free-text id.
    onChange: setFields,
  } satisfies UiStepOverviewProps;

  return (
    <FeaturePageFrame title={title} breadcrumbs={breadcrumbs}>
      <ActionBar {...actionBarProps} />
      <StepOverview {...stepProps} />
    </FeaturePageFrame>
  );
}