'use client';

import { DeleteModal } from '@/components/common/DeleteModal';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemType: string;
  itemName?: string;
};

export default function DeleteConfirmDialog({ open, onClose, onConfirm, itemType, itemName }: Props) {
  return (
    <DeleteModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      itemType={itemType}
      itemName={itemName}
      message={
        itemName
          ? `Are you sure you want to delete the ${itemType} "${itemName}"? This action cannot be undone, and any applications using this ${itemType} will no longer be able to authenticate.`
          : `Are you sure you want to delete this ${itemType}? This action cannot be undone, and any applications using this ${itemType} will no longer be able to authenticate.`
      }
    />
  );
}