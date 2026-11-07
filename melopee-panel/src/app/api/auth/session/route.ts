export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { json, route } from "@/server/auth";

export const GET = route(async ({ session }) => json({ session }));
