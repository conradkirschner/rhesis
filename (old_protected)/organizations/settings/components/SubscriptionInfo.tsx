'use client';

import React from 'react';
import { Box, Grid, Typography, Chip, Alert } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  People as PeopleIcon,
  Event as EventIcon,
} from '@mui/icons-material';

import type { Organization } from '@/api-client/types.gen';

interface SubscriptionInfoProps {
  organization: Organization;
}

export default function SubscriptionInfo({ organization }: SubscriptionInfoProps) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return Number.isNaN(date.getTime())
        ? 'Invalid date'
        : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const subscriptionEndsAt = organization.subscription_ends_at ?? undefined;

  const isExpired = subscriptionEndsAt ? new Date(subscriptionEndsAt) < new Date() : false;

  const daysUntilExpiration =
      subscriptionEndsAt
          ? Math.ceil(
              (new Date(subscriptionEndsAt).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
          : null;

  return (
      <Box>
        <Grid container spacing={3}>
          {/* Active Status */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Organization Status:
              </Typography>
            </Box>
            {organization.is_active ? (
                <Chip
                    icon={<CheckCircleIcon />}
                    label="Active"
                    color="success"
                    size="small"
                    variant="outlined"
                />
            ) : (
                <Chip
                    icon={<CancelIcon />}
                    label="Inactive"
                    color="error"
                    size="small"
                    variant="outlined"
                />
            )}
          </Grid>

          {/* Max Users */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PeopleIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Maximum Users:
              </Typography>
            </Box>
            <Typography variant="body1">
              {organization.max_users ?? 'Unlimited'}
            </Typography>
          </Grid>

          {/* Subscription End Date */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EventIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Subscription Ends:
              </Typography>
            </Box>
            <Typography variant="body1">{formatDate(subscriptionEndsAt)}</Typography>

            {subscriptionEndsAt && (
                <Box sx={{ mt: 2 }}>
                  {isExpired ? (
                      <Alert severity="error">
                        Your subscription has expired. Please contact support to renew.
                      </Alert>
                  ) : daysUntilExpiration !== null && daysUntilExpiration <= 30 ? (
                      <Alert severity="warning">
                        Your subscription will expire in {daysUntilExpiration} day
                        {daysUntilExpiration !== 1 ? 's' : ''}. Please contact support to renew.
                      </Alert>
                  ) : (
                      <Alert severity="info">
                        Your subscription is active and will renew automatically.
                      </Alert>
                  )}
                </Box>
            )}
          </Grid>

          {/* Organization Created Date */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EventIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Organization Created:
              </Typography>
            </Box>
            <Typography variant="body1">{formatDate(organization.created_at)}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info">
              To modify subscription details or user limits, please contact your account manager or
              support team.
            </Alert>
          </Grid>
        </Grid>
      </Box>
  );
}
