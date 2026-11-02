import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

const searchBrands = [
  'dettol', 'lifebuoy', 'godrej', 'harpic', 'lysol', 'colgate', 'pepsodent', 'santoor',
  'savlon', 'hit', 'good knight', 'baygon', 'mortien', 'mortein', 'ariel', 'surf', 'tide',
  'rin', 'wheel', 'ghadi', 'sunlight', 'comfort', 'colin', 'odonil', 'airwick', 'ambi pur',
  'aer', 'scotch brite', 'gala', 'spotzero', 'milton', 'cello', 'nayasa', 'tupperware',
  'borosil', 'eagle', 'treo', 'kores', 'camlin', 'kokuyo', 'kangaro', 'natraj', 'apsara',
  'doms', 'staedtler', 'pilot', 'uniball', 'uni-ball', 'parker', 'sheaffer', 'cross', 'flair',
  'linc', 'pentel', 'zebra', 'classmate', 'navneet', 'itc', 'solo', 'bindex', 'deluxe'
];

console.log('Searching all 383 products for brand occurrences:');
for (const p of INITIAL_PRODUCTS) {
  const text = (p.name + ' ' + (p.description || '')).toLowerCase();
  for (const b of searchBrands) {
    if (text.includes(b)) {
      console.log(`[${p.sku}] ${p.name} -> matches '${b}' (Image: ${p.images[0]})`);
      break;
    }
  }
}

