const path = require('path');

async function test() {
  const store = require(path.join(__dirname, '..', 'src', 'lib', 'data', 'catalog'));
  console.log('INITIAL_PRODUCTS length:', store.INITIAL_PRODUCTS.length);
  
  const activeProds = store.INITIAL_PRODUCTS.filter(p => p.isActive !== false);
  console.log('Active INITIAL_PRODUCTS count:', activeProds.length);

  const catCounts = {};
  activeProds.forEach(p => {
    catCounts[p.categoryId] = (catCounts[p.categoryId] || 0) + 1;
  });
  console.log('Category breakdown:');
  console.table(catCounts);
}

test();
