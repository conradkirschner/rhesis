import type { Meta, StoryObj } from '@storybook/react';
import StepEndpointsTable from '../steps/StepEndpointsTable';
import type { UiEndpointRow, UiPaginationModel } from '../types';

const meta: Meta<typeof StepEndpointsTable> = {
  title: 'Endpoints/StepEndpointsTable',
  component: StepEndpointsTable,
};
export default meta;

type Story = StoryObj<typeof StepEndpointsTable>;

const rows: readonly UiEndpointRow[] = [
  {
    id: '1',
    name: 'Create Order',
    protocol: 'HTTP',
    environment: 'prod',
    projectLabel: 'Shop',
    projectIconName: 'ShoppingCart',
  },
  {
    id: '2',
    name: 'Telemetry Ingest',
    protocol: 'Kafka',
    environment: 'dev',
    projectLabel: 'Devices',
    projectIconName: 'Devices',
  },
] as const;

const pagination: UiPaginationModel = { page: 0, pageSize: 10 } as const;

export const Default: Story = {
  args: {
    rows,
    loading: false,
    totalCount: rows.length,
    paginationModel: pagination,
    onPaginationModelChange: () => {},
    selectedRowIds: [],
    onSelectionChange: () => {},
  },
};