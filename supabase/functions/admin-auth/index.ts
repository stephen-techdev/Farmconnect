import { hashPassword, verifyPassword, isHashed } from "../_shared/password.ts";

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
  const data = await res.json();
  return Array.isArray(data) ? data : data;
}

async function restInsert(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...restHeaders(), "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST insert ${table} failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function restDelete(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: restHeaders(),
  });
  if (!res.ok) throw new Error(`REST delete ${table} failed: ${res.status}`);
}

async function restUpdate(table: string, query: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: { ...restHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST update ${table} failed: ${res.status} ${text}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || url.pathname.split("/").pop();

    // ---------- REGISTER ----------
    if (action === "admin-register") {
      const { name, email, password, avatar_url } = await req.json();
      if (!name || !email || !password) {
        return jsonResponse({ error: "Name, email, and password are required" }, 400);
      }

      const existing = await restSelect(
        "admins",
        `select=id&email=eq.${encodeURIComponent(email)}`,
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return jsonResponse({ error: "An admin with this email already exists" }, 409);
      }

      const row = await restInsert("admins", {
        name,
        email,
        password: await hashPassword(password),
        avatar_url: avatar_url || null,
        mobile: "0000000000",
      });

      return jsonResponse({
        admin: { id: row.id, name: row.name, email: row.email, avatar_url: row.avatar_url },
      });
    }

    // ---------- LOGIN ----------
    if (action === "admin-login") {
      const { email, password } = await req.json();
      if (!email || !password) {
        return jsonResponse({ error: "Email and password are required" }, 400);
      }

      const rows = await restSelect(
        "admins",
        `select=*&email=eq.${encodeURIComponent(email)}`,
      );
      const admin = Array.isArray(rows) ? rows[0] : null;

      if (!admin || !(await verifyPassword(password, admin.password))) {
        return jsonResponse({ error: "Invalid email or password" }, 401);
      }

      // Legacy accounts stored plaintext: upgrade to a hash now that we have the plaintext.
      if (!isHashed(admin.password)) {
        try {
          await restUpdate("admins", `id=eq.${admin.id}`, {
            password: await hashPassword(password),
          });
        } catch (err) {
          // Non-fatal: login still succeeds, upgrade retries next time.
          console.error("admin password upgrade failed:", err);
        }
      }

      const token = crypto.randomUUID() + crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await restInsert("admin_sessions", {
        admin_id: admin.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

      return jsonResponse({
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          avatar_url: admin.avatar_url,
        },
      });
    }

    // ---------- VERIFY ----------
    if (action === "admin-verify") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return jsonResponse({ valid: false }, 401);
      }
      const token = authHeader.replace("Bearer ", "");

      const rows = await restSelect(
        "admin_sessions",
        `select=*,admin:admins(*)&token=eq.${encodeURIComponent(token)}`,
      );
      const session = Array.isArray(rows) ? rows[0] : null;

      if (!session) {
        return jsonResponse({ valid: false }, 401);
      }

      if (new Date(session.expires_at) < new Date()) {
        await restDelete("admin_sessions", `token=eq.${encodeURIComponent(token)}`);
        return jsonResponse({ valid: false }, 401);
      }

      return jsonResponse({
        valid: true,
        admin: {
          id: session.admin.id,
          name: session.admin.name,
          email: session.admin.email,
          avatar_url: session.admin.avatar_url,
        },
      });
    }

    // ---------- LOGOUT ----------
    if (action === "admin-logout") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        await restDelete("admin_sessions", `token=eq.${encodeURIComponent(token)}`);
      }
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("admin-auth error:", err);
    return jsonResponse({ error: message }, 500);
  }
});
