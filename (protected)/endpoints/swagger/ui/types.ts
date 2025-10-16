export type UiEnvironment = 'production' | 'staging' | 'development';

export type UiProjectOption = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string | null;
};

export type UiSwaggerEndpointFormProps = {
  readonly name: string;
  readonly description: string;
  readonly environment: UiEnvironment;
  readonly swaggerUrl: string;
  readonly projectId: string;

  readonly projects: readonly UiProjectOption[];
  readonly loadingProjects: boolean;
  readonly projectsErrorMessage: string | null;

  readonly isImporting: boolean;
  readonly disableCreate: boolean;
  readonly errorMessage: string | null;

  readonly onChange: (
    field: 'name' | 'description' | 'environment' | 'swaggerUrl' | 'projectId',
    value: string,
  ) => void;
  readonly onImportClick: () => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
};