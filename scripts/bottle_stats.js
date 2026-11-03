const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function getStats(file) {
  const full = path.join(process.cwd(), 'Office Bazzar New Images', file);
  const { channels } = await sharp(full).stats();
  console.log(file);
  console.log(' R mean:', channels[0].mean.toFixed(1), 'G mean:', channels[1].mean.toFixed(1), 'B mean:', channels[2].mean.toFixed(1));
}

async function run() {
  await getStats('water bottle .jpeg');
  await getStats('Stainless Water Bottle.jpeg');
  await getStats('watter bottle normal .jpeg');
  await getStats('Milton Small Water Bottle 450  .jpeg');
}

run();
