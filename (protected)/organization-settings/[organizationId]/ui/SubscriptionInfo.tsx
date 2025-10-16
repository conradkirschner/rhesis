'use client';

import { Box, Grid, Typography, Chip, Alert } from '@mui/material';
import { CheckCircle, Cancel, People, Event } from '@mui/icons-material';
import type { UiSubscriptionInfoProps } from './types';
import { formatDisplayDate } from '@/lib/organization-settings/format';

export default function SubscriptionInfo({
  isActive,
  maxUsers,
  subscriptionEndsAt,
  createdAt,
}: UiSubscriptionInfoProps) {
  const isExpired = subscriptionEndsAt ? new Date(subscriptionEndsAt) < new Date() : false;
  const daysUntilExpiration =
    subscriptionEndsAt
      ? Math.ceil(
          (new Date(subscriptionEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {isActive ? (
            <Chip icon={<CheckCircle />} label="Active" color="success" size="small" variant="outlined" />
          ) : (
            <Chip icon={<Cancel />} label="Inactive" color="error" size="small" variant="outlined" />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <People fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Maximum Users:
            </Typography>
          </Box>
          <Typography variant="body1">{maxUsers ?? 'Unlimited'}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Event fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Subscription Ends:
            </Typography>
          </Box>
          <Typography variant="body1">{formatDisplayDate(subscriptionEndsAt)}</Typography>

          {subscriptionEndsAt && (
            <Box sx={{ mt: 2 }}>
              {isExpired ? (
                <Alert severity="error">Your subscription has expired. Please contact support to renew.</Alert>
              ) : daysUntilExpiration !== null && daysUntilExpiration <= 30 ? (
                <Alert severity="warning">
                  Your subscription will expire in {daysUntilExpiration} day
                  {daysUntilExpiration !== 1 ? 's' : ''}. Please contact support to renew.
                </Alert>
              ) : (
                <Alert severity="info">Your subscription is active and will renew automatically.</Alert>
              )}
            </Box>
          )}
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Event fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Organization Created:
            </Typography>
          </Box>
          <Typography variant="body1">{formatDisplayDate(createdAt)}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            To modify subscription details or user limits, please contact your account manager or support team.
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}