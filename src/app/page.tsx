import Link from "next/link";

import { searchNowAction, updateJobStatusAction } from "./actions";
import { SearchButton } from "./search-button";
import {
  JOB_STATUSES,
  getJobs,
  type Job,
  type JobStatus,
} from "@/lib/jobs";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const FILTERS = ["all", ...JOB_STATUSES] as const;
type JobFilter = (typeof FILTERS)[number];

interface PageProps {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
}

function isJobFilter(value: string | undefined): value is JobFilter {
  return FILTERS.includes(value as JobFilter);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function JobCard({ job }: { job: Job }) {
  return (
    <article className="job-card">
      <div className="job-heading">
        <div>
          <span className={`status-badge status-${job.status}`}>{job.status}</span>
          <h2>{job.title}</h2>
        </div>
        <a href={job.url} target="_blank" rel="noreferrer" className="open-link">
          Open job
        </a>
      </div>

      <p className="description">
        {job.description || "No description available."}
      </p>
      <div className="job-meta">
        <span>Query: {job.sourceQuery}</span>
        <span>Discovered {formatDate(job.discoveredAt)}</span>
      </div>

      <form action={updateJobStatusAction} className="status-actions">
        <input type="hidden" name="id" value={job.id} />
        <button name="status" value="interested" type="submit">
          Interested
        </button>
        <button name="status" value="applied" type="submit">
          Applied
        </button>
        <button name="status" value="ignored" type="submit">
          Ignore
        </button>
      </form>
    </article>
  );
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeFilter = isJobFilter(params.status) ? params.status : "all";
  const configured = isSupabaseConfigured();
  let jobs: Job[] = [];
  let databaseError: string | null = null;

  if (configured) {
    try {
      jobs = await getJobs();
    } catch (error: unknown) {
      databaseError = error instanceof Error ? error.message : "Unknown error";
    }
  }

  const visibleJobs =
    activeFilter === "all"
      ? jobs
      : jobs.filter((job) => job.status === activeFilter);
  const counts = {
    total: jobs.length,
    new: jobs.filter((job) => job.status === "new").length,
    interested: jobs.filter((job) => job.status === "interested").length,
    applied: jobs.filter((job) => job.status === "applied").length,
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Personal job search</p>
          <h1>HubSpot Job Finder</h1>
          <p className="subtitle">
            Discover remote HubSpot roles and track the ones worth pursuing.
          </p>
        </div>
        <form action={searchNowAction}>
          <SearchButton disabled={!configured} />
        </form>
      </header>

      {!configured && (
        <div className="notice error-notice">
          Add SUPABASE_URL and SUPABASE_ANON_KEY to .env, then run the SQL in
          supabase/schema.sql.
        </div>
      )}
      {databaseError && <div className="notice error-notice">{databaseError}</div>}
      {params.message && <div className="notice">{params.message}</div>}

      <section className="stats" aria-label="Job totals">
        <div><strong>{counts.total}</strong><span>Total jobs</span></div>
        <div><strong>{counts.new}</strong><span>New</span></div>
        <div><strong>{counts.interested}</strong><span>Interested</span></div>
        <div><strong>{counts.applied}</strong><span>Applied</span></div>
      </section>

      <nav className="filters" aria-label="Filter jobs">
        {FILTERS.map((filter) => (
          <Link
            className={activeFilter === filter ? "active" : undefined}
            href={filter === "all" ? "/" : `/?status=${filter}`}
            key={filter}
          >
            {filter[0].toUpperCase() + filter.slice(1)}
          </Link>
        ))}
      </nav>

      <section className="job-list">
        {visibleJobs.map((job) => <JobCard job={job} key={job.id} />)}
        {configured && !databaseError && visibleJobs.length === 0 && (
          <div className="empty-state">
            No jobs in this view yet. Run a search to discover some.
          </div>
        )}
      </section>
    </main>
  );
}
