import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function isMissingColumnError(error) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return error?.code === "PGRST204" || message.includes("column") || message.includes("schema cache");
}

function normalizeUsageRecord(record, userId) {
  const legacyGenerationsUsed = record?.generations_used ?? 0;

  return {
    id: record?.id,
    user_id: record?.user_id ?? userId,
    free_generations_used: record?.free_generations_used ?? legacyGenerationsUsed,
    paid_generations: record?.paid_generations ?? 0,
    legacy: !Object.prototype.hasOwnProperty.call(record ?? {}, "free_generations_used"),
  };
}

async function fetchUsageRow(client, userId) {
  const { data, error } = await client
    .from("users_usage")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

async function insertUsageRow(client, userId) {
  const modernInsert = await client
    .from("users_usage")
    .insert({ user_id: userId, free_generations_used: 0, paid_generations: 0 })
    .select("*")
    .single();

  if (!modernInsert.error) {
    return modernInsert.data;
  }

  if (modernInsert.error.code === "23505") {
    return fetchUsageRow(client, userId);
  }

  if (!isMissingColumnError(modernInsert.error)) {
    throw modernInsert.error;
  }

  const legacyInsert = await client
    .from("users_usage")
    .insert({ user_id: userId, generations_used: 0 })
    .select("*")
    .single();

  if (!legacyInsert.error) {
    return legacyInsert.data;
  }

  if (legacyInsert.error.code === "23505") {
    return fetchUsageRow(client, userId);
  }

  throw legacyInsert.error;
}

export const assertSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }

  return supabase;
};

export const ensureUserUsageRecord = async (userId) => {
  const client = assertSupabaseConfigured();

  const existing = await fetchUsageRow(client, userId);
  if (existing) {
    return normalizeUsageRecord(existing, userId);
  }

  const created = await insertUsageRow(client, userId);
  return normalizeUsageRecord(created, userId);
};

export const incrementUserUsage = async (userId, mode) => {
  const client = assertSupabaseConfigured();
  const currentUsage = await ensureUserUsageRecord(userId);

  const modernPayload = {
    free_generations_used: currentUsage.free_generations_used + (mode === "free" ? 1 : 0),
    paid_generations: currentUsage.paid_generations + (mode === "paid" ? 1 : 0),
  };

  const modernUpdate = await client
    .from("users_usage")
    .update(modernPayload)
    .eq("id", currentUsage.id)
    .select("*")
    .single();

  if (!modernUpdate.error) {
    return normalizeUsageRecord(modernUpdate.data, userId);
  }

  if (!isMissingColumnError(modernUpdate.error)) {
    throw modernUpdate.error;
  }

  const legacyPayload = {
    generations_used: currentUsage.free_generations_used + (mode === "free" ? 1 : 0),
  };

  const legacyUpdate = await client
    .from("users_usage")
    .update(legacyPayload)
    .eq("id", currentUsage.id)
    .select("*")
    .single();

  if (legacyUpdate.error) {
    throw legacyUpdate.error;
  }

  return normalizeUsageRecord(legacyUpdate.data, userId);
};
