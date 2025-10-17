import type * as React from 'react';

export type UiBreadcrumb = { title: string; path: string };

export type UiActionButton = {
  label: string;
  onClick: () => void;
  variant: 'contained' | 'outlined';
  color?: 'error';
  icon?: React.ReactNode;
};
export type UiChartsProps = {
  readonly status: readonly { name: string; value: number; fullName?: string }[];
  readonly results: readonly { name: string; value: number; fullName?: string }[];
  readonly testSets: readonly { name: string; value: number; fullName?: string }[];
  readonly executors: readonly { name: string; value: number; fullName?: string }[];
};
export type UiPaginationModel = { page: number; pageSize: number };

export type UiPieDatum = { name: string; value: number; fullName?: string };

export type UiUserOption = {
  id: string;
  displayName: string;
  picture?: string;
};

export type UiProjectOption = {
  id: string;
  name: string;
  organizationId: string | number | null;
};

export type UiTestSetOption = {
  id: string;
  name: string;
};

export type UiEndpointOption = {
  id: string;
  name: string;
  environment: string;
  projectId: string;
  organizationId: string ;
};

export type UiLookups = {
  readonly users: readonly {
    readonly id?: string ;
    readonly name?: string | null;
    readonly given_name?: string | null;
    readonly family_name?: string | null;
    readonly email?: string | null;
    readonly picture?: string | null;
  }[];
  readonly testSets: readonly { readonly id: string; readonly name?: string | null }[];
  readonly projects: readonly { readonly id: string; readonly name?: string | null }[];
  readonly endpoints: readonly { readonly id: string; readonly name: string; readonly environment?: string | null }[];
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
};
export type UiTestRunRow = {
  id: string;
  name: string;
  testSetName?: string;
  totalTests: number;
  totalExecutionTimeMs?: number;
  status?: string;
  executor?: { displayName: string; picture?: string };
  counts?: { comments: number; tasks: number };
};