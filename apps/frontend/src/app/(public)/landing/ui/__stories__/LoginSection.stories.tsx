import type { Meta, StoryObj } from '@storybook/react';
import LoginSection from '../LoginSection';

const meta = {
  title: 'Landing/LoginSection',
  component: LoginSection,
} satisfies Meta<typeof LoginSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    termsAccepted: false,
    previouslyAccepted: false,
    showTermsWarning: false,
    onToggleTerms: () => {},
    onLogin: () => {},
  },
};