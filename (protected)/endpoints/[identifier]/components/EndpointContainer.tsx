'use client';

import { useCallback, useMemo, useState } from 'react';
import { useEndpointData } from '@/hooks/data/Endpoint/useEndpointData';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import StepBasicInformation from '../ui/steps/StepBasicInformation';
import StepRequestSettings from '../ui/steps/StepRequestSettings';
import StepResponseSettings from '../ui/steps/StepResponseSettings';
import StepTestConnection from '../ui/steps/StepTestConnection';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import type {
  StepKey,
  UiBreadcrumb,
  UiEndpointBasic,
  UiProjectOption,
} from '../ui/types';

type Props = {
  readonly identifier: string;
};

const STEPS: readonly StepKey[] = ['basic', 'request', 'response', 'test'] as const;

export default function EndpointContainer({ identifier }: Props) {
  const { endpoint, isLoading, error, projects, update, test } = useEndpointData(identifier);

  const [step, setStep] = useState<StepKey>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [basic, setBasic] = useState<UiEndpointBasic>({
    name: endpoint?.name ?? '',
    description: endpoint?.description ?? '',
    url: endpoint?.url ?? '',
    protocol: endpoint?.protocol ?? 'REST',
    method: endpoint?.method ?? 'GET',
    environment: endpoint?.environment ?? 'production',
    projectId: endpoint?.projectId ?? '',
  });

  const [requestHeaders, setRequestHeaders] = useState<string>(
    JSON.stringify(endpoint?.requestHeaders ?? {}, null, 2),
  );
  const [requestBodyTemplate, setRequestBodyTemplate] = useState<string>(
    JSON.stringify(endpoint?.requestBodyTemplate ?? {}, null, 2),
  );
  const [responseMappings, setResponseMappings] = useState<string>(
    JSON.stringify(endpoint?.responseMappings ?? {}, null, 2),
  );

  const [testInput, setTestInput] = useState<string>(
    `{\n  "input": "[place your input here]"\n}`,
  );
  const [testResponse, setTestResponse] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  // Re-seed local state when endpoint loads the first time
  useMemo(() => {
    if (!endpoint) return;
    setBasic({
      name: endpoint.name ?? '',
      description: endpoint.description ?? '',
      url: endpoint.url ?? '',
      protocol: endpoint.protocol ?? 'REST',
      method: endpoint.method ?? 'GET',
      environment: endpoint.environment ?? 'production',
      projectId: endpoint.projectId ?? '',
    });
    setRequestHeaders(JSON.stringify(endpoint.requestHeaders ?? {}, null, 2));
    setRequestBodyTemplate(JSON.stringify(endpoint.requestBodyTemplate ?? {}, null, 2));
    setResponseMappings(JSON.stringify(endpoint.responseMappings ?? {}, null, 2));
  }, [endpoint]);

  const breadcrumbs: readonly UiBreadcrumb[] = [
    { title: 'Endpoints', path: '/endpoints' },
    { title: endpoint?.name ?? 'Details' },
  ] as const;

  const projectOptions: readonly UiProjectOption[] = useMemo(
    () =>
      (projects ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        iconKey: p.iconKey,
      })),
    [projects],
  );

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setSaveError(null);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setSaveError(null);
    if (!endpoint) return;
    setBasic({
      name: endpoint.name ?? '',
      description: endpoint.description ?? '',
      url: endpoint.url ?? '',
      protocol: endpoint.protocol ?? 'REST',
      method: endpoint.method ?? 'GET',
      environment: endpoint.environment ?? 'production',
      projectId: endpoint.projectId ?? '',
    });
    setRequestHeaders(JSON.stringify(endpoint.requestHeaders ?? {}, null, 2));
    setRequestBodyTemplate(JSON.stringify(endpoint.requestBodyTemplate ?? {}, null, 2));
    setResponseMappings(JSON.stringify(endpoint.responseMappings ?? {}, null, 2));
  }, [endpoint]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await update({
        fields: {
          name: basic.name ?? '',
          description: basic.description ?? '',
          url: basic.url ?? '',
          protocol: basic.protocol ?? 'REST',
          method: basic.method ?? 'GET',
          environment: basic.environment ?? 'production',
          projectId: basic.projectId ?? '',
        },
        json: {
          requestHeaders,
          requestBodyTemplate,
          responseMappings,
        },
      });
      setIsEditing(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  }, [basic, requestHeaders, requestBodyTemplate, responseMappings, update]);

  const handleTest = useCallback(async () => {
    setIsTesting(true);
    try {
      const res = await test(testInput);
      setTestResponse(res);
    } finally {
      setIsTesting(false);
    }
  }, [test, testInput]);

  if (isLoading) {
    return <InlineLoader label="Loading endpoint..." />;
  }

  if (error) {
    return <ErrorBanner message={`Error loading endpoint: ${error.message}`} />;
  }

  if (!endpoint) {
    return <ErrorBanner message="No endpoint found" />;
  }

  const StepCompMap: Record<StepKey, JSX.Element> = {
    basic: (
      <StepBasicInformation
        isEditing={isEditing}
        values={basic}
        projects={projectOptions}
        onChange={(patch) => setBasic((prev) => ({ ...prev, ...patch }))}
      />
    ),
    request: (
      <StepRequestSettings
        isEditing={isEditing}
        requestHeaders={requestHeaders}
        requestBodyTemplate={requestBodyTemplate}
        onChange={(patch) => {
          if (patch.requestHeaders !== undefined) setRequestHeaders(patch.requestHeaders);
          if (patch.requestBodyTemplate !== undefined) setRequestBodyTemplate(patch.requestBodyTemplate);
        }}
      />
    ),
    response: (
      <StepResponseSettings
        isEditing={isEditing}
        responseMappings={responseMappings}
        onChange={(patch) => {
          if (patch.responseMappings !== undefined) setResponseMappings(patch.responseMappings);
        }}
      />
    ),
    test: (
      <StepTestConnection
        testInput={testInput}
        onChange={setTestInput}
        onTest={handleTest}
        testResponse={testResponse}
        isTesting={isTesting}
      />
    ),
  };

  return (
    <FeaturePageFrame
      title={endpoint.name ?? 'Endpoint'}
      breadcrumbs={breadcrumbs}
      header={
        <StepperHeader step={step} onStepChange={setStep} steps={STEPS} />
      }
      actionBar={
        <ActionBar
          isEditing={isEditing}
          isSaving={isSaving}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      }
    >
      {saveError ? <ErrorBanner message={saveError} /> : null}
      {StepCompMap[step]}
    </FeaturePageFrame>
  );
}