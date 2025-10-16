import type * as React from 'react';

export type UiBreadcrumb = { title: string; path: string };

export type UiActionButton = {
  label: string;
  onClick: () => void;
  variant: 'contained' | 'outlined';
  color?: 'error';
  icon?: React.ReactNode;
};

export type UiPaginationModel = { page: number; pageSize: number };

export type UiPieDatum = { name: string; value: number; fullName?: string };

export type UiUserOption = {
  id: string | number;
  displayName: string;
  picture?: string;
};

export type UiProjectOption = {
  id: string | number;
  name: string;
  organizationId: string | number | null;
};

export type UiTestSetOption = {
  id: string | number;
  name: string;
};

export type UiEndpointOption = {
  id: string | number;
  name: string;
  environment: string;
  projectId: string | number | null;
  organizationId: string | number | null;
};

export type UiTestRunRow = {
  id: string | number;
  name: string;
  testSetName?: string;
  totalTests: number;
  totalExecutionTimeMs?: number;
  status?: string;
  executor?: { displayName: string; picture?: string };
  counts?: { comments: number; tasks: number };
};