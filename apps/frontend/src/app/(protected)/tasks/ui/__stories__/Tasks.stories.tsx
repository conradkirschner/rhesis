import type { Meta, StoryObj } from '@storybook/react';
import StepOverview from '../steps/StepOverview';
import type { UiTaskListItem, UiTaskStats } from '../types';

const meta: Meta<typeof StepOverview> = {
  title: 'Tasks/Overview',
  component: StepOverview,
};
export default meta;

type Story = StoryObj<typeof StepOverview>;

const stats: UiTaskStats = {
  total: 128,
  open: 42,
  inProgress: 21,
  completed: 60,
  cancelled: 5,
};

const rows: UiTaskListItem[] = [
  {
    id: '1',
    title: 'Design landing page',
    description: 'Hero + signup flow',
    statusName: 'In Progress',
    assigneeName: 'Alex Doe',
    assigneeAvatar: null,
  },
  {
    id: '2',
    title: 'Fix billing bug',
    description: 'Invoice rounding issue',
    statusName: 'Open',
    assigneeName: 'Jamie Fox',
    assigneeAvatar: null,
  },
];

export const Overview: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <StepOverview stats={stats} />
      <StepOverview.TaskTable
        rows={rows}
        totalCount={rows.length}
        page={0}
        pageSize={25}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onRowClick={() => {}}
        selectedIds={[]}
        onSelectionChange={() => {}}
      />
    </div>
  ),
};