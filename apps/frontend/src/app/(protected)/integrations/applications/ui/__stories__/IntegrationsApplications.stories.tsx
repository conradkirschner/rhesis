// src/app/(protected)/integrations/components/ui/steps/StepEmptyState.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../FeaturePageFrame';
import StepEmptyState from '../steps/StepEmptyState';

const meta = {
    title: 'Integrations/Applications/EmptyState',
    component: StepEmptyState,
} satisfies Meta<typeof StepEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        badgeLabel: 'Coming soon',
        title: 'Add Application',
        description: 'Connect to your development and productivity tools',
        cta: {
            label: 'Add Application',
            disabled: true,
            onClick: () => {},
            'data-test-id': 'add-application',
        },
    },
    render: (args) => (
        <FeaturePageFrame
            header={{
                title: 'Connect Your Tools',
                subtitle: 'Enhance your workflow by integrating with your favorite services.',
            }}
        >
            <StepEmptyState {...args} />
        </FeaturePageFrame>
    ),
};
