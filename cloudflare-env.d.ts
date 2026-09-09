// Sites supplies the actual binding. Resource identifiers stay platform-managed.
declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    YOUTUBE_API_KEY?: string;
  }
}
