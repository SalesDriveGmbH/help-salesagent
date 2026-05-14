const BRANCH = "main";

function repo() {
  const owner = import.meta.env.GITHUB_REPO_OWNER;
  const name = import.meta.env.GITHUB_REPO_NAME;
  if (!owner || !name) throw new Error("GITHUB_REPO_OWNER / GITHUB_REPO_NAME nicht gesetzt");
  return { owner, name };
}

function headers() {
  return {
    Authorization: `Bearer ${import.meta.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function b64encode(s: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(s, "utf-8").toString("base64");
  // Edge fallback
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64decode(s: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(s, "base64").toString("utf-8");
  const bin = atob(s.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export async function getFile(path: string): Promise<{ content: string; sha: string } | null> {
  const { owner, name } = repo();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`,
    { headers: headers() },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub getFile: ${res.status} ${await res.text()}`);
  const data: any = await res.json();
  return { content: b64decode(data.content), sha: data.sha };
}

export async function commitFile(opts: {
  path: string;
  content: string;
  message: string;
  sha?: string;
}) {
  const { owner, name } = repo();
  const body: any = {
    message: opts.message,
    content: b64encode(opts.content),
    branch: BRANCH,
  };
  if (opts.sha) body.sha = opts.sha;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(opts.path)}`,
    { method: "PUT", headers: headers(), body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`GitHub commitFile: ${res.status} ${await res.text()}`);
  return await res.json();
}

export async function listFileCommits(path: string, limit = 10) {
  const { owner, name } = repo();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/commits?path=${encodeURIComponent(path)}&per_page=${limit}`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error(`GitHub listFileCommits: ${res.status}`);
  return (await res.json()) as any[];
}

export async function getFileAtCommit(path: string, sha: string): Promise<string | null> {
  const { owner, name } = repo();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(path)}?ref=${sha}`,
    { headers: headers() },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub getFileAtCommit: ${res.status}`);
  const data: any = await res.json();
  return b64decode(data.content);
}
