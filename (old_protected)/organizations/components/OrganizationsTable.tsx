'use client';

import React from 'react';
import { Chip } from '@mui/material';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';

import BaseTable from '@/components/common/BaseTable';

import type { Organization } from '@/api-client/types.gen';

import { useQuery } from '@tanstack/react-query';
import { readOrganizationsOrganizationsGetOptions } from '@/api-client/@tanstack/react-query.gen';

interface OrganizationsTableProps {
  organizations?: Organization[];
}

export default function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const router = useRouter();

  const queryOpts = readOrganizationsOrganizationsGetOptions({
    query: { skip: 0, limit: 100, sort_by: 'created_at', sort_order: 'desc' },
  });

  const orgsQuery = useQuery({
    ...queryOpts,
    enabled: !organizations,
    select: (data) => data.data,
    staleTime: 60_000,
  });

  const rows: Organization[] = organizations ?? orgsQuery.data ?? [];

  const handleRowClick = (organization: Organization) => {
    router.push(`/organizations/${organization.id}`);
  };

  const columns: {
    id: string;
    label: string;
    render: (organization: Organization) => React.ReactNode;
  }[] = [
    {
      id: 'name',
      label: 'Name',
      render: (organization) => organization.name ?? '—',
    },
    {
      id: 'description',
      label: 'Description',
      render: (organization) => organization.description ?? '—',
    },
    {
      id: 'status',
      label: 'Status',
      render: (organization) => (
          <Chip
              label={(organization.is_active ?? false) ? 'Active' : 'Inactive'}
              size="small"
              variant="outlined"
              color={(organization.is_active ?? false) ? 'success' : 'error'}
          />
      ),
    },
    {
      id: 'domain',
      label: 'Domain',
      render: (organization) =>
          organization.domain ? (
              <Chip
                  label={organization.domain}
                  size="small"
                  variant="outlined"
                  color={(organization.is_domain_verified ?? false) ? 'success' : 'warning'}
              />
          ) : null,
    },
  ];

  return (
      <BaseTable
          columns={columns}
          data={rows}
          onRowClick={handleRowClick}
          title="Organizations"
          actionButtons={[
            {
              label: 'New Organization',
              href: '/organizations/new',
              icon: <AddIcon />,
              variant: 'contained',
            },
          ]}
      />
  );
}
