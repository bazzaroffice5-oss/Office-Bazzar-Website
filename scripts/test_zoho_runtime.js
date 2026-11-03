const path = require('path');

async function testZoho() {
  const { getProductsFromZoho } = require(path.join(__dirname, '..', 'src', 'lib', 'zoho', 'products'));
  const prods = await getProductsFromZoho();
  console.log('getProductsFromZoho total:', prods.length);
  const activeProds = prods.filter(p => p.isActive !== false);
  console.log('getProductsFromZoho active:', activeProds.length);
}

testZoho();

