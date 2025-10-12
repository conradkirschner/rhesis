'use client';

import * as React from 'react';
import { Box, useTheme } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { NavigationProvider } from '../navigation/NavigationProvider';
import { NotificationProvider } from '../common/NotificationContext';
import { type NavigationItem, type LayoutProps } from '../../types/navigation';

function getAllSegments(items: NavigationItem[]): string[] {
  return items.reduce<string[]>((acc, item) => {
    if (item.kind === 'page') {
      acc.push(item.segment);
      if (item.children) {
        acc.push(...getAllSegments(item.children));
      }
    }
    return acc;
  }, []);
}

export function LayoutContent({
  children,
  session,
  navigation,
  branding,
  authentication,
}: Omit<LayoutProps, 'theme'>) {
  const theme = useTheme();

  return (
    <SessionProvider session={session}>
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <NotificationProvider>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <NavigationProvider
                navigation={navigation}
                branding={branding}
                session={session}
                authentication={authentication}
                theme={theme}
              >
                {children}
              </NavigationProvider>
            </Box>
          </Box>
        </NotificationProvider>
      </AppRouterCacheProvider>
    </SessionProvider>
  );
}
