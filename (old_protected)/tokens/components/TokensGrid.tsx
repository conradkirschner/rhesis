'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
    Chip,
    Box,
    IconButton,
    Tooltip,
    Typography,
    Paper,
} from '@mui/material';
import { GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DeleteIcon, VpnKeyIcon } from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';

import BaseDataGrid from '@/components/common/BaseDataGrid';
import RefreshTokenModal from './RefreshTokenModal';
import { TokenRead } from '@/api-client';


interface TokensGridProps {
    tokens: TokenRead[];
    onRefreshToken: (tokenId: string, expiresInDays: number | null) => void;
    onDeleteToken: (tokenId: string) => void;
    loading: boolean;
    totalCount: number;
    onPaginationModelChange?: (model: GridPaginationModel) => void;
    paginationModel?: GridPaginationModel;
}

export default function TokensGrid({
                                       tokens,
                                       onRefreshToken,
                                       onDeleteToken,
                                       loading,
                                       totalCount,
                                       onPaginationModelChange,
                                       paginationModel = { page: 0, pageSize: 10 },
                                   }: TokensGridProps) {
    const [refreshModalOpen, setRefreshModalOpen] = useState(false);
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

    const handleRefreshClick = useCallback((tokenId: string) => {
        setSelectedTokenId(tokenId);
        setRefreshModalOpen(true);
    }, []);

    const isFuture = useCallback((iso?: string | null) => {
        if (!iso) return false;
        return new Date(iso).getTime() > Date.now();
    }, []);

    const columns: GridColDef<TokenRead>[] = useMemo(
        () => [
            {
                field: 'name',
                headerName: 'Name',
                flex: 1,
                renderCell: (params: GridRenderCellParams<TokenRead>) => (
                    <Box sx={{ fontWeight: 500 }}>{params.row.name}</Box>
                ),
            },
            {
                field: 'token',
                headerName: 'Token',
                flex: 1.5,
                valueGetter: (_v, row) => row.token_obfuscated,
                renderCell: (params: GridRenderCellParams<TokenRead>) => params.row.token_obfuscated,
            },
            {
                field: 'last_used',
                headerName: 'Last Used',
                flex: 1,
                valueGetter: (_v, row) => row.last_used_at ?? null,
                renderCell: (params: GridRenderCellParams<TokenRead>) =>
                    params.row.last_used_at
                        ? formatDistanceToNow(new Date(params.row.last_used_at), { addSuffix: true })
                        : 'Never',
            },
            {
                field: 'expires',
                headerName: 'Expires',
                flex: 1,
                valueGetter: (_v, row) => row.expires_at ?? null,
                renderCell: (params: GridRenderCellParams<TokenRead>) => {
                    const exp = params.row.expires_at;
                    if (!exp) {
                        return (
                            <Chip
                                label="Never"
                                size="small"
                                variant="outlined"
                                sx={{ borderColor: 'success.light', color: 'success.main', bgcolor: 'transparent' }}
                            />
                        );
                    }
                    const future = isFuture(exp);
                    return (
                        <Chip
                            label={formatDistanceToNow(new Date(exp), { addSuffix: true })}
                            size="small"
                            variant="outlined"
                            sx={{
                                borderColor: future ? 'success.light' : 'error.light',
                                color: future ? 'success.main' : 'error.main',
                                bgcolor: 'transparent',
                            }}
                        />
                    );
                },
            },
            {
                field: 'actions',
                headerName: 'Actions',
                flex: 0.5,
                sortable: false,
                filterable: false,
                renderCell: (params: GridRenderCellParams<TokenRead>) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Invalidate and refresh">
                            <IconButton
                                size="small"
                                onClick={e => {
                                    e.stopPropagation();
                                    handleRefreshClick(params.row.id);
                                }}
                                aria-label="invalidate and refresh token"
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Token">
                            <IconButton
                                size="small"
                                onClick={e => {
                                    e.stopPropagation();
                                    void onDeleteToken(params.row.id);
                                }}
                                aria-label="delete token"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            },
        ],
        [handleRefreshClick, isFuture, onDeleteToken],
    );

    if (!loading && tokens.length === 0) {
        return (
            <Paper
                elevation={2}
                sx={{
                    width: '100%',
                    mb: 2,
                    textAlign: 'center',
                    py: 8,
                    px: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <VpnKeyIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7 }} />
                </Box>

                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    No API tokens yet
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 550, mx: 'auto' }}>
                    Create your first API token to start interacting with the Rhesis API. Tokens allow you to
                    authenticate your applications and build powerful integrations.
                </Typography>
            </Paper>
        );
    }

    const selectedName =
        (selectedTokenId && tokens.find(t => t.id === selectedTokenId)?.name) || '';

    return (
        <>
            <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2 }}>
                    <BaseDataGrid
                        columns={columns}
                        rows={tokens}
                        loading={loading}
                        getRowId={(row: TokenRead) => row.id}
                        density="standard"
                        paginationModel={paginationModel}
                        onPaginationModelChange={onPaginationModelChange}
                        serverSidePagination
                        totalRows={totalCount}
                        pageSizeOptions={[10, 25, 50]}
                        disablePaperWrapper
                    />
                </Box>
            </Paper>

            <RefreshTokenModal
                open={refreshModalOpen}
                onClose={() => setRefreshModalOpen(false)}
                onRefresh={async expiresInDays => {
                    if (selectedTokenId) {
                        await onRefreshToken(selectedTokenId, expiresInDays);
                        setRefreshModalOpen(false);
                    }
                }}
                tokenName={selectedName}
            />
        </>
    );
}
