import type { Meta, StoryObj } from '@storybook/react';
import StepCharts from '../steps/StepCharts';
import StepRunsTable from '../steps/StepRunsTable';
import type { UiChartsProps, UiTestRunRow } from '../types';

const chartsData: UiChartsProps = {
  status: [
    { name: 'Completed', value: 24 },
    { name: 'Progress', value: 6 },
  ],
  results: [
    { name: 'Passed', value: 18 },
    { name: 'Failed', value: 6 },
    { name: 'Pending', value: 6 },
  ],
  testSets: [
    { name: 'Smoke', value: 10 },
    { name: 'Regression', value: 8 },
    { name: 'E2E', value: 6 },
  ],
  executors: [
    { name: 'Alice', value: 12 },
    { name: 'Bob', value: 8 },
    { name: 'Charlie', value: 6 },
  ],
};

const rows: UiTestRunRow[] = Array.from({ length: 10 }).map((_, i) => ({
  id: 'i' + 1,
  name: `Run ${i + 1}`,
  testSetName: ['Smoke', 'Regression', 'E2E'][i % 3],
  totalTests: 100 + i,
  executionTime: `${5 + i}m`,
  status: i % 2 ? 'Completed' : 'Progress',
  executorName: ['Alice', 'Bob', 'Charlie'][i % 3],
  commentsCount: i % 4,
  tasksCount: i % 3,
}));

const metaCharts: Meta<typeof StepCharts> = {
  title: 'TestRuns/StepCharts',
  component: StepCharts,
};
export default metaCharts;
type Story = StoryObj<typeof StepCharts>;

export const Charts: Story = {
  args: { data: chartsData, isLoading: false, errorMessage: null },
};

export const RunsTable: StoryObj<typeof StepRunsTable> = {
  render: () => (
    <StepRunsTable
      rows={rows}
      totalRows={rows.length}
      page={0}
      pageSize={10}
      loading={false}
      errorMessage={null}
      onPaginationChange={() => {}}
      onRowClick={() => {}}
      onDeleteSelected={async () => {}}
      lookups={{ users: [], projects: [], endpoints: [], testSets: [], isLoading: false, errorMessage: null }}
      drawerOpen={false}
      onDrawerClose={() => {}}
    />
  ),
};