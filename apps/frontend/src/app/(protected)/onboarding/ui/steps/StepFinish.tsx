import * as React from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Divider, Stack } from '@mui/material';
import StepperHeader from '../StepperHeader';
import type { UiStepFinishProps } from '../types';

export function StepFinish({ formData, status }: UiStepFinishProps) {
  const validInvites = formData.invites.filter((i) => i.email.trim() !== '');

  return (
    <Box>
      <StepperHeader title="You're almost done!" description="Please review your information before completing setup" />
      <Stack spacing={3} mb={4}>
        <Paper variant="outlined" elevation={0}>
          <Box p={3}>
            <Typography variant="h6" gutterBottom color="primary">
              Your Information
            </Typography>
            <List disablePadding>
              <ListItem>
                <ListItemText
                  primary={<Typography variant="subtitle2">Organization Name</Typography>}
                  secondary={<Typography variant="body1" color="text.primary">{formData.organizationName}</Typography>}
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText
                  primary={<Typography variant="subtitle2">Your Name</Typography>}
                  secondary={
                    <Typography variant="body1" color="text.primary">
                      {`${formData.firstName} ${formData.lastName}`}
                    </Typography>
                  }
                />
              </ListItem>
              {formData.website ? (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="subtitle2">Website</Typography>}
                      secondary={<Typography variant="body1" color="text.primary">{formData.website}</Typography>}
                    />
                  </ListItem>
                </>
              ) : null}
            </List>
          </Box>
        </Paper>

        {validInvites.length > 0 ? (
          <Paper variant="outlined" elevation={0}>
            <Box p={3}>
              <Typography variant="h6" gutterBottom color="primary">
                Team Members Invited ({validInvites.length})
              </Typography>
              <List disablePadding>
                {validInvites.map((invite, index) => (
                  <React.Fragment key={index}>
                    {index > 0 ? <Divider component="li" /> : null}
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="body1" color="text.primary">{invite.email}</Typography>}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Paper>
        ) : null}
      </Stack>

      <Box data-test-id="finish-status" sx={{ display: 'none' }}>
        {status}
      </Box>
    </Box>
  );
}