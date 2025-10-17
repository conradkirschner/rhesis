export type UiTokenRow = {
  readonly id: string;
  readonly name: string;
  readonly token_obfuscated: string;
  readonly last_used_at: string | null;
  readonly expires_at: string | null;
};

export type UiPaginationModel = {
  readonly page: number;
  readonly pageSize: number;
};