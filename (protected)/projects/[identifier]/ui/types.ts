import type { ReactNode } from 'react';

export interface UiBreadcrumb {
  readonly title: string;
  readonly path: string;
}

export interface UiFeaturePageFrameProps {
  readonly title: string;
  readonly breadcrumbs: readonly UiBreadcrumb[];
  readonly children: ReactNode;
}

export interface UiActionBarProps {
  readonly mode: 'view' | 'edit';
  readonly onEdit: () => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly onDelete: () => void;
  readonly disabled?: boolean;
}

export interface UiOwner {
  readonly id: string;
  readonly name?: string | null;
  readonly email?: string | null;
  readonly picture?: string | null;
}

export interface UiProjectFormFields {
  readonly name: string;
  readonly description: string;
  readonly ownerId: string;
  readonly isActive: boolean;
  readonly icon: string;
}

export interface UiStepOverviewProps {
  readonly isEditing: boolean;
  readonly fields: UiProjectFormFields;
  readonly users: readonly UiOwner[];
  readonly errors?: Partial<Record<keyof UiProjectFormFields, string>>;
  readonly onChange: (fields: UiProjectFormFields) => void;
}