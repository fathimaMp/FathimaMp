// generate.js
const axios = require("axios");
const cheerio = require("cheerio");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs");
const path = require("path");

const USERNAME = process.env.GITHUB_USERNAME || "USERNAME"; // set in workflow or replace
const OUT = "contrib-rush.gif";

// STEP 1: fetch contributions SVG from GitHub
async function fetchContribSvg(username) {
  const url = `https://github.com/users/${username}/contributions`;
  const res = await axios.get(url, { headers: { "User-Agent": "contrib-rush" } });
  return res.data;
}

// STEP 2: parse into 7xN grid of activity (counts)
function parseContribSvg(svg) {
  const $ = cheerio.load(svg);
  const rects = $("rect[data-date]");
  // Collect weeks as columns: each rect has x/y attributes; simpler: group by x
  const grid = {}; // x -> array of (y,index)->count
  rects.each((i, el) => {
    const x = parseInt($(el).attr("x"));
    const y = parseInt($(el).attr("y"));
    const date = $(el).attr("data-date"); 
    const count = parseInt($(el).attr("data-count") || "0");
    if (!grid[x]) grid[x] = [];
    grid[x].push({ y, date, count });
  });
  // sort columns by x ascending; each column should have up to 7 cells (y values)
  const columns = Object.keys(grid).sort((a, b) => parseInt(a) - parseInt(b)).map(x => {
    // sort by y ascending (top->bottom) - but github y increases by 13 steps; we normalize by sort
    return grid[x].sort((a, b) => a.y - b.y).map(cell => cell.count);
  });
  // Ensure each column has exactly 7 entries (some may be shorter at edges) -> pad with zeros at start
  const normalized = columns.map(col => {
    const copy = col.slice();
    while (copy.length < 7) copy.push(0);
    return copy;
  });
  return normalized; // array of columns, each column is [day0..day6] counts
}

// STEP 3: turn counts into tile colors/levels
function countToLevel(count) {
  if (!count || count === 0) return 0;
  if (count >= 1 && count <= 3) return 1;
  if (count >= 4 && count <= 7) return 2;
  return 3;
}

// STEP 4: draw frames and encode gif
async function renderGif(columns) {
  const tileSize = 12;
  const rows = 7;
  const visibleWeeks = 32; // how many columns visible in GIF frame
  const width = visibleWeeks * tileSize;
  const height = rows * tileSize;
  const encoder = new GIFEncoder(width, height);
  const stream = fs.createWriteStream(OUT);
  encoder.createReadStream().pipe(stream);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(60); // ms per frame
  encoder.setQuality(10);

  const totalColumns = columns.length;
  // simulate runner moving across columns with continuous forward movement
  const framesPerColumn = 3; // smoothing
  const totalFrames = (totalColumns + visibleWeeks) * framesPerColumn; // scroll from left to right

  // Precompute palette colors for levels
  const palette = [
    "#ebedf0", // 0
    "#9be9a8", // 1
    "#40c463", // 2
    "#30a14e"  // 3
  ];

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  let runnerY = Math.floor(rows / 2); // start vertical center
  let runnerXpos = -visibleWeeks * tileSize; // start off-screen left so gif enters
  for (let f = 0; f < totalFrames; f++) {
    // clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // compute scroll column index at this frame
    const scrollPx = (f / framesPerColumn) * tileSize; // pixels scrolled from leftmost
    // draw visible grid
    for (let col = 0; col < visibleWeeks; col++) {
      const globalCol = Math.floor((f / framesPerColumn)) + col - Math.max(0, visibleWeeks - totalColumns);
      // real data col index
      const dataColIndex = globalCol;
      for (let r = 0; r < rows; r++) {
        const x = col * tileSize - (scrollPx % tileSize);
        const y = r * tileSize;
        let level = 0;
        if (dataColIndex >= 0 && dataColIndex < totalColumns) {
          level = countToLevel(columns[dataColIndex][r] || 0);
        }
        // tile background
        ctx.fillStyle = palette[level];
        ctx.fillRect(Math.round(x), Math.round(y), tileSize - 1, tileSize - 1);
      }
    }

    // Runner: position it near the left third of viewport horizontally, moves slightly vertically if hits obstacle
    const runnerScreenX = Math.floor(width * 0.25);
    // Compute which data column runner currently over
    const runnerGlobalCol = Math.floor((f / framesPerColumn) + Math.floor(visibleWeeks * 0.25));
    if (runnerGlobalCol >= 0 && runnerGlobalCol < totalColumns) {
      // if tile at runner's row has high activity (level 3), treat as power-up so runner jumps up
      const currentLevel = countToLevel(columns[runnerGlobalCol][runnerY] || 0);
      if (currentLevel >= 3 && Math.random() < 0.25) {
        // small vertical hop
        runnerY = Math.max(0, runnerY - 1);
      } else if (Math.random() < 0.05) {
        runnerY = Math.min(rows - 1, runnerY + 1);
      }
    } else {
      // idle random drift
      if (Math.random() < 0.03) runnerY = Math.max(0, runnerY - 1);
      if (Math.random() < 0.03) runnerY = Math.min(rows - 1, runnerY + 1);
    }

    // draw runner as a little circle with eyes (funny)
    const rx = runnerScreenX;
    const ry = runnerY * tileSize + tileSize / 2;
    // shadow
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.ellipse(rx, ry + tileSize*0.3, tileSize*0.6, tileSize*0.25, 0, 0, 2*Math.PI);
    ctx.fill();
    // body
    ctx.beginPath();
    ctx.fillStyle = "#ffcc00";
    ctx.arc(rx, ry, tileSize*0.9, 0, Math.PI*2);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(rx - 4, ry - 3, 3, 3);
    ctx.fillRect(rx + 2, ry - 3, 3, 3);
    // smile
    ctx.beginPath();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.arc(rx, ry + 1, 4, 0, Math.PI);
    ctx.stroke(); 

    // small score text (optionally)
    ctx.fillStyle = "#000";
    ctx.font = "10px Sans";
    ctx.fillText("Rush", 4, 10);

    encoder.addFrame(ctx);
  }

  encoder.finish();
  console.log("Saved", OUT);
}

(async () => {
  try {
    console.log("Fetching contributions for", USERNAME);
    const svg = await fetchContribSvg(USERNAME);
    const columns = parseContribSvg(svg);
    if (!columns || columns.length === 0) {
      throw new Error("No contribution columns parsed. Check username or fetched SVG.");
    }
    await renderGif(columns);
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
})();
