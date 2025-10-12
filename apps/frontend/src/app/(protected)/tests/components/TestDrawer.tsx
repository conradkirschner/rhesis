'use client';

import React, { useRef, useState } from 'react';
import BaseDrawer from '@/components/common/BaseDrawer';
import CreateTest from './CreateTest';
import UpdateTest from './UpdateTest';

import type { TestDetail } from '@/api-client/types.gen';
import {useSession} from "next-auth/react";

interface TestDrawerProps {
  open: boolean;
  onClose: () => void;
  test?: TestDetail;
  onSuccess?: () => void;
}

export default function TestDrawer({
                                     open,
                                     onClose,
                                     test,
                                     onSuccess,
                                   }: TestDrawerProps) {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const submitRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const session = useSession();
  const userId = session.data?.user?.id;

  const handleSave = async () => {
    try {
      setLoading(true);
      await submitRef.current?.();
      onClose();
    } catch (err) {
      // Surface a generic error; details already handled in child via onError
      setError((err as Error)?.message ?? 'Failed to save test');
      // Keep drawer open so user can correct issues
    } finally {
      setLoading(false);
    }
  };

  return (
      <BaseDrawer
          open={open}
          onClose={onClose}
          title={test ? 'Edit Test' : 'New Test'}
          loading={loading}
          error={error}
          onSave={handleSave}
      >
        {test ? (
            <UpdateTest
                onSuccess={onSuccess}
                onError={setError}
                submitRef={submitRef}
                test={test}
            />
        ) : (
            <CreateTest
                onSuccess={onSuccess}
                onError={setError}
                defaultOwnerId={userId}
                submitRef={submitRef}
            />
        )}
      </BaseDrawer>
  );
}
