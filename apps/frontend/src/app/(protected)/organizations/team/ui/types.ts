export type UiTeamMember = {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly picture?: string;
  readonly status: 'active' | 'invited';
};

export type UiTeamInviteFormProps = {
  readonly invites: readonly { email: string; error?: string }[];
  readonly onChangeEmail: (index: number, value: string) => void;
  readonly onAdd: () => void;
  readonly onRemove: (index: number) => void;
  readonly onSubmit: () => void;
  readonly isSubmitting: boolean;
  readonly maxInvites: number;
};

export type UiTeamMembersGridProps = {
  readonly rows: readonly UiTeamMember[];
  readonly totalCount: number;
  readonly paginationModel: { page: number; pageSize: number };
  readonly onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  readonly loading: boolean;
  readonly currentUserId?: string;
  readonly onRequestRemove: (memberId: string) => void;
};