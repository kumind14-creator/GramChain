const { getKrdictApiKey } = require("./env");
const {
  buildKrdictExampleSearchUrl,
  buildKrdictViewUrl,
  fetchKrdictExamples
} = require("./officialExampleSource");

const probes = [
  { kind: "exam_search", label: "go_sipda basic", query: "고 싶다" },
  { kind: "exam_search", label: "go_sipda phrase", query: "먹고 싶다" },
  { kind: "exam_search", label: "go_sipda + geot_gatda_adj", query: "고 싶은 것 같다" },
  { kind: "exam_search", label: "ji_anta", query: "지 않다" },
  { kind: "exam_search", label: "neuryeogo_hada", query: "려고 하다" },
  { kind: "exam_search", label: "myeon_eumyeon", query: "으면" },
  {
    kind: "raw_url",
    label: "entry search go_sipda",
    buildUrl(apiKey) {
      return `https://krdict.korean.go.kr/api/search?key=${apiKey}&q=${encodeURIComponent("고 싶다")}&part=word&advanced=y&target=1&method=include&num=10`;
    }
  },
  {
    kind: "raw_url",
    label: "entry search neuryeogo_hada",
    buildUrl(apiKey) {
      return `https://krdict.korean.go.kr/api/search?key=${apiKey}&q=${encodeURIComponent("려고 하다")}&part=word&advanced=y&target=1&method=include&num=10`;
    }
  },
  {
    kind: "raw_url",
    label: "view target 14668",
    buildUrl(apiKey) {
      return buildKrdictViewUrl({
        apiKey,
        targetCode: 14668,
        translated: true,
        transLang: 10
      });
    }
  },
  {
    kind: "raw_url",
    label: "entry search jiman",
    buildUrl(apiKey) {
      return `https://krdict.korean.go.kr/api/search?key=${apiKey}&q=${encodeURIComponent("-지만")}&part=word&advanced=y&target=1&method=include&num=10`;
    }
  },
  {
    kind: "raw_url",
    label: "entry search ji_anta",
    buildUrl(apiKey) {
      return `https://krdict.korean.go.kr/api/search?key=${apiKey}&q=${encodeURIComponent("-지 않다")}&part=word&advanced=y&target=1&method=include&num=10`;
    }
  },
  {
    kind: "raw_url",
    label: "view target 75265 neuryeogo_hada",
    buildUrl(apiKey) {
      return buildKrdictViewUrl({
        apiKey,
        targetCode: 75265,
        translated: true,
        transLang: 10
      });
    }
  },
  {
    kind: "raw_url",
    label: "view target 76327 jiman candidate",
    buildUrl(apiKey) {
      return buildKrdictViewUrl({
        apiKey,
        targetCode: 76327,
        translated: true,
        transLang: 10
      });
    }
  }
];

async function runExamSearchProbe(apiKey, probe) {
  const url = buildKrdictExampleSearchUrl({
    apiKey,
    query: probe.query,
    num: 10
  });

  console.log("URL:", url);

  const result = await fetchKrdictExamples({
    apiKey,
    query: probe.query,
    num: 10
  });

  console.log("total:", result.total);
  console.log("items:", result.items.length);

  result.items.slice(0, 3).forEach((example, index) => {
    console.log("");
    console.log(`#${index + 1}`);
    console.log("targetCode:", example.targetCode);
    console.log("word:", example.word);
    console.log("example:", example.example);
    console.log("link:", example.link);
  });
}

async function runRawUrlProbe(apiKey, probe) {
  const url = probe.buildUrl(apiKey);
  console.log("URL:", url);

  const response = await fetch(url, {
    headers: {
      Accept: "application/xml, text/xml;q=0.9, */*;q=0.8"
    }
  });

  const text = await response.text();
  console.log(text.slice(0, 3000));
}

async function main() {
  const apiKey = getKrdictApiKey();

  if (!apiKey) {
    console.log("KRDICT_API_KEY is not set.");
    return;
  }

  for (const probe of probes) {
    console.log("");
    console.log("=".repeat(60));
    console.log(probe.label);
    console.log("=".repeat(60));

    try {
      if (probe.kind === "exam_search") {
        await runExamSearchProbe(apiKey, probe);
      } else {
        await runRawUrlProbe(apiKey, probe);
      }
    } catch (error) {
      console.log("error:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
