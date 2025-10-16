"use server";

import { auth } from "@/auth";

export async function getSessionToken() {
    const session = await auth();
    return session?.session_token
}