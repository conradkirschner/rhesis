import type {
  EndpointEnvironment,
  EndpointProtocol,
  HttpMethod,
} from '@/src/domain/endpoints/types';
import type { ProjectSummary } from '@/src/domain/endpoints/types';

export type UiStepperHeaderProps = {
  readonly value: number;
  readonly onChange: (index: number) => void;
  readonly labels: readonly string[];
  readonly 'data-test-id'?: string;
};

export type UiActionBarProps = {
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
  readonly submitting?: boolean;
  readonly disabled?: boolean;
  readonly submitLabel?: string;
  readonly 'data-test-id'?: string;
};

export type UiStepBasicInformationProps = {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly urlError: string | null;
  readonly protocol: EndpointProtocol;
  readonly method: HttpMethod;
  readonly environment: EndpointEnvironment;
  readonly environments: readonly EndpointEnvironment[];
  readonly protocols: readonly EndpointProtocol[];
  readonly methods: readonly HttpMethod[];
  readonly projects: readonly ProjectSummary[];
  readonly projectId: string;
  readonly onChange: <K extends UiBasicKeys>(key: K, value: UiBasicState[K]) => void;
};

export type UiBasicState = {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly protocol: EndpointProtocol;
  readonly method: HttpMethod;
  readonly environment: EndpointEnvironment;
  readonly endpoint_path: string;
  readonly project_id: string;
};
export type UiBasicKeys = keyof UiBasicState;

export type UiStepRequestSettingsProps = {
  readonly request_headers: string;
  readonly request_body_template: string;
  readonly onChange: <K extends 'request_headers' | 'request_body_template'>(key: K, value: string) => void;
};

export type UiStepResponseSettingsProps = {
  readonly response_mappings: string;
  readonly onChange: <K extends 'response_mappings'>(key: K, value: string) => void;
};

export type UiStepTestConnectionProps = {
  readonly isTesting: boolean;
  readonly response: string;
  readonly onTest: () => void | Promise<void>;
};