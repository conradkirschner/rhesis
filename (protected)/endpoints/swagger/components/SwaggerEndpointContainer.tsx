'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useSwaggerEndpointData } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import SwaggerEndpointForm from '../ui/SwaggerEndpointForm';
import type { UiProjectOption, UiSwaggerEndpointFormProps, UiEnvironment } from '../ui/types';

export default function SwaggerEndpointContainer() {
  const router = useRouter();
  const { projects, loadingProjects, projectsErrorMessage, createFromOpenApi } =
    useSwaggerEndpointData();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<UiEnvironment>('development');
  const [swaggerUrl, setSwaggerUrl] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uiProjects: readonly UiProjectOption[] = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        icon: p.icon,
      })) satisfies readonly UiProjectOption[],
    [projects],
  );

  const handleCancel = useCallback(() => {
    router.push('/endpoints');
  }, [router]);

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setErrorMessage(null);
    try {
      await new Promise((r) => setTimeout(r, 200));
      // No-op: import step just populates the URL field which is already bound to state.
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setErrorMessage(null);

    if (!projectId) {
      setErrorMessage('Please select a project.');
      return;
    }

    try {
      await createFromOpenApi({
        name,
        description,
        environment,
        openapi_spec_url: swaggerUrl,
        project_id: projectId,
      });
      router.push('/endpoints');
    } catch (e) {
      setErrorMessage((e as Error).message);
    }
  }, [createFromOpenApi, description, environment, name, projectId, router, swaggerUrl]);

  const formProps = {
    name,
    description,
    environment,
    swaggerUrl,
    projectId,
    projects: uiProjects,
    loadingProjects,
    projectsErrorMessage,
    isImporting,
    errorMessage,
    onChange: (field, value) => {
      switch (field) {
        case 'name':
          setName(value);
          break;
        case 'description':
          setDescription(value);
          break;
        case 'environment':
          setEnvironment(value as UiEnvironment);
          break;
        case 'swaggerUrl':
          setSwaggerUrl(value);
          break;
        case 'projectId':
          setProjectId(value);
          break;
      }
    },
    onImportClick: handleImport,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    disableCreate: (uiProjects.length === 0 && !loadingProjects) || isImporting,
  } satisfies UiSwaggerEndpointFormProps;

  return (
    <FeaturePageFrame
      title="New Swagger Endpoint"
      breadcrumbs={[
        { title: 'Endpoints', path: '/endpoints' },
        { title: 'Add Swagger Endpoint' },
      ]}
    >
      <SwaggerEndpointForm {...formProps} />
    </FeaturePageFrame>
  );
}