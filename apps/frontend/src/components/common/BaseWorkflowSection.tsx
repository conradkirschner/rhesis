'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Avatar, Autocomplete, TextField } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useQuery } from '@tanstack/react-query';

import type { User, Status } from '@/api-client/types.gen';
import {
    readStatusesStatusesGetOptions,
    readUsersUsersGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

import { useNotifications } from '@/components/common/NotificationContext';
import { AVATAR_SIZES } from '@/constants/avatar-sizes';

/** ---- Strongly-typed update contract ---- */
type UpdateMap = {
    Status: { status_id: string | null };
    Priority: { priority: number };
    Assignee: { assignee_id?: string };
    Owner: { owner_id?: string };
};
type WorkflowField = keyof UpdateMap;
type OnUpdateEntity = <K extends WorkflowField>(updateData: UpdateMap[K], fieldName: K) => Promise<void>;

/** ---- Minimal ID-only reference accepted by the component ---- */
type IdRef = { id?: string | null };

interface BaseWorkflowSectionProps {
    title?: string;
    status?: string | null;
    priority?: number;
    assignee?: IdRef | null;
    owner?: IdRef | null;
    entityId: string;
    entityType: 'Test' | 'TestSet' | string;
    onStatusChange?: (newStatus: string) => void;
    onPriorityChange?: (newPriority: number) => void;
    onAssigneeChange?: (newAssignee: User | null) => void;
    onOwnerChange?: (newOwner: User | null) => void;
    onUpdateEntity: OnUpdateEntity;
    statusReadOnly?: boolean;
    showPriority?: boolean;
    preloadedStatuses?: Status[];
    preloadedUsers?: User[];
}

type PriorityLabel = 'Low' | 'Medium' | 'High' | 'Urgent';
interface UserOption extends User {
    displayName: string;
}

const PRIORITY_OPTIONS: PriorityLabel[] = ['Low', 'Medium', 'High', 'Urgent'];
const priorityMap: Record<PriorityLabel, number> = { Low: 0, Medium: 1, High: 2, Urgent: 3 };
const reversePriorityMap: Record<number, PriorityLabel> = { 0: 'Low', 1: 'Medium', 2: 'High', 3: 'Urgent' };

export default function BaseWorkflowSection({
                                                title = 'Workflow',
                                                status,
                                                priority = 1,
                                                assignee,
                                                owner,
                                                entityType,
                                                onStatusChange,
                                                onPriorityChange,
                                                onAssigneeChange,
                                                onOwnerChange,
                                                onUpdateEntity,
                                                statusReadOnly = false,
                                                showPriority = true,
                                                preloadedStatuses,
                                                preloadedUsers,
                                            }: BaseWorkflowSectionProps) {
    const { show } = useNotifications();

    const initialPriority = useMemo<PriorityLabel>(() => reversePriorityMap[priority] || 'Medium', [priority]);
    const initialStatus = useMemo<string | null>(() => status ?? null, [status]);

    const [currentPriority, setCurrentPriority] = useState<PriorityLabel>(initialPriority);
    const [currentStatus, setCurrentStatus] = useState<string | null>(initialStatus);
    const [currentAssignee, setCurrentAssignee] = useState<UserOption | null>(null);
    const [currentOwner, setCurrentOwner] = useState<UserOption | null>(null);

    // Load statuses/users via generator options + react-query
    const statusesOpts = useMemo(
        () =>
            readStatusesStatusesGetOptions({
                query: { entity_type: entityType, sort_by: 'name', sort_order: 'asc' },
            }),
        [entityType]
    );
    const usersOpts = useMemo(() => readUsersUsersGetOptions({ query: { limit: 100 } }), []);

    const statusesQuery = useQuery({ ...statusesOpts, enabled: !preloadedStatuses });
    const usersQuery = useQuery({ ...usersOpts, enabled: !preloadedUsers });

    const loadingStatuses = !preloadedStatuses && statusesQuery.isLoading;
    const loadingUsers = !preloadedUsers && usersQuery.isLoading;

    const statuses: Status[] = useMemo(() => {
        if (preloadedStatuses?.length) return preloadedStatuses;
        const raw = (statusesQuery.data as { data?: Status[] } | undefined)?.data ?? [];
        return raw.filter((s) => s?.id && (s.name ?? '').trim() !== '');
    }, [preloadedStatuses, statusesQuery.data]);

    const users: UserOption[] = useMemo(() => {
        const base: User[] = preloadedUsers ?? ((usersQuery.data as { data?: User[] } | undefined)?.data ?? []);
        return base
            .filter((u) => u?.is_active)
            .map((u) => ({
                ...u,
                displayName:
                    u.name?.trim() || `${u.given_name ?? ''} ${u.family_name ?? ''}`.trim() || u.email || 'Unknown',
            }));
    }, [preloadedUsers, usersQuery.data]);

    const findUserById = useCallback((userId?: string | null) => (userId ? users.find((u) => u.id === userId) ?? null : null), [users]);

    useEffect(() => {
        setCurrentAssignee(findUserById(assignee?.id) as UserOption | null);
        setCurrentOwner(findUserById(owner?.id) as UserOption | null);
    }, [assignee?.id, owner?.id, findUserById]);

    useEffect(() => setCurrentStatus(status ?? null), [status]);
    useEffect(() => setCurrentPriority(reversePriorityMap[priority] ?? 'Medium'), [priority]);

    const handleStatusChange = useCallback(
        async (newStatus: string | null) => {
            setCurrentStatus(newStatus);
            onStatusChange?.(newStatus || '');
            try {
                if (newStatus) {
                    const s = statuses.find((st) => (st.name ?? '') === newStatus);
                    if (!s?.id) {
                        setCurrentStatus(status ?? null);
                        onStatusChange?.(status ?? '');
                        show(`Status "${newStatus}" not found`, { severity: 'error' });
                        return;
                    }
                    await onUpdateEntity({ status_id: s.id }, 'Status');
                } else {
                    await onUpdateEntity({ status_id: null }, 'Status');
                }
            } catch {
                setCurrentStatus(status ?? null);
                onStatusChange?.(status ?? '');
                show('Failed to update status', { severity: 'error' });
            }
        },
        [onStatusChange, onUpdateEntity, status, statuses, show]
    );

    const handlePriorityChange = useCallback(
        async (newPriority: PriorityLabel) => {
            setCurrentPriority(newPriority);
            const numeric = priorityMap[newPriority];
            onPriorityChange?.(numeric);
            try {
                await onUpdateEntity({ priority: numeric }, 'Priority');
            } catch {
                setCurrentPriority(reversePriorityMap[priority] || 'Medium');
                onPriorityChange?.(priority);
            }
        },
        [onPriorityChange, onUpdateEntity, priority]
    );

    const handleAssigneeChange = useCallback(
        async (newAssignee: UserOption | null) => {
            setCurrentAssignee(newAssignee);
            try {
                await onUpdateEntity({ assignee_id: newAssignee?.id ?? undefined }, 'Assignee');
                onAssigneeChange?.(newAssignee ?? null);
            } catch {
                setCurrentAssignee(findUserById(assignee?.id));
                show('Failed to update assignee', { severity: 'error' });
            }
        },
        [assignee?.id, findUserById, show, onAssigneeChange, onUpdateEntity]
    );

    const handleOwnerChange = useCallback(
        async (newOwner: UserOption | null) => {
            setCurrentOwner(newOwner);
            onOwnerChange?.(newOwner ?? null);
            try {
                await onUpdateEntity({ owner_id: newOwner?.id ?? undefined }, 'Owner');
            } catch {
                const original = findUserById(owner?.id) as UserOption | null;
                setCurrentOwner(original);
                onOwnerChange?.(original);
            }
        },
        [findUserById, onOwnerChange, onUpdateEntity, owner?.id]
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            {title && <Typography variant="h6">{title}</Typography>}

            <Autocomplete
                value={currentStatus}
                onChange={(_, v) => handleStatusChange(v)}
                options={statuses.map((s) => s.name ?? '').filter(Boolean)}
                sx={{ width: '100%' }}
                renderInput={(params) => <TextField {...params} label="Status" variant="outlined" placeholder="Select Status" />}
                loading={loadingStatuses}
                disabled={loadingStatuses || statusReadOnly}
            />

            {showPriority && (
                <Autocomplete
                    value={currentPriority}
                    onChange={(_, v) => v && handlePriorityChange(v as PriorityLabel)}
                    options={PRIORITY_OPTIONS}
                    sx={{ width: '100%' }}
                    renderInput={(params) => <TextField {...params} label="Priority" variant="outlined" placeholder="Select Priority" />}
                    disableClearable
                />
            )}

            <Autocomplete
                options={users}
                value={currentAssignee}
                onChange={(_, v) => handleAssigneeChange(v)}
                getOptionLabel={(o) => o.displayName}
                loading={loadingUsers}
                sx={{ width: '100%' }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Assignee"
                        variant="outlined"
                        placeholder="Select Assignee"
                        InputProps={{
                            ...params.InputProps,
                            startAdornment:
                                currentAssignee && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
                                        <Avatar src={currentAssignee.picture ?? undefined} sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL }}>
                                            <PersonIcon />
                                        </Avatar>
                                    </Box>
                                ),
                        }}
                    />
                )}
                renderOption={(props, option) => {
                    return (
                        <li  {...(props)} key={option.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar src={option.picture ?? undefined} sx={{ width: AVATAR_SIZES.MEDIUM, height: AVATAR_SIZES.MEDIUM }}>
                                    {!option.picture && option.displayName.charAt(0)}
                                </Avatar>
                                <Typography>{option.displayName}</Typography>
                            </Box>
                        </li>
                    );
                }}
                isOptionEqualToValue={(a, b) => a.id === (b as UserOption | null)?.id}
            />

            <Autocomplete
                options={users}
                value={currentOwner}
                onChange={(_, v) => handleOwnerChange(v)}
                getOptionLabel={(o) => o.displayName}
                loading={loadingUsers}
                sx={{ width: '100%' }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Owner"
                        variant="outlined"
                        placeholder="Select Owner"
                        InputProps={{
                            ...params.InputProps,
                            startAdornment:
                                currentOwner && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
                                        <Avatar src={currentOwner.picture ?? undefined} sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL }}>
                                            <PersonIcon />
                                        </Avatar>
                                    </Box>
                                ),
                        }}
                    />
                )}
                renderOption={(props, option) => {
                    return (
                        <li {...(props)} key={option.id} >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar src={option.picture ?? undefined} sx={{ width: AVATAR_SIZES.MEDIUM, height: AVATAR_SIZES.MEDIUM }}>
                                    {!option.picture && option.displayName.charAt(0)}
                                </Avatar>
                                <Typography>{option.displayName}</Typography>
                            </Box>
                        </li>
                    );
                }}
                isOptionEqualToValue={(a, b) => a.id === (b as UserOption | null)?.id}
            />
        </Box>
    );
}
