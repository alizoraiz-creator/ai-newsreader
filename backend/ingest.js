const { ingestNews } = require("./services/ingestionService");

console.log("Starting manual ingestion script...");
ingestNews().then(() => {
  console.log("Done!");
  process.exit(0);
});
