import type { Meta, StoryObj } from '@storybook/react';
import StepTasksGrid from '../steps/StepTasksGrid';
import type { UiTasksGridProps } from '../types';

const meta: Meta<typeof StepTasksGrid> = {
  title: 'Tasks/StepTasksGrid',
  component: StepTasksGrid,
};
export default meta;

type Story = StoryObj<typeof StepTasksGrid>;

const rows: UiTasksGridProps['rows'] = [
  {
    id: '1',
    title: 'Design homepage',
    description: 'Create initial wireframes',
    statusName: 'In Progress',
    assigneeName: 'Alice',
    assigneePicture: null,
  },
  {
    id: '2',
    title: 'Fix login bug',
    description: 'Investigate OAuth callback',
    statusName: 'Open',
    assigneeName: 'Bob',
    assigneePicture: null,
  },
] as const;

export const Default: Story = {
  args: {
    rows,
    totalRows: 2,
    pagination: { page: 0, pageSize: 25 },
    onPaginationChange: () => {},
    onRowClick: () => {},
    selectedRowIds: [],
    onSelectedRowIdsChange: () => {},
    onCreateClick: () => {},
    onDeleteSelectedClick: undefined,
    onFilterChange: () => {},
    isLoading: false,
    isRefreshing: false,
    error: undefined,
    deleteDialog: { open: false, onCancel: () => {}, onConfirm: () => {}, isLoading: false, count: 0 },
  },
};