const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function check() {
  const full = path.join(process.cwd(), 'Office Bazzar New Images', 'Stationery', 'Key Board.jpeg');
  const stats = await sharp(full).stats();
  console.log('Channels mean:', stats.channels.map(c => c.mean.toFixed(1)));
}

check();
