const KRDICT_SEARCH_URL = "https://krdict.korean.go.kr/api/search";
const KRDICT_VIEW_URL = "https://krdict.korean.go.kr/api/view";

const grammarEntryQueries = {
  past_tense: "-았-",
  go_sipda: "-고 싶다",
  neuryeogo_hada: "-려고 하다",
  aseo_eoseo: "-아서",
  jiman: "-지만",
  eul_ttae: "-을 때",
  ji_anta: "-지 않다",
  geot_gatda_adj: "-ㄴ 것 같다",
  geot_gatda_verb_present: "-는 것 같다",
  ajida_eojida: "-아지다",
  myeon_eumyeon: "-으면"
};

const grammarExampleQueries = {
  past_tense: "았",
  go_sipda: "고 싶",
  neuryeogo_hada: "려고 하",
  aseo_eoseo: "아서",
  jiman: "지만",
  eul_ttae: "을 때",
  ji_anta: "지 않",
  geot_gatda_adj: "은 것 같",
  geot_gatda_verb_present: "는 것 같",
  ajida_eojida: "아지",
  myeon_eumyeon: "으면"
};

const chainExampleQueries = {
  "go_sipda__geot_gatda_adj": "고 싶은 것 같",
  "go_sipda__ji_anta": "고 싶지 않",
  "neuryeogo_hada__aseo_eoseo": "려고 해서",
  "ji_anta__geot_gatda_verb_present": "지 않는 것 같",
  "ji_anta__geot_gatda_adj": "지 않은 것 같",
  "ajida_eojida__geot_gatda_verb_present": "아지는 것 같",
  "past_tense__eul_ttae": "았을 때",
  "past_tense__jiman": "았지만"
};

function xmlDecode(value = "") {
  return String(value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function getFirstTagValue(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? xmlDecode(match[1]) : null;
}

function parseKrdictExampleSearchXml(xml) {
  const errorCode = getFirstTagValue(xml, "error_code");
  if (errorCode) {
    return {
      ok: false,
      error: {
        code: errorCode,
        message: getFirstTagValue(xml, "message") ?? "Unknown API error"
      },
      items: []
    };
  }

  const itemBlocks = [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const items = itemBlocks.map((block) => ({
    targetCode: getFirstTagValue(block, "target_code"),
    word: getFirstTagValue(block, "word"),
    supNo: getFirstTagValue(block, "sup_no"),
    example: getFirstTagValue(block, "example"),
    link: getFirstTagValue(block, "link")
  }));

  return {
    ok: true,
    total: Number(getFirstTagValue(xml, "total") ?? 0),
    start: Number(getFirstTagValue(xml, "start") ?? 1),
    num: Number(getFirstTagValue(xml, "num") ?? items.length),
    items
  };
}

function extractExampleInfosFromXml(xml) {
  const blocks = [...String(xml).matchAll(/<example_info>([\s\S]*?)<\/example_info>/gi)].map((match) => match[1]);

  return blocks
    .map((block) => ({
      example: getFirstTagValue(block, "example"),
      translation: getFirstTagValue(block, "translation")
    }))
    .filter((item) => item.example);
}

function parseKrdictViewXml(xml) {
  const errorCode = getFirstTagValue(xml, "error_code");
  if (errorCode) {
    return {
      ok: false,
      error: {
        code: errorCode,
        message: getFirstTagValue(xml, "message") ?? "Unknown API error"
      }
    };
  }

  const itemBlockMatch = String(xml).match(/<item>([\s\S]*?)<\/item>/i);
  const itemBlock = itemBlockMatch ? itemBlockMatch[1] : "";
  const examples = extractExampleInfosFromXml(xml);

  return {
    ok: true,
    item: {
      targetCode: getFirstTagValue(itemBlock, "target_code"),
      word: getFirstTagValue(itemBlock, "word"),
      supNo: getFirstTagValue(itemBlock, "sup_no"),
      link: getFirstTagValue(itemBlock, "link"),
      examples
    }
  };
}

function buildKrdictExampleSearchUrl({
  apiKey,
  query,
  num = 10,
  translated = false,
  transLang = 10
}) {
  if (!apiKey) {
    throw new Error("KRDICT API key is required.");
  }

  if (!query) {
    throw new Error("Search query is required.");
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    part: "exam",
    advanced: "y",
    target: "3",
    method: "include",
    num: String(num)
  });

  if (translated) {
    params.set("translated", "y");
    params.set("trans_lang", String(transLang));
  }

  return `${KRDICT_SEARCH_URL}?${params.toString()}`;
}

function buildKrdictViewUrl({
  apiKey,
  targetCode,
  translated = false,
  transLang = 10
}) {
  if (!apiKey) {
    throw new Error("KRDICT API key is required.");
  }

  if (!targetCode) {
    throw new Error("targetCode is required.");
  }

  const params = new URLSearchParams({
    key: apiKey,
    method: "target_code",
    q: String(targetCode)
  });

  if (translated) {
    params.set("translated", "y");
    params.set("trans_lang", String(transLang));
  }

  return `${KRDICT_VIEW_URL}?${params.toString()}`;
}

function buildKrdictEntrySearchUrl({
  apiKey,
  query,
  num = 10
}) {
  if (!apiKey) {
    throw new Error("KRDICT API key is required.");
  }

  if (!query) {
    throw new Error("Search query is required.");
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    part: "word",
    advanced: "y",
    target: "1",
    method: "include",
    num: String(num)
  });

  return `${KRDICT_SEARCH_URL}?${params.toString()}`;
}

function getOfficialExampleQueryForGrammar(grammarId) {
  return grammarExampleQueries[grammarId] ?? null;
}

function getOfficialEntryQueryForGrammar(grammarId) {
  return grammarEntryQueries[grammarId] ?? null;
}

function getOfficialExampleQueryForChain(grammarIds = []) {
  return chainExampleQueries[grammarIds.join("__")] ?? null;
}

async function fetchKrdictExamples({
  apiKey,
  query,
  num = 10,
  translated = false,
  transLang = 10,
  fetchImpl = fetch
}) {
  const url = buildKrdictExampleSearchUrl({
    apiKey,
    query,
    num,
    translated,
    transLang
  });

  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/xml, text/xml;q=0.9, */*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`KRDICT request failed with status ${response.status}.`);
  }

  const xml = await response.text();
  const parsed = parseKrdictExampleSearchXml(xml);

  if (!parsed.ok) {
    throw new Error(`KRDICT API error ${parsed.error.code}: ${parsed.error.message}`);
  }

  return parsed;
}

async function fetchKrdictEntries({
  apiKey,
  query,
  num = 10,
  fetchImpl = fetch
}) {
  const url = buildKrdictEntrySearchUrl({
    apiKey,
    query,
    num
  });

  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/xml, text/xml;q=0.9, */*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`KRDICT entry search failed with status ${response.status}.`);
  }

  const xml = await response.text();
  const parsed = parseKrdictExampleSearchXml(xml);

  if (!parsed.ok) {
    throw new Error(`KRDICT API error ${parsed.error.code}: ${parsed.error.message}`);
  }

  return parsed;
}

async function fetchKrdictEntry({
  apiKey,
  targetCode,
  translated = false,
  transLang = 10,
  fetchImpl = fetch
}) {
  const url = buildKrdictViewUrl({
    apiKey,
    targetCode,
    translated,
    transLang
  });

  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/xml, text/xml;q=0.9, */*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`KRDICT view request failed with status ${response.status}.`);
  }

  const xml = await response.text();
  const parsed = parseKrdictViewXml(xml);

  if (!parsed.ok) {
    throw new Error(`KRDICT API error ${parsed.error.code}: ${parsed.error.message}`);
  }

  return parsed;
}

function normalizeOfficialExample(item, query) {
  if (!item?.example) {
    return null;
  }

  return {
    sentence: item.example,
    meaningRu: null,
    matchedQuery: query,
    word: item.word ?? null,
    link: item.link ?? null,
    targetCode: item.targetCode ?? null,
    sourceType: "krdict_open_api",
    sourceLabel: "한국어기초사전 (KRDICT Open API)"
  };
}

function normalizeOfficialViewExample(entry, query) {
  const firstExample = entry?.examples?.find((item) => item.example);
  if (!firstExample) {
    return null;
  }

  return {
    sentence: firstExample.example,
    meaningRu: firstExample.translation ?? null,
    matchedQuery: query,
    word: entry.word ?? null,
    link: entry.link ?? null,
    targetCode: entry.targetCode ?? null,
    sourceType: "krdict_open_api",
    sourceLabel: "한국어기초사전 (KRDICT Open API)"
  };
}

async function findOfficialExampleFromSearchResult(result, query, options = {}) {
  for (const item of result.items) {
    if (item.example && item.example.includes(query)) {
      return normalizeOfficialExample(item, query);
    }
  }

  for (const item of result.items) {
    if (!item.targetCode) {
      continue;
    }

    const entryResult = await fetchKrdictEntry({
      ...options,
      targetCode: item.targetCode
    });

    const normalized = normalizeOfficialViewExample(entryResult.item, query);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

async function getOfficialExampleForGrammar(grammarId, options = {}) {
  const entryQuery = getOfficialEntryQueryForGrammar(grammarId);
  const query = getOfficialExampleQueryForGrammar(grammarId);
  if (!query && !entryQuery) {
    return null;
  }

  if (entryQuery) {
    const entrySearchResult = await fetchKrdictEntries({
      ...options,
      query: entryQuery,
      num: options.num ?? 10
    });

    const fromEntry = await findOfficialExampleFromSearchResult(entrySearchResult, entryQuery, options);
    if (fromEntry) {
      return fromEntry;
    }
  }

  if (!query) {
    return null;
  }

  const result = await fetchKrdictExamples({
    ...options,
    query,
    num: options.num ?? 10
  });

  return findOfficialExampleFromSearchResult(result, query, options);
}

async function getOfficialExampleForChain(grammarIds = [], options = {}) {
  const query = getOfficialExampleQueryForChain(grammarIds);
  if (!query) {
    return null;
  }

  const result = await fetchKrdictExamples({
    ...options,
    query,
    num: options.num ?? 10
  });

  return findOfficialExampleFromSearchResult(result, query, options);
}

async function getOfficialExampleForExercise(exercise, options = {}) {
  if (!exercise?.ok) {
    return null;
  }

  if (exercise.resolvedOrder?.length >= 2) {
    const chainExample = await getOfficialExampleForChain(exercise.resolvedOrder, options);
    if (chainExample) {
      return {
        ...chainExample,
        matchType: "chain",
        grammarIds: exercise.resolvedOrder
      };
    }
  }

  const lastGrammarId = exercise.resolvedOrder?.[exercise.resolvedOrder.length - 1];
  if (!lastGrammarId) {
    return null;
  }

  const grammarExample = await getOfficialExampleForGrammar(lastGrammarId, options);
  if (!grammarExample) {
    return null;
  }

  return {
    ...grammarExample,
    matchType: "single",
    grammarId: lastGrammarId
  };
}

module.exports = {
  KRDICT_SEARCH_URL,
  KRDICT_VIEW_URL,
  grammarEntryQueries,
  grammarExampleQueries,
  chainExampleQueries,
  buildKrdictExampleSearchUrl,
  buildKrdictEntrySearchUrl,
  buildKrdictViewUrl,
  parseKrdictExampleSearchXml,
  parseKrdictViewXml,
  getOfficialEntryQueryForGrammar,
  getOfficialExampleQueryForGrammar,
  getOfficialExampleQueryForChain,
  fetchKrdictExamples,
  fetchKrdictEntries,
  fetchKrdictEntry,
  getOfficialExampleForGrammar,
  getOfficialExampleForChain,
  getOfficialExampleForExercise
};
