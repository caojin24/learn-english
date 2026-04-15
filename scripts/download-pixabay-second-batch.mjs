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
  { slug: "fish", folder: "words/animals", query: "cute fish cartoon illustration", note: "fish" },
  { slug: "rabbit", folder: "words/animals", query: "cute rabbit cartoon illustration", note: "rabbit" },
  { slug: "duck", folder: "words/animals", query: "cute duck cartoon illustration", note: "duck" },
  { slug: "elephant", folder: "words/animals", query: "cute elephant cartoon illustration", note: "elephant" },
  { slug: "lion", folder: "words/animals", query: "cute lion cartoon illustration", note: "lion" },
  { slug: "grape", folder: "words/fruits", query: "grape cartoon illustration", note: "grape" },
  { slug: "orange", folder: "words/fruits", query: "orange fruit cartoon illustration", note: "orange" },
  { slug: "strawberry", folder: "words/fruits", query: "strawberry cartoon illustration", note: "strawberry" },
  { slug: "watermelon", folder: "words/fruits", query: "watermelon cartoon illustration", note: "watermelon" },
  { slug: "green", folder: "words/colors", query: "green color cartoon illustration", note: "green" },
  { slug: "pink", folder: "words/colors", query: "pink color cartoon illustration", note: "pink" },
  { slug: "black", folder: "words/colors", query: "black color cartoon illustration", note: "black" },
  { slug: "four", folder: "words/numbers", query: "number four cartoon illustration", note: "four" },
  { slug: "five", folder: "words/numbers", query: "number five cartoon illustration", note: "five" },
  { slug: "six", folder: "words/numbers", query: "number six cartoon illustration", note: "six" },
  { slug: "table", folder: "words/daily", query: "table cartoon illustration", note: "table" },
  { slug: "bed", folder: "words/daily", query: "bed cartoon illustration", note: "bed" },
  { slug: "pencil", folder: "words/daily", query: "pencil cartoon illustration", note: "pencil" },
  { slug: "clock", folder: "words/daily", query: "clock cartoon illustration", note: "clock" },
  { slug: "shoe", folder: "words/daily", query: "shoe cartoon illustration", note: "shoe" },
  { slug: "sleep", folder: "words/actions", query: "kid sleeping cartoon illustration", note: "sleep" },
  { slug: "eat", folder: "words/actions", query: "kid eating cartoon illustration", note: "eat" },
  { slug: "read", folder: "words/actions", query: "kid reading cartoon illustration", note: "read" },
  { slug: "sing", folder: "words/actions", query: "kid singing cartoon illustration", note: "sing" },
  { slug: "dance", folder: "words/actions", query: "kid dancing cartoon illustration", note: "dance" },

  { slug: "good-morning", folder: "phrases", query: "good morning kids cartoon illustration", note: "Good morning" },
  { slug: "time-for-breakfast", folder: "phrases", query: "breakfast kids cartoon illustration", note: "Time for breakfast" },
  { slug: "drink-some-water", folder: "phrases", query: "kid drinking water cartoon illustration", note: "Drink some water" },
  { slug: "lets-go-home", folder: "phrases", query: "kids going home cartoon illustration", note: "Let's go home" },
  { slug: "see-you-tomorrow", folder: "phrases", query: "kids waving goodbye cartoon illustration", note: "See you tomorrow" },
  { slug: "the-sky-is-blue", folder: "phrases", query: "blue sky cartoon illustration", note: "The sky is blue" },
  { slug: "i-have-two-hands", folder: "phrases", query: "two hands cartoon illustration", note: "I have two hands" },
  { slug: "look-at-the-flower", folder: "phrases", query: "flower cartoon illustration kids", note: "Look at the flower" },
  { slug: "the-baby-is-sleeping", folder: "phrases", query: "sleeping baby cartoon illustration", note: "The baby is sleeping" },
  { slug: "let-us-sing", folder: "phrases", query: "kids singing cartoon illustration", note: "Let us sing" },

  { slug: "star", folder: "rewards", query: "gold star cartoon icon", note: "奖励星星" },
  { slug: "badge", folder: "rewards", query: "badge medal cartoon icon", note: "奖励勋章" },
  { slug: "smile", folder: "rewards", query: "smile face cartoon icon", note: "笑脸奖励" },
  { slug: "clap", folder: "rewards", query: "clapping hands cartoon icon", note: "掌声图标" },

  { slug: "goodnight-moon", folder: "videos", query: "moon night cartoon illustration", note: "Goodnight Moon" },
  { slug: "pete-the-cat", folder: "videos", query: "cat shoes cartoon illustration", note: "Pete the Cat" },
  { slug: "chicka-chicka-boom-boom", folder: "videos", query: "alphabet tree cartoon illustration", note: "Chicka Chicka Boom Boom" },
  { slug: "alphablocks", folder: "videos", query: "alphabet blocks cartoon illustration", note: "Alphablocks" },
  { slug: "penelope", folder: "videos", query: "cute koala cartoon illustration", note: "Penelope" },
  { slug: "super-simple-songs", folder: "videos", query: "kids music cartoon illustration", note: "Super Simple Songs" },
  { slug: "yakka-dee", folder: "videos", query: "kids talking cartoon illustration", note: "Yakka Dee" },
  { slug: "wordworld", folder: "videos", query: "letters word cartoon illustration", note: "WordWorld" },
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

  const summaryPath = path.join(projectRoot, "public", "images", "pixabay-second-batch.json");
  await fs.writeFile(summaryPath, JSON.stringify(results, null, 2), "utf8");

  const markdownLines = [
    "# Pixabay 第二批图片下载清单",
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
  const markdownPath = path.join(projectRoot, "public", "images", "pixabay-second-batch.md");
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
