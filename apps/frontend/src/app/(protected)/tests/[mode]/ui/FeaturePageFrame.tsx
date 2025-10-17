'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from 'next/link';
import Typography from '@mui/material/Typography';

export type Crumb = { readonly title: string; readonly path: string };

type Props = {
    readonly title: string;
    readonly breadcrumbs?: readonly Crumb[];
    readonly children?: React.ReactNode;
};

export default function FeaturePageFrame({ title, breadcrumbs = [], children }: Props) {
    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
                {breadcrumbs.length > 0 && (
                    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
                        {breadcrumbs.map((c) => (
                            <Link key={c.path} href={c.path}>{c.title}</Link>
                        ))}
                    </Breadcrumbs>
                )}
                <Typography component="h1" variant="h5">
                    {title}
                </Typography>
            </Box>
            {children}
        </Box>
    );
}
