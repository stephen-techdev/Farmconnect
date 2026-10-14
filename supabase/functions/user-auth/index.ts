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
    if (action === "user-register") {
      const { name, email, password, phone, avatar_url } = await req.json();
      if (!name || !email || !password) {
        return jsonResponse({ error: "Name, email, and password are required" }, 400);
      }

      const existing = await restSelect(
        "app_users",
        `select=id&email=eq.${encodeURIComponent(email)}`,
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return jsonResponse({ error: "An account with this email already exists" }, 409);
      }

      const row = await restInsert("app_users", {
        name,
        email,
        password: await hashPassword(password),
        phone: phone || null,
        avatar_url: avatar_url || null,
      });

      return jsonResponse({
        user: { id: row.id, name: row.name, email: row.email, phone: row.phone, avatar_url: row.avatar_url },
      });
    }

    // ---------- LOGIN ----------
    if (action === "user-login") {
      const { email, password } = await req.json();
      if (!email || !password) {
        return jsonResponse({ error: "Email and password are required" }, 400);
      }

      const rows = await restSelect(
        "app_users",
        `select=*&email=eq.${encodeURIComponent(email)}`,
      );
      const user = Array.isArray(rows) ? rows[0] : null;

      if (!user || !(await verifyPassword(password, user.password))) {
        return jsonResponse({ error: "Invalid email or password" }, 401);
      }

      // Legacy accounts stored plaintext: upgrade to a hash now that we have the plaintext.
      if (!isHashed(user.password)) {
        try {
          await restUpdate("app_users", `id=eq.${user.id}`, {
            password: await hashPassword(password),
          });
        } catch (err) {
          // Non-fatal: login still succeeds, upgrade retries next time.
          console.error("user password upgrade failed:", err);
        }
      }

      const token = crypto.randomUUID() + crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await restInsert("user_sessions", {
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

      return jsonResponse({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar_url: user.avatar_url,
        },
      });
    }

    // ---------- VERIFY ----------
    if (action === "user-verify") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return jsonResponse({ valid: false }, 401);
      }
      const token = authHeader.replace("Bearer ", "");

      const rows = await restSelect(
        "user_sessions",
        `select=*,user:app_users(*)&token=eq.${encodeURIComponent(token)}`,
      );
      const session = Array.isArray(rows) ? rows[0] : null;

      if (!session) {
        return jsonResponse({ valid: false }, 401);
      }

      if (new Date(session.expires_at) < new Date()) {
        await restDelete("user_sessions", `token=eq.${encodeURIComponent(token)}`);
        return jsonResponse({ valid: false }, 401);
      }

      return jsonResponse({
        valid: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          phone: session.user.phone,
          avatar_url: session.user.avatar_url,
        },
      });
    }

    // ---------- LOGOUT ----------
    if (action === "user-logout") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        await restDelete("user_sessions", `token=eq.${encodeURIComponent(token)}`);
      }
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("user-auth error:", err);
    return jsonResponse({ error: message }, 500);
  }
});
