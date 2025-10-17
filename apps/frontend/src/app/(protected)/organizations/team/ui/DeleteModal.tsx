'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

type Props = {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly isLoading?: boolean;
  readonly confirmButtonText?: string;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
};

export default function DeleteModal({
  open,
  title,
  message,
  isLoading,
  confirmButtonText = 'Remove',
  onConfirm,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-modal-title">
      <DialogTitle id="delete-modal-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText whiteSpace="pre-line">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" data-test-id="delete-cancel">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={Boolean(isLoading)}
          data-test-id="delete-confirm"
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}