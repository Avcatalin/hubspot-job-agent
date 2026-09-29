import "server-only";

import type { SearchResult } from "@/search";

import { getSupabaseClient } from "./supabase";

export const JOB_STATUSES = [
  "new",
  "interested",
  "applied",
  "ignored",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface Job {
  id: string;
  title: string;
  url: string;
  description: string;
  sourceQuery: string;
  source: string;
  company: string | null;
  location: string | null;
  discoveredAt: string;
  lastSeenAt: string;
  status: JobStatus;
}

interface JobRow {
  id: string;
  title: string;
  url: string;
  description: string;
  source_query: string;
  source: string;
  company: string | null;
  location: string | null;
  discovered_at: string;
  last_seen_at: string;
  status: JobStatus;
}

function fromRow(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    sourceQuery: row.source_query,
    source: row.source,
    company: row.company,
    location: row.location,
    discoveredAt: row.discovered_at,
    lastSeenAt: row.last_seen_at,
    status: row.status,
  };
}

export async function getJobs(): Promise<Job[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id,title,url,description,source_query,source,company,location,discovered_at,last_seen_at,status",
    )
    .order("discovered_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load jobs: ${error.message}`);
  }

  return (data as JobRow[]).map(fromRow);
}

export async function syncSearchResults(
  results: SearchResult[],
): Promise<{ inserted: number; updated: number }> {
  if (results.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  const supabase = getSupabaseClient();
  const urls = results.map((result) => result.url);
  const { data: existingRows, error: existingError } = await supabase
    .from("jobs")
    .select("url")
    .in("url", urls);

  if (existingError) {
    throw new Error(`Could not check existing jobs: ${existingError.message}`);
  }

  const existingUrls = new Set(
    (existingRows as Array<{ url: string }>).map((row) => row.url),
  );
  const newResults = results.filter((result) => !existingUrls.has(result.url));
  const now = new Date().toISOString();

  if (existingUrls.size > 0) {
    const { error } = await supabase
      .from("jobs")
      .update({ last_seen_at: now })
      .in("url", [...existingUrls]);

    if (error) {
      throw new Error(`Could not update existing jobs: ${error.message}`);
    }
  }

  if (newResults.length > 0) {
    const rows = newResults.map((result) => ({
      title: result.title,
      url: result.url,
      description: result.description,
      source_query: result.sourceQuery,
      source: "brave",
      company: null,
      location: null,
      discovered_at: now,
      last_seen_at: now,
      status: "new" satisfies JobStatus,
    }));
    const { error } = await supabase
      .from("jobs")
      .upsert(rows, { onConflict: "url", ignoreDuplicates: true });

    if (error) {
      throw new Error(`Could not insert new jobs: ${error.message}`);
    }
  }

  return { inserted: newResults.length, updated: existingUrls.size };
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("jobs").update({ status }).eq("id", id);

  if (error) {
    throw new Error(`Could not update job status: ${error.message}`);
  }
}
