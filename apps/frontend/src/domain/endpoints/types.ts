export type EndpointProtocol = 'REST';
export type EndpointEnvironment = 'production' | 'staging' | 'development';
export type HttpMethod = 'POST';

export type ProjectSummary = {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly icon?: string | null;
};

export type CreateEndpointInput = {
  readonly name: string;
  readonly description?: string;
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