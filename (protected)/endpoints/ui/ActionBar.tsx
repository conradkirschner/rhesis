'use client';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Add as AddIcon, UploadOutlined as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';

export interface ActionBarProps {
  readonly canDelete: boolean;
  readonly deleteCount: number;
  readonly confirmOpen: boolean;
  onOpenConfirm(): void;
  onCloseConfirm(): void;
  onConfirmDelete(): void;
  onNew(): void;
  onImport(): void;
}

export default function ActionBar(props: ActionBarProps) {
  const { canDelete, deleteCount, confirmOpen, onOpenConfirm, onCloseConfirm, onConfirmDelete, onNew, onImport } = props;

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          disabled={!canDelete}
          onClick={onOpenConfirm}
          data-test-id="delete-endpoints"
        >
          Delete {deleteCount > 0 ? `${deleteCount} selected` : 'selected'}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onNew}
          data-test-id="new-endpoint"
        >
          New Endpoint
        </Button>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={onImport}
          data-test-id="import-swagger"
        >
          Import Swagger
        </Button>
      </Box>

      <Dialog open={confirmOpen} onClose={onCloseConfirm}>
        <DialogTitle>Delete {deleteCount} endpoint{deleteCount === 1 ? '' : 's'}?</DialogTitle>
        <DialogContent>
          Deleting will only remove the endpoint record. Related data will not be deleted.
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseConfirm}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={onConfirmDelete}
            data-test-id="confirm-delete"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}