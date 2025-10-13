'use client';

import { clearAllSessionData } from './session';

// Add a flag to prevent multiple simultaneous logout attempts
let isLoggingOut = false;

export async function handleClientSignOut() {
  console.log(
    '[ERROR] [DEBUG] handleClientSignOut called - starting logout process'
  );

  // Prevent multiple simultaneous logout attempts
  if (isLoggingOut) {
    console.log(
      '[ERROR] [DEBUG] Logout already in progress, skipping duplicate request'
    );
    return;
  }

  isLoggingOut = true;

  await clearAllSessionData();

}
