export type UiProvider = {
  readonly id: string;
  readonly code: string;
  readonly label: string;
};

export type UiModelCard = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly modelName: string;
  readonly keySuffix?: string;
};

export type UiActionBarProps = {
  readonly onAdd: () => void;
};

export type UiConnectForm = {
  readonly providerTypeId: string;
  readonly providerLabel: string;
  readonly providerIcon?: string;
  readonly connectionName: string;
  readonly modelName: string;
  readonly endpoint: string;
  readonly apiKey: string;
  readonly customHeaders: Record<string, string>;
};

export type UiFeaturePageFrameProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly loading: boolean;
  readonly errorMessage?: string;
  readonly providers: readonly UiProvider[];
  readonly models: readonly UiModelCard[];
  readonly actions: UiActionBarProps;
  readonly dialogs: {
    readonly selectOpen: boolean;
    readonly onCloseSelect: () => void;
    readonly onSelectProvider: (providerId: string) => void;

    readonly connectOpen: boolean;
    readonly selectedProvider: UiProvider | null;
    readonly onCloseConnect: () => void;
    readonly onSubmitConnect: (form: UiConnectForm) => Promise<void>;

    readonly deleteOpen: boolean;
    readonly onRequestDelete: (modelId: string) => void;
    readonly onCloseDelete: () => void;
    readonly onConfirmDelete: () => void;
  };
};