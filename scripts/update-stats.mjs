import { readFile, writeFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../stats.config.json", import.meta.url), "utf8"));
const output = new URL("../assets/coding-stats.svg", import.meta.url);
const isConfigured = (value) => value && !value.startsWith("YOUR_");

const escapeXml = (value) => String(value).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]);

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "User-Agent": "awwmar-profile-stats", ...options.headers } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function leetcode(handle) {
  const query = `query userProfile($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count } } profile { ranking } } }`;
  const data = await fetchJson("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: `https://leetcode.com/u/${handle}/` },
    body: JSON.stringify({ query, variables: { username: handle } })
  });
  const user = data.data?.matchedUser;
  if (!user) throw new Error("profile not found");
  const byLevel = Object.fromEntries(user.submitStats.acSubmissionNum.map((x) => [x.difficulty, x.count]));
  return { name: "LeetCode", value: byLevel.All ?? 0, detail: `Easy ${byLevel.Easy ?? 0}  ·  Medium ${byLevel.Medium ?? 0}  ·  Hard ${byLevel.Hard ?? 0}`, url: `https://leetcode.com/u/${handle}/`, color: "#f89f1b" };
}

async function codeforces(handle) {
  const [status, info] = await Promise.all([
    fetchJson(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`),
    fetchJson(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`)
  ]);
  const solved = new Set(status.result.filter((x) => x.verdict === "OK").map((x) => `${x.problem.contestId}-${x.problem.index}`)).size;
  const user = info.result[0];
  return { name: "Codeforces", value: solved, detail: `${user.rank ?? "Unrated"}  ·  Rating ${user.rating ?? "—"}  ·  Max ${user.maxRating ?? "—"}`, url: `https://codeforces.com/profile/${handle}`, color: "#3b82f6" };
}

async function geeksforgeeks(handle) {
  const url = `https://www.geeksforgeeks.org/profile/${encodeURIComponent(handle)}`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; awwmar-profile-stats/1.0)" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const patterns = [
    /problem(?:s)?\s+solved[^0-9]{0,120}([0-9][0-9,]*)/i,
    /([0-9][0-9,]*)[^<]{0,40}problem(?:s)?\s+solved/i,
    /total_problems_solved\\?"\s*:\s*\\?"?([0-9,]+)/i,
    /"problemSolved"\s*:\s*"?([0-9,]+)/i
  ];
  const match = patterns.map((pattern) => html.match(pattern)).find(Boolean);
  if (!match) throw new Error("solved count unavailable");
  const score = html.match(/(?:^|[,\\])\\?"?score\\?"?\s*:\s*([0-9,]+)/i)?.[1];
  return { name: "GeeksforGeeks", value: match[1].replaceAll(",", ""), detail: score ? `Problems solved  ·  Coding score ${score.replaceAll(",", "")}` : "Problems solved", url, color: "#2f8d46" };
}

const jobs = [
  ["leetcode", leetcode],
  ["codeforces", codeforces],
  ["geeksforgeeks", geeksforgeeks]
];

const cards = await Promise.all(jobs.map(async ([key, loader]) => {
  if (!isConfigured(config[key])) return { name: key, value: "—", detail: "Add handle in stats.config.json", color: "#8b949e" };
  try { return await loader(config[key]); }
  catch (error) { return { name: key, value: "—", detail: `Temporarily unavailable: ${error.message}`, color: "#ef4444" }; }
}));

const cardMarkup = cards.map((card, index) => {
  const x = 24 + index * 292;
  const label = card.name === "geeksforgeeks" ? "GeeksforGeeks" : card.name[0].toUpperCase() + card.name.slice(1);
  return `<g transform="translate(${x} 72)">
    <rect width="268" height="94" rx="12" fill="#161b22" stroke="#30363d"/>
    <circle cx="24" cy="24" r="5" fill="${card.color}"/>
    <text x="38" y="29" fill="#c9d1d9" font-size="14" font-weight="600">${escapeXml(label)}</text>
    <text x="20" y="65" fill="#f0f6fc" font-size="27" font-weight="800">${escapeXml(card.value)}</text>
    <text x="20" y="83" fill="#8b949e" font-size="10.5">${escapeXml(card.detail)}</text>
  </g>`;
}).join("\n");

const updated = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date());
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="190" viewBox="0 0 900 190" role="img" aria-labelledby="title desc">
  <title id="title">Competitive programming statistics</title>
  <desc id="desc">Live statistics from LeetCode, Codeforces and GeeksforGeeks</desc>
  <rect width="900" height="190" rx="18" fill="#0d1117" stroke="#30363d"/>
  <text x="24" y="40" fill="#f0f6fc" font-family="system-ui,sans-serif" font-size="20" font-weight="700">Problem-solving dashboard</text>
  <text x="876" y="39" text-anchor="end" fill="#6e7681" font-family="system-ui,sans-serif" font-size="11">Updated ${escapeXml(updated)}</text>
  <g font-family="system-ui,-apple-system,Segoe UI,sans-serif">${cardMarkup}</g>
</svg>\n`;

await writeFile(output, svg);
console.log(`Updated ${output.pathname}`);
