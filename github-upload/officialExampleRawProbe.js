const { getKrdictApiKey } = require("./env");
const { buildKrdictExampleSearchUrl } = require("./officialExampleSource");

async function main() {
  const apiKey = getKrdictApiKey();

  if (!apiKey) {
    console.log("KRDICT_API_KEY is not set.");
    return;
  }

  const query = "먹고 싶다";
  const url = buildKrdictExampleSearchUrl({
    apiKey,
    query,
    num: 10
  });

  console.log("URL:", url);

  const response = await fetch(url, {
    headers: {
      Accept: "application/xml, text/xml;q=0.9, */*;q=0.8"
    }
  });

  const xml = await response.text();
  console.log(xml.slice(0, 5000));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
