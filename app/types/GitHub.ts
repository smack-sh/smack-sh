export interface GitHubUserResponse {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  public_gists: number;
  created_at: string;
  updated_at: string;
}

export interface GitLabProjectInfo {
  id: number; // GitLab project IDs are typically numbers.
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  default_branch: string;
  updated_at: string;
  language: string;
  languages_url: string;
}

export interface GitHubRepoInfo {
  id: number; // GitHub repository IDs are typically numbers, not strings.
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  default_branch: string;
  updated_at: string;
  language: string | null;
  languages_url: string;
  private?: boolean;
  topics?: string[];
  archived?: boolean;
  fork?: boolean;
  size?: number;
  contributors_count?: number;
  branches_count?: number;
  issues_count?: number;
  pull_requests_count?: number;
  license?: {
    name: string | null;
    spdx_id: string | null;
  } | null;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null; // download_url can be null for directories or files that are too large.
  type: string;
  content?: string; // Content is typically only present for files, not directories, and might be base64 encoded.
  encoding?: string; // Encoding is typically only present for files.
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface GitHubBlobResponse {
  content: string;
  encoding: string;
  sha: string;
  size: number;
  url: string;
}

export interface GitHubOrganization {
  login: string;
  name: string | null;
  avatar_url: string;
  description: string | null; // Description can be null.
  html_url: string;
  public_repos?: number;
  followers?: number;
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: {
    name: string;
    url: string;
  };
  payload: {
    action?: string;
    ref?: string;
    ref_type?: 'branch' | 'tag' | 'repository' | 'blob' | 'commit'; // More specific ref_type for common events.
    description?: string;

    // Payload content varies greatly by event type. Adding a generic index signature or `any` might be necessary depending on usage.
    [key: string]: any;
  };
}

export interface GitHubLanguageStats {
  [key: string]: number;
}

export interface GitHubStats {
  repos: GitHubRepoInfo[];
  totalStars: number;
  totalForks: number;
  organizations: GitHubOrganization[];
  recentActivity: GitHubEvent[];
  languages: GitHubLanguageStats;
  totalGists: number;
  publicRepos: number;
  privateRepos: number; // This might be zero if not accessible/private repos are not considered.
  /*
   * stars: number; // User's total stars from all their repos - Removed as redundant with totalStars
   * forks: number; // User's total forks from all their repos - Removed as redundant with totalForks
   */
  followers: number; // User's followers count
  publicGists: number;
  privateGists: number; // This might be zero if not accessible/private gists are not considered.
  lastUpdated: string;
  totalBranches?: number;
  totalContributors?: number;
  totalIssues?: number;
  totalPullRequests?: number;
  mostUsedLanguages?: Array<{
    language: string;
    bytes: number;
    repos: number;
  }>;
}

export interface GitHubConnection {
  user: GitHubUserResponse | null;
  token: string;
  tokenType: 'classic' | 'fine-grained';
  stats?: GitHubStats;
  rateLimit?: GitHubRateLimits;
}

export interface GitHubTokenInfo {
  token: string;
  scope: string[];
  avatar_url: string;
  name: string | null;
  created_at: string;

  // followers: number; // Removed as it's a dynamic user stat, not token info.
  token_id?: string; // Potentially add `token_id` if needed from API response (e.g., for fine-grained tokens).
  application?: { name: string; url: string }; // Potentially add `application` fields if needed from API response (for OAuth apps).
}

export interface GitHubRateLimits {
  limit: number;
  remaining: number;
  reset: Date; // Assuming API response's reset time is parsed into a Date object.
  used: number;
}

export interface GitHubAuthState {
  username: string | null; // Username might be null if not yet determined or failed.
  tokenInfo: GitHubTokenInfo | null;
  isConnected: boolean;
  isVerifying: boolean;
  isLoadingRepos: boolean;
  rateLimits?: GitHubRateLimits;
}

export interface RepositoryStats {
  totalFiles: number;
  totalSize: number; // Size in bytes
  languages: Record<string, number>;
  hasPackageJson: boolean;
  hasDependencies: boolean;
}
