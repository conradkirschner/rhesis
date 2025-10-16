'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEndpointsData } from '@/src/hooks/data';
import type {
  EndpointEnvironment,
  EndpointProtocol,
  HttpMethod,
} from '@/src/domain/endpoints/types';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepBasicInformation from '../ui/steps/StepBasicInformation';
import StepRequestSettings from '../ui/steps/StepRequestSettings';
import StepResponseSettings from '../ui/steps/StepResponseSettings';
import StepTestConnection from '../ui/steps/StepTestConnection';
import type {
  UiActionBarProps,
  UiStepperHeaderProps,
  UiStepBasicInformationProps,
  UiStepRequestSettingsProps,
  UiStepResponseSettingsProps,
  UiStepTestConnectionProps,
} from '../ui/types';

type FormState = {
  readonly name: string;
  readonly description: string;
  readonly protocol: EndpointProtocol;
  readonly url: string;
  readonly environment: EndpointEnvironment;
  readonly config_source: 'manual';
  readonly response_format: 'json';
  readonly method: HttpMethod;
  readonly endpoint_path: string;
  readonly project_id: string;
  readonly request_headers?: string;
  readonly request_body_template?: string;
  readonly response_mappings?: string;
};

const ENVIRONMENTS: readonly EndpointEnvironment[] = ['production', 'staging', 'development'] as const;
const PROTOCOLS: readonly EndpointProtocol[] = ['REST'] as const;
const METHODS: readonly HttpMethod[] = ['POST'] as const;

export default function EndpointsContainer() {
  const router = useRouter();
  const { projects, isLoadingProjects, projectsError, createEndpoint, isCreating, createError } =
    useEndpointsData();

  const [step, setStep] = React.useState(0);
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [testResponse, setTestResponse] = React.useState<string>('');
  const [isTesting, setIsTesting] = React.useState(false);

  const [form, setForm] = React.useState<FormState>({
    name: '',
    description: '',
    protocol: 'REST',
    url: '',
    environment: 'development',
    config_source: 'manual',
    response_format: 'json',
    method: 'POST',
    endpoint_path: '',
    project_id: '',
  });

  function validateUrl(val: string): boolean {
    try {
      // eslint-disable-next-line no-new
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit() {
    if (!form.url || !validateUrl(form.url)) {
      setUrlError('Please enter a valid URL');
      setStep(0);
      return;
    }
    setUrlError(null);
    if (!form.project_id) {
      setStep(0);
      return;
    }
    await createEndpoint(form);
    router.push('/endpoints');
  }

  async function onTest() {
    setIsTesting(true);
    await new Promise((r) => setTimeout(r, 600));
    setTestResponse(
      JSON.stringify(
        {
          success: true,
          message: 'Response from endpoint (sample)',
          data: { output: 'Sample response data' },
        },
        null,
        2,
      ),
    );
    setIsTesting(false);
  }

  const labels = ['Basic Information', 'Request Settings', 'Response Settings', 'Test Connection'] as const;

  const headerProps = {
    value: step,
    onChange: setStep,
    labels,
    'data-test-id': 'endpoint-stepper',
  } satisfies UiStepperHeaderProps;

  const actionBarProps = {
    onCancel: () => router.push('/endpoints'),
    onSubmit,
    submitting: isCreating,
    disabled: projects.length === 0 && !isLoadingProjects,
    submitLabel: 'Create Endpoint',
    'data-test-id': 'endpoint-action-bar',
  } satisfies UiActionBarProps;

  const basicProps = {
    name: form.name,
    description: form.description,
    url: form.url,
    urlError,
    protocol: form.protocol,
    method: form.method,
    environment: form.environment,
    environments: ENVIRONMENTS,
    protocols: PROTOCOLS,
    methods: METHODS,
    projects,
    projectId: form.project_id,
    onChange,
  } satisfies UiStepBasicInformationProps;

  const requestProps = {
    request_headers: form.request_headers ?? '',
    request_body_template: form.request_body_template ?? '',
    onChange,
  } satisfies UiStepRequestSettingsProps;

  const responseProps = {
    response_mappings: form.response_mappings ?? '',
    onChange,
  } satisfies UiStepResponseSettingsProps;

  const testProps = {
    isTesting,
    response: testResponse,
    onTest,
  } satisfies UiStepTestConnectionProps;

  const StepMap = [
    <StepBasicInformation key="basic" {...basicProps} />,
    <StepRequestSettings key="request" {...requestProps} />,
    <StepResponseSettings key="response" {...responseProps} />,
    <StepTestConnection key="test" {...testProps} />,
  ] as const;

  return (
    <FeaturePageFrame
      title="Create New Endpoint"
      breadcrumbs={[
        { title: 'Endpoints', path: '/endpoints' },
        { title: 'Create New Endpoint' },
      ]}
    >
      {isLoadingProjects && <InlineLoader label="Loading projects…" />}
      {!!projectsError && <ErrorBanner message="Failed to load projects." />}
      {!!createError && <ErrorBanner message="Failed to create endpoint." />}
      <StepperHeader {...headerProps} />
      {StepMap[step]}
      <ActionBar {...actionBarProps} />
    </FeaturePageFrame>
  );
}