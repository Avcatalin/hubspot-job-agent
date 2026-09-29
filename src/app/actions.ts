"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  JOB_STATUSES,
  syncSearchResults,
  updateJobStatus,
  type JobStatus,
} from "@/lib/jobs";
import { isSupabaseConfigured } from "@/lib/supabase";
import { JOB_SEARCH_QUERIES, searchJobs } from "@/search";

function messageUrl(message: string): string {
  return `/?message=${encodeURIComponent(message)}`;
}

export async function searchNowAction(): Promise<void> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY?.trim();
  let message: string;

  if (!apiKey) {
    redirect(
      messageUrl("Missing BRAVE_SEARCH_API_KEY. Add it to .env and try again."),
    );
  }

  if (!isSupabaseConfigured()) {
    redirect(
      messageUrl(
        "Missing Supabase configuration. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.",
      ),
    );
  }

  try {
    const results = await searchJobs(apiKey);
    const { inserted, updated } = await syncSearchResults(results);
    message = `Search complete: ${inserted} new, ${updated} already known, ${JOB_SEARCH_QUERIES.length} queries searched.`;
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    message = `Search failed: ${detail}`;
  }

  revalidatePath("/");
  redirect(messageUrl(message));
}

export async function updateJobStatusAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const status = formData.get("status");

  if (
    typeof id !== "string" ||
    typeof status !== "string" ||
    !JOB_STATUSES.includes(status as JobStatus)
  ) {
    throw new Error("Invalid job status update.");
  }

  await updateJobStatus(id, status as JobStatus);
  revalidatePath("/");
}
