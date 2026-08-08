const {
  buildKrdictExampleSearchUrl,
  buildKrdictEntrySearchUrl,
  buildKrdictViewUrl,
  parseKrdictExampleSearchXml,
  parseKrdictViewXml,
  getOfficialEntryQueryForGrammar,
  getOfficialExampleQueryForGrammar,
  getOfficialExampleQueryForChain,
  fetchKrdictEntries,
  fetchKrdictEntry,
  getOfficialExampleForGrammar,
  getOfficialExampleForExercise
} = require("./officialExampleSource");

const sampleSearchXml = `<?xml version="1.0" encoding="UTF-8"?>
<channel>
  <total>1</total>
  <start>1</start>
  <num>10</num>
  <item>
    <target_code>12345</target_code>
    <word>가다</word>
    <sup_no>0</sup_no>
    <example>민수가 집에 가고 싶은 것 같아요.</example>
    <link>https://krdict.korean.go.kr/dicSearch/SearchView?ParaWordNo=12345</link>
  </item>
</channel>`;

const sampleViewXml = `<?xml version="1.0" encoding="UTF-8"?>
<channel>
  <item>
    <target_code>12345</target_code>
    <word>가다</word>
    <sup_no>0</sup_no>
    <link>https://krdict.korean.go.kr/dicSearch/SearchView?ParaWordNo=12345</link>
    <example_info>
      <example>민수가 집에 가고 싶은 것 같아요.</example>
      <translation>Кажется, Минсу хочет пойти домой.</translation>
    </example_info>
  </item>
</channel>`;

function pass(name) {
  console.log("PASS", name);
}

function fail(name, expected, actual) {
  console.log("FAIL", name);
  console.log("  expected:", expected);
  console.log("  actual:", actual);
}

async function run() {
  const searchUrl = buildKrdictExampleSearchUrl({
    apiKey: "demo-key",
    query: "고 싶은 것 같",
    translated: true,
    transLang: 10
  });

  if (searchUrl.includes("key=demo-key") && searchUrl.includes("part=exam") && searchUrl.includes("target=3")) {
    pass("build search url");
  } else {
    fail("build search url", "url with key/part/target", searchUrl);
  }

  const viewUrl = buildKrdictViewUrl({
    apiKey: "demo-key",
    targetCode: 12345,
    translated: true,
    transLang: 10
  });

  if (viewUrl.includes("method=target_code") && viewUrl.includes("q=12345")) {
    pass("build view url");
  } else {
    fail("build view url", "url with target_code", viewUrl);
  }

  const entrySearchUrl = buildKrdictEntrySearchUrl({
    apiKey: "demo-key",
    query: "-고 싶다",
    num: 10
  });

  if (entrySearchUrl.includes("part=word") && entrySearchUrl.includes("target=1")) {
    pass("build entry search url");
  } else {
    fail("build entry search url", "url with part=word and target=1", entrySearchUrl);
  }

  const parsedSearch = parseKrdictExampleSearchXml(sampleSearchXml);
  if (parsedSearch.ok && parsedSearch.items[0]?.example === "민수가 집에 가고 싶은 것 같아요.") {
    pass("parse search xml");
  } else {
    fail("parse search xml", "parsed example sentence", parsedSearch);
  }

  const parsedView = parseKrdictViewXml(sampleViewXml);
  if (parsedView.ok && parsedView.item.examples[0]?.translation === "Кажется, Минсу хочет пойти домой.") {
    pass("parse view xml");
  } else {
    fail("parse view xml", "parsed view example", parsedView);
  }

  const grammarQuery = getOfficialExampleQueryForGrammar("go_sipda");
  if (grammarQuery === "고 싶") {
    pass("grammar query");
  } else {
    fail("grammar query", "고 싶", grammarQuery);
  }

  const grammarEntryQuery = getOfficialEntryQueryForGrammar("go_sipda");
  if (grammarEntryQuery === "-고 싶다") {
    pass("grammar entry query");
  } else {
    fail("grammar entry query", "-고 싶다", grammarEntryQuery);
  }

  const chainQuery = getOfficialExampleQueryForChain(["go_sipda", "geot_gatda_adj"]);
  if (chainQuery === "고 싶은 것 같") {
    pass("chain query");
  } else {
    fail("chain query", "고 싶은 것 같", chainQuery);
  }

  const searchFetchImpl = async () => ({
    ok: true,
    async text() {
      return sampleSearchXml;
    }
  });

  const viewFetchImpl = async () => ({
    ok: true,
    async text() {
      return sampleViewXml;
    }
  });

  const grammarExample = await getOfficialExampleForGrammar("go_sipda", {
    apiKey: "demo-key",
    fetchImpl: searchFetchImpl
  });

  if (grammarExample?.sentence === "민수가 집에 가고 싶은 것 같아요.") {
    pass("official grammar example");
  } else {
    fail("official grammar example", "민수가 집에 가고 싶은 것 같아요.", grammarExample);
  }

  const entry = await fetchKrdictEntry({
    apiKey: "demo-key",
    targetCode: 12345,
    fetchImpl: viewFetchImpl
  });

  if (entry.item.examples[0]?.example === "민수가 집에 가고 싶은 것 같아요.") {
    pass("fetch view entry");
  } else {
    fail("fetch view entry", "example from view", entry);
  }

  const entrySearch = await fetchKrdictEntries({
    apiKey: "demo-key",
    query: "-고 싶다",
    fetchImpl: searchFetchImpl
  });

  if (entrySearch.items[0]?.targetCode === "12345") {
    pass("fetch entry search");
  } else {
    fail("fetch entry search", "targetCode from entry search", entrySearch);
  }

  const exercise = {
    ok: true,
    resolvedOrder: ["go_sipda", "geot_gatda_adj"]
  };

  const mixedFetchImpl = async (url) => {
    if (String(url).includes("/api/view")) {
      return viewFetchImpl(url);
    }

    return {
      ok: true,
      async text() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<channel>
  <total>1</total>
  <start>1</start>
  <num>10</num>
  <item>
    <target_code>12345</target_code>
    <word>가다</word>
    <sup_no>0</sup_no>
    <example></example>
    <link>https://krdict.korean.go.kr/dicSearch/SearchView?ParaWordNo=12345</link>
  </item>
</channel>`;
      }
    };
  };

  const exerciseExample = await getOfficialExampleForExercise(exercise, {
    apiKey: "demo-key",
    fetchImpl: mixedFetchImpl
  });

  if (exerciseExample?.matchType === "chain" && exerciseExample.sentence === "민수가 집에 가고 싶은 것 같아요.") {
    pass("official exercise example via view");
  } else {
    fail("official exercise example via view", "chain example from view", exerciseExample);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
