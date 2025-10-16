import type { Meta, StoryObj } from '@storybook/react';
import StepDashboard from '../../ui/steps/StepDashboard';
import type { UiActionButton, UiPaginationModel, UiPieDatum, UiTestRunRow, UiUserOption, UiProjectOption, UiTestSetOption, UiEndpointOption } from '../../ui/types';

const meta: Meta<typeof StepDashboard> = {
  title: 'TestRuns/StepDashboard',
  component: StepDashboard,
};
export default meta;

type Story = StoryObj<typeof StepDashboard>;

const rows: UiTestRunRow[] = [
  {
    id: 1,
    name: 'Nightly E2E',
    testSetName: 'Regression',
    totalTests: 120,
    totalExecutionTimeMs: 820000,
    status: 'completed',
    executor: { displayName: 'Jane Doe' },
    counts: { comments: 3, tasks: 2 },
  },
];

const chart: UiPieDatum[] = [
  { name: 'Completed', value: 10 },
  { name: 'Progress', value: 2 },
];

const buttons: UiActionButton[] = [{ label: 'New Test Run', variant: 'contained', onClick: () => {} }];

const pagination: UiPaginationModel = { page: 0, pageSize: 50 };

const users: UiUserOption[] = [{ id: 1, displayName: 'Jane Doe' }];

const projects: UiProjectOption[] = [{ id: 1, name: 'Web App', organizationId: 1 }];

const testSets: UiTestSetOption[] = [{ id: 1, name: 'Regression' }];

const endpoints: UiEndpointOption[] = [{ id: 1, name: 'Prod', environment: 'prod', projectId: 1, organizationId: 1 }];

export const Default: Story = {
  args: {
    charts: {
      status: chart,
      results: chart,
      testSets: chart,
      executors: chart,
    },
    grid: {
      rows,
      totalRows: 1,
      loading: false,
      paginationModel: pagination,
      onPaginationModelChange: () => {},
      onRowClick: () => {},
      selection: [],
      onSelectionChange: () => {},
      actionButtons: buttons,
    },
    drawer: {
      open: true,
      loading: false,
      onClose: () => {},
      onSave: () => {},
      options: {
        users,
        projects,
        testSets,
        endpoints,
      },
      values: {
        assignee: users[0],
        owner: users[0],
        project: projects[0],
        testSet: testSets[0],
        endpoint: endpoints[0],
      },
      onChange: {
        assignee: () => {},
        owner: () => {},
        project: () => {},
        testSet: () => {},
        endpoint: () => {},
      },
    },
    deleteModal: {
      open: false,
      loading: false,
      count: 0,
      onCancel: () => {},
      onConfirm: () => {},
    },
  },
};