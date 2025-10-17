export type UiProjectOwner = {
  readonly name?: string;
  readonly email?: string;
  readonly picture?: string;
};

export type UiProject = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly isActive?: boolean;
  readonly icon?: string;
  readonly createdAt?: string;
  readonly owner?: UiProjectOwner;
};

export type UiProjectsGridProps = {
  readonly projects: readonly UiProject[];
  readonly onView: (id: string) => void;
};