/**
 * Admin customer management.
 *
 * Customer rows in `profiles` have no anon/authenticated RLS policies, so the
 * browser cannot delete them directly. This function runs with the service-role
 * key and is gated on a valid `admin_sessions` token, mirroring admin-auth.
 *
 * Actions:
 *   delete  - remove a customer profile (cascades to their orders/products)
 *   block   - set is_blocked without destroying data
 *   unblock - clear is_blocked
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function restHeaders() {
  return {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  };
}

async function restSelect(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { ...restHeaders(), "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`REST select ${table} failed: ${res.status}`);
  return res.json();
}

async function restDelete(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: restHeaders(),
  });
  if (!res.ok) throw new Error(`REST delete ${table} failed: ${res.status}`);
  return res;
}

async function restUpdate(table: string, query: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: { ...restHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`REST update ${table} failed: ${res.status}`);
}

/** Resolve the caller from the admin session token. Returns null if not valid. */
async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  // Local fallback sessions created by admin-auth when the network is down.
  if (token.startsWith("local-")) return null;

  const rows = await restSelect(
    "admin_sessions",
    `select=*,admin:admins(id,email)&token=eq.${encodeURIComponent(token)}`,
  );
  const session = Array.isArray(rows) ? rows[0] : null;
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  return session.admin;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || url.pathname.split("/").pop();

    const admin = await requireAdmin(req);
    if (!admin) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (action === "delete") {
      const { id } = await req.json();
      if (!id) return jsonResponse({ error: "Customer id is required" }, 400);

      // Confirm the row exists before removing it, so we can tell "deleted"
      // apart from "no such customer".
      const existing = await restSelect(
        "profiles",
        `select=id,full_name,email&id=eq.${encodeURIComponent(id)}`,
      );
      if (!Array.isArray(existing) || existing.length === 0) {
        return jsonResponse({ error: "Customer not found" }, 404);
      }

      // profiles.id cascades into orders.user_id and products.farmer_id.
      await restDelete("profiles", `id=eq.${encodeURIComponent(id)}`);

      return jsonResponse({ success: true, deleted: existing[0] });
    }

    if (action === "block" || action === "unblock") {
      const { id } = await req.json();
      if (!id) return jsonResponse({ error: "Customer id is required" }, 400);

      const existing = await restSelect(
        "profiles",
        `select=id&id=eq.${encodeURIComponent(id)}`,
      );
      if (!Array.isArray(existing) || existing.length === 0) {
        return jsonResponse({ error: "Customer not found" }, 404);
      }

      await restUpdate("profiles", `id=eq.${encodeURIComponent(id)}`, {
        is_blocked: action === "block",
      });

      return jsonResponse({ success: true, is_blocked: action === "block" });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("admin-customers error:", err);
    return jsonResponse({ error: message }, 500);
  }
});