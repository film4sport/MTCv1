const { run } = require('../scripts/smoke/launch-smoke');

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
