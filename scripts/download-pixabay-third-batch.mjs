import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.PIXABAY_KEY;

if (!API_KEY) {
  console.error("Missing PIXABAY_KEY environment variable.");
  process.exit(1);
}

const projectRoot = process.cwd();
const imagesRoot = path.join(projectRoot, "public", "images");

const plan = [
  { slug: "monkey", folder: "words/animals", query: "cute monkey cartoon illustration", note: "monkey" },
  { slug: "panda", folder: "words/animals", query: "cute panda cartoon illustration", note: "panda" },
  { slug: "tiger", folder: "words/animals", query: "cute tiger cartoon illustration", note: "tiger" },
  { slug: "frog", folder: "words/animals", query: "cute frog cartoon illustration", note: "frog" },
  { slug: "horse", folder: "words/animals", query: "cute horse cartoon illustration", note: "horse" },
  { slug: "sheep", folder: "words/animals", query: "cute sheep cartoon illustration", note: "sheep" },
  { slug: "pineapple", folder: "words/fruits", query: "pineapple cartoon illustration", note: "pineapple" },
  { slug: "peach", folder: "words/fruits", query: "peach fruit cartoon illustration", note: "peach" },
  { slug: "mango", folder: "words/fruits", query: "mango cartoon illustration", note: "mango" },
  { slug: "lemon", folder: "words/fruits", query: "lemon cartoon illustration", note: "lemon" },
  { slug: "purple", folder: "words/colors", query: "purple color cartoon illustration", note: "purple" },
  { slug: "white", folder: "words/colors", query: "white color cartoon illustration", note: "white" },
  { slug: "brown", folder: "words/colors", query: "brown color cartoon illustration", note: "brown" },
  { slug: "seven", folder: "words/numbers", query: "number seven cartoon illustration", note: "seven" },
  { slug: "eight", folder: "words/numbers", query: "number eight cartoon illustration", note: "eight" },
  { slug: "nine", folder: "words/numbers", query: "number nine cartoon illustration", note: "nine" },
  { slug: "ten", folder: "words/numbers", query: "number ten cartoon illustration", note: "ten" },
  { slug: "door", folder: "words/daily", query: "door cartoon illustration", note: "door" },
  { slug: "window", folder: "words/daily", query: "window cartoon illustration", note: "window" },
  { slug: "plate", folder: "words/daily", query: "plate cartoon illustration", note: "plate" },
  { slug: "spoon", folder: "words/daily", query: "spoon cartoon illustration", note: "spoon" },
  { slug: "hat", folder: "words/daily", query: "hat cartoon illustration", note: "hat" },
  { slug: "bike", folder: "words/daily", query: "bicycle cartoon illustration", note: "bike" },
  { slug: "wash", folder: "words/actions", query: "kid washing cartoon illustration", note: "wash" },
  { slug: "draw", folder: "words/actions", query: "kid drawing cartoon illustration", note: "draw" },
  { slug: "write", folder: "words/actions", query: "kid writing cartoon illustration", note: "write" },
  { slug: "swim", folder: "words/actions", query: "kid swimming cartoon illustration", note: "swim" },
  { slug: "laugh", folder: "words/actions", query: "kid laughing cartoon illustration", note: "laugh" },
  { slug: "open", folder: "words/actions", query: "kid opening door cartoon illustration", note: "open" },

  { slug: "open-your-book", folder: "phrases", query: "kid open book cartoon illustration", note: "Open your book" },
  { slug: "close-the-door", folder: "phrases", query: "close door cartoon illustration kids", note: "Close the door" },
  { slug: "sit-down-please", folder: "phrases", query: "kid sitting chair cartoon illustration", note: "Sit down, please" },
  { slug: "stand-up", folder: "phrases", query: "kid standing cartoon illustration", note: "Stand up" },
  { slug: "put-on-your-shoes", folder: "phrases", query: "kid putting on shoes cartoon illustration", note: "Put on your shoes" },
  { slug: "brush-your-teeth", folder: "phrases", query: "kid brushing teeth cartoon illustration", note: "Brush your teeth" },
  { slug: "i-am-happy", folder: "phrases", query: "happy kid cartoon illustration", note: "I am happy" },
  { slug: "i-am-hungry", folder: "phrases", query: "hungry kid cartoon illustration", note: "I am hungry" },
  { slug: "it-is-raining", folder: "phrases", query: "rain cartoon illustration kids", note: "It is raining" },
  { slug: "let-us-read", folder: "phrases", query: "kids reading cartoon illustration", note: "Let us read" },
  { slug: "this-is-my-bag", folder: "phrases", query: "school bag cartoon kid illustration", note: "This is my bag" },
  { slug: "where-is-the-cat", folder: "phrases", query: "cat hiding cartoon illustration", note: "Where is the cat?" },
  { slug: "look-at-the-moon", folder: "phrases", query: "moon cartoon illustration kids", note: "Look at the moon" },
  { slug: "the-flower-is-pink", folder: "phrases", query: "pink flower cartoon illustration", note: "The flower is pink" },
  { slug: "i-can-jump", folder: "phrases", query: "kid jumping cartoon illustration", note: "I can jump" },
];

function scoreHit(hit) {
  let score = 0;
  score += Math.min(hit.imageWidth ?? 0, hit.imageHeight ?? 0) / 10;
  score += (hit.downloads ?? 0) / 5;
  score += (hit.likes ?? 0) * 8;
  score += hit.type === "illustration" ? 60 : 0;
  const tags = String(hit.tags ?? "").toLowerCase();
  if (tags.includes("cartoon")) score += 40;
  if (tags.includes("cute")) score += 30;
  if (tags.includes("kid")) score += 20;
  return score;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function downloadBinary(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

async function searchBestHit(item) {
  const endpoint = new URL("https://pixabay.com/api/");
  endpoint.searchParams.set("key", API_KEY);
  endpoint.searchParams.set("q", item.query);
  endpoint.searchParams.set("image_type", "illustration");
  endpoint.searchParams.set("safesearch", "true");
  endpoint.searchParams.set("per_page", "10");
  endpoint.searchParams.set("editors_choice", "true");

  const data = await fetchJson(endpoint.toString());
  const hits = Array.isArray(data.hits) ? data.hits : [];
  if (hits.length === 0) {
    return null;
  }

  return hits
    .filter((hit) => hit.largeImageURL || hit.webformatURL)
    .sort((a, b) => scoreHit(b) - scoreHit(a))[0] ?? null;
}

async function main() {
  const results = [];

  for (const item of plan) {
    const folderPath = path.join(imagesRoot, item.folder);
    await ensureDir(folderPath);
    const filePath = path.join(folderPath, `${item.slug}.jpg`);

    try {
      const hit = await searchBestHit(item);

      if (!hit) {
        results.push({ ...item, status: "missing" });
        console.log(`MISS  ${item.note} -> ${item.query}`);
        continue;
      }

      const imageUrl = hit.largeImageURL || hit.webformatURL;
      await downloadBinary(imageUrl, filePath);

      results.push({
        ...item,
        status: "downloaded",
        file: path.relative(projectRoot, filePath),
        source: hit.pageURL,
        pixabayId: hit.id,
        author: hit.user,
      });

      console.log(`OK    ${item.note} -> ${path.relative(projectRoot, filePath)}`);
    } catch (error) {
      results.push({
        ...item,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`ERROR ${item.note} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const summaryPath = path.join(projectRoot, "public", "images", "pixabay-third-batch.json");
  await fs.writeFile(summaryPath, JSON.stringify(results, null, 2), "utf8");

  const markdownLines = [
    "# Pixabay 第三批图片下载清单",
    "",
    "| 状态 | 说明 | 文件 | 查询词 | 来源 |",
    "|---|---|---|---|---|",
    ...results.map((item) => {
      const status = item.status === "downloaded" ? "已下载" : item.status === "missing" ? "未找到" : "失败";
      const file = item.file ?? "-";
      const source = item.source ? `[Pixabay](${item.source})` : "-";
      return `| ${status} | ${item.note} | ${file} | ${item.query} | ${source} |`;
    }),
    "",
  ];
  const markdownPath = path.join(projectRoot, "public", "images", "pixabay-third-batch.md");
  await fs.writeFile(markdownPath, markdownLines.join("\n"), "utf8");

  const counts = results.reduce(
    (accumulator, item) => {
      accumulator[item.status] += 1;
      return accumulator;
    },
    { downloaded: 0, missing: 0, error: 0 },
  );

  console.log("");
  console.log(`Downloaded: ${counts.downloaded}, Missing: ${counts.missing}, Error: ${counts.error}`);
  console.log(`Summary JSON: ${path.relative(projectRoot, summaryPath)}`);
  console.log(`Summary MD:   ${path.relative(projectRoot, markdownPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
