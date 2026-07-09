import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext → Cloudflare Workers adapter config.
 *
 * Defaults are correct for this app: it holds all mutable state in in-memory
 * module scope (see the "Known limitations" note in the README), so there's no
 * incremental-cache, tag-cache, or queue to wire up here yet. When the
 * production build moves that state to KV / D1 / Durable Objects, configure the
 * matching caches in this file.
 */
export default defineCloudflareConfig();
