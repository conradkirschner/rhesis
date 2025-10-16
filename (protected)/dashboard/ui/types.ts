import type { Dispatch, SetStateAction } from 'react';

export type UiPaginationModel = { page: number; pageSize: number };
export type UiOnPaginationChange = Dispatch<SetStateAction<UiPaginationModel>>;

export type UiDashboardChartsProps = {
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly testCasesData: readonly { name: string; total: number }[];
  readonly testExecutionTrendData: readonly {
    name: string;
    tests: number;
    passed: number;
    failed: number;
    pass_rate?: number;
  }[];
  readonly behaviorData: readonly { name: string; value: number }[];
  readonly categoryData: readonly { name: string; value: number }[];
};

export type UiRecentTestsRow = {
  readonly id: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly promptContent: string;
  readonly ownerDisplay: string;
};

export type UiRecentTestsProps = {
  readonly rows: readonly UiRecentTestsRow[];
  readonly totalRows: number;
  readonly paginationModel: UiPaginationModel;
  readonly onPaginationModelChange: UiOnPaginationChange;
  readonly loading: boolean;
  readonly errorMessage: string | null;
};

export type UiRecentActivitiesRow = {
  readonly id: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly updatedAt: string;
  readonly assigneeDisplay: string;
};

export type UiRecentActivitiesProps = {
  readonly rows: readonly UiRecentActivitiesRow[];
  readonly totalRows: number;
  readonly paginationModel: UiPaginationModel;
  readonly onPaginationModelChange: UiOnPaginationChange;
  readonly loading: boolean;
  readonly errorMessage: string | null;
};

export type UiRecentTestSetsRow = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly visibility: string;
};

export type UiRecentTestSetsProps = {
  readonly rows: readonly UiRecentTestSetsRow[];
  readonly totalRows: number;
  readonly paginationModel: UiPaginationModel;
  readonly onPaginationModelChange: UiOnPaginationChange;
  readonly loading: boolean;
  readonly errorMessage: string | null;
};

export type UiFeatureSectionKind = 'tests' | 'activities' | 'testSets' | 'testRuns';

export type UiFeatureSection = {
  readonly key: string;
  readonly kind: UiFeatureSectionKind;
  readonly title: string;
  readonly content: React.ReactNode;
};

export type UiFeaturePageFrameProps = {
  readonly charts: React.ReactNode;
  readonly sections: readonly UiFeatureSection[];
};