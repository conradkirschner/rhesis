'use client';

import * as React from 'react';
import { Paper } from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useState } from 'react';
import TeamInviteForm from './components/TeamInviteForm';
import TeamMembersGrid from './components/TeamMembersGrid';

export default function TeamPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleInvitesSent = (emails: string[]) => {
    console.log('Invitations sent to:', emails);
    // Trigger refresh of team members grid
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <PageContainer>
      {/* Invitation Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <TeamInviteForm onInvitesSent={handleInvitesSent} />
      </Paper>

      {/* Team Members Grid */}
      <Paper sx={{ p: 3 }}>
        <TeamMembersGrid refreshTrigger={refreshTrigger} />
      </Paper>
    </PageContainer>
  );
}
