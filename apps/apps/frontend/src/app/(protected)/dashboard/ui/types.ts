export type UiPagination = {
  readonly page: number;
  readonly pageSize: number;
};

export type UiTestRow = {
  readonly id: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly prompt: string;
  readonly ownerDisplayName: string;
  readonly updatedAt?: string;
  readonly createdAt?: string;
};

export type UiTestSetRow = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly visibility: string;
};

export type UiGridBlock<Row> = {
  readonly title: string;
  readonly rows: readonly Row[];
  readonly totalRows: number;
  readonly loading: boolean;
  readonly error: string | null;
  readonly pagination: UiPagination;
  readonly onChangePagination: (page: number, pageSize: number) => void;
  readonly linkBasePath?: string;
};

export type UiChartsBlock = {
  readonly data: {
    readonly testCasesData: ReadonlyArray<{ readonly name: string; readonly total: number }>;
    readonly testExecutionTrendData: ReadonlyArray<{
      readonly name: string;
      readonly tests: number;
      readonly passed: number;
      readonly failed: number;
      readonly pass_rate: number;
    }>;
    readonly behaviorData: ReadonlyArray<{ readonly name: string; readonly value: number }>;
    readonly categoryData: ReadonlyArray<{ readonly name: string; readonly value: number }>;
  };
  readonly isLoading: boolean;
  readonly error: string | null;
};

export type UiDashboardViewProps = {
  readonly charts: UiChartsBlock;
  readonly recentCreated: UiGridBlock<UiTestRow>;
  readonly recentUpdated: UiGridBlock<UiTestRow>;
  readonly testSets: UiGridBlock<UiTestSetRow>;
};