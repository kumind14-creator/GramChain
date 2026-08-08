const { getKrdictApiKey } = require("./env");
const { getOfficialExampleForExercise } = require("./officialExampleSource");

const grammarList = [
  {
    id: "past_tense",
    label: "-았/었-",
    pattern: "V/A + 았/었-",
    meaning: "прошедшее время",
    inputType: ["verb", "adjective"],
    resultTypeByInput: { verb: "verb", adjective: "adjective" },
    canContinue: true,
    isPrefinal: true
  },
  {
    id: "go_sipda",
    label: "-고 싶다",
    pattern: "V + 고 싶다",
    meaning: "хотеть сделать",
    inputType: ["verb"],
    resultType: "adjective",
    canContinue: true
  },
  {
    id: "neuryeogo_hada",
    label: "-(으)려고 하다",
    pattern: "V + (으)려고 하다",
    meaning: "собираться сделать",
    inputType: ["verb"],
    resultType: "verb",
    canContinue: true
  },
  {
    id: "aseo_eoseo",
    label: "-아서/어서",
    pattern: "V/A + 아서/어서",
    meaning: "потому что / и поэтому",
    inputType: ["verb", "adjective"],
    resultType: "clause_connector",
    canContinue: false
  },
  {
    id: "jiman",
    label: "-지만",
    pattern: "V/A + 지만",
    meaning: "но / хотя",
    inputType: ["verb", "adjective"],
    resultType: "clause_connector",
    canContinue: false
  },
  {
    id: "eul_ttae",
    label: "-(으)ㄹ 때",
    pattern: "V/A + (으)ㄹ 때",
    meaning: "когда...",
    inputType: ["verb", "adjective"],
    resultType: "noun_phrase",
    canContinue: false
  },
  {
    id: "ji_anta",
    label: "-지 않다",
    pattern: "V/A + 지 않다",
    meaning: "не...",
    inputType: ["verb", "adjective"],
    resultTypeByInput: { verb: "verb", adjective: "adjective" },
    canContinue: true
  },
  {
    id: "geot_gatda_adj",
    label: "-(으)ㄴ 것 같다",
    pattern: "A + (으)ㄴ 것 같다",
    meaning: "кажется, что...",
    inputType: ["adjective"],
    resultType: "adjective",
    canContinue: true
  },
  {
    id: "geot_gatda_verb_present",
    label: "-는 것 같다",
    pattern: "V + 는 것 같다",
    meaning: "кажется, что...",
    inputType: ["verb"],
    resultType: "adjective",
    canContinue: true
  },
  {
    id: "ajida_eojida",
    label: "-아지다/어지다",
    pattern: "A + 아지다/어지다",
    meaning: "становиться каким-то",
    inputType: ["adjective"],
    resultType: "verb",
    canContinue: true
  },
  {
    id: "myeon_eumyeon",
    label: "-면/으면",
    pattern: "V/A + 면/으면",
    meaning: "если...",
    inputType: ["verb", "adjective"],
    resultType: "clause_connector",
    canContinue: false
  }
];

const wordList = [
  { id: "gada", lemma: "가다", stem: "가", pos: "verb", meaningRu: "идти / ехать", level: "A1", topic: "movement", isCommon: true },
  { id: "oda", lemma: "오다", stem: "오", pos: "verb", meaningRu: "приходить / приезжать", level: "A1", topic: "movement", isCommon: true },
  { id: "meokda", lemma: "먹다", stem: "먹", pos: "verb", meaningRu: "есть", level: "A1", topic: "food", isCommon: true },
  { id: "masida", lemma: "마시다", stem: "마시", pos: "verb", meaningRu: "пить", level: "A1", topic: "food", isCommon: true },
  { id: "hada", lemma: "하다", stem: "하", pos: "verb", meaningRu: "делать", level: "A1", topic: "basic", isCommon: true },
  { id: "gongbuhada", lemma: "공부하다", stem: "공부하", pos: "verb", meaningRu: "учиться", level: "A1", topic: "study", isCommon: true },
  { id: "ilhada", lemma: "일하다", stem: "일하", pos: "verb", meaningRu: "работать", level: "A1", topic: "work", isCommon: true },
  { id: "jada", lemma: "자다", stem: "자", pos: "verb", meaningRu: "спать", level: "A1", topic: "daily_life", isCommon: true },
  { id: "ireonada", lemma: "일어나다", stem: "일어나", pos: "verb", meaningRu: "вставать / просыпаться", level: "A1", topic: "daily_life", isCommon: true },
  { id: "mannada", lemma: "만나다", stem: "만나", pos: "verb", meaningRu: "встречать(ся)", level: "A1", topic: "people", isCommon: true },
  { id: "boda", lemma: "보다", stem: "보", pos: "verb", meaningRu: "смотреть / видеть", level: "A1", topic: "basic", isCommon: true },
  { id: "deutda", lemma: "듣다", stem: "듣", pos: "verb", meaningRu: "слушать", level: "A1", topic: "basic", isCommon: true },
  { id: "ikda", lemma: "읽다", stem: "읽", pos: "verb", meaningRu: "читать", level: "A1", topic: "study", isCommon: true },
  { id: "sseuda", lemma: "쓰다", stem: "쓰", pos: "verb", meaningRu: "писать", level: "A1", topic: "study", isCommon: true },
  { id: "sada", lemma: "사다", stem: "사", pos: "verb", meaningRu: "покупать", level: "A1", topic: "shopping", isCommon: true },
  { id: "salda", lemma: "살다", stem: "살", pos: "verb", meaningRu: "жить", level: "A1", topic: "life", isCommon: true },
  { id: "joahada", lemma: "좋아하다", stem: "좋아하", pos: "verb", meaningRu: "любить / нравиться", level: "A1", topic: "feelings", isCommon: true },
  { id: "silheohada", lemma: "싫어하다", stem: "싫어하", pos: "verb", meaningRu: "не любить", level: "A2", topic: "feelings", isCommon: true },
  { id: "undonghada", lemma: "운동하다", stem: "운동하", pos: "verb", meaningRu: "заниматься спортом", level: "A1", topic: "health", isCommon: true },
  { id: "swida", lemma: "쉬다", stem: "쉬", pos: "verb", meaningRu: "отдыхать", level: "A1", topic: "daily_life", isCommon: true },
  { id: "tada", lemma: "타다", stem: "타", pos: "verb", meaningRu: "садиться в транспорт", level: "A1", topic: "transport", isCommon: true },
  { id: "yeolda", lemma: "열다", stem: "열", pos: "verb", meaningRu: "открывать", level: "A1", topic: "home", isCommon: true },
  { id: "datda", lemma: "닫다", stem: "닫", pos: "verb", meaningRu: "закрывать", level: "A1", topic: "home", isCommon: true },
  { id: "gidarida", lemma: "기다리다", stem: "기다리", pos: "verb", meaningRu: "ждать", level: "A1", topic: "daily_life", isCommon: true },
  { id: "nolda", lemma: "놀다", stem: "놀", pos: "verb", meaningRu: "играть / проводить время", level: "A1", topic: "daily_life", isCommon: true },
  { id: "mandeulda", lemma: "만들다", stem: "만들", pos: "verb", meaningRu: "делать / создавать", level: "A1", topic: "basic", isCommon: true },
  { id: "keuda", lemma: "크다", stem: "크", pos: "adjective", meaningRu: "большой", level: "A1", topic: "description", isCommon: true },
  { id: "jakda", lemma: "작다", stem: "작", pos: "adjective", meaningRu: "маленький", level: "A1", topic: "description", isCommon: true },
  { id: "nopda", lemma: "높다", stem: "높", pos: "adjective", meaningRu: "высокий", level: "A1", topic: "description", isCommon: true },
  { id: "natda", lemma: "낮다", stem: "낮", pos: "adjective", meaningRu: "низкий", level: "A1", topic: "description", isCommon: true },
  { id: "johta", lemma: "좋다", stem: "좋", pos: "adjective", meaningRu: "хороший", level: "A1", topic: "basic", isCommon: true },
  { id: "nappeuda", lemma: "나쁘다", stem: "나쁘", pos: "adjective", meaningRu: "плохой", level: "A1", topic: "basic", isCommon: true },
  { id: "jaemiitda", lemma: "재미있다", stem: "재미있", pos: "adjective", meaningRu: "интересный", level: "A1", topic: "feelings", isCommon: true },
  { id: "jaemieopda", lemma: "재미없다", stem: "재미없", pos: "adjective", meaningRu: "скучный", level: "A1", topic: "feelings", isCommon: true },
  { id: "yeppeuda", lemma: "예쁘다", stem: "예쁘", pos: "adjective", meaningRu: "красивый", level: "A1", topic: "appearance", isCommon: true },
  { id: "bappeuda", lemma: "바쁘다", stem: "바쁘", pos: "adjective", meaningRu: "занятой", level: "A1", topic: "daily_life", isCommon: true },
  { id: "haengbokhada", lemma: "행복하다", stem: "행복하", pos: "adjective", meaningRu: "счастливый", level: "A2", topic: "feelings", isCommon: true },
  { id: "seulpeuda", lemma: "슬프다", stem: "슬프", pos: "adjective", meaningRu: "грустный", level: "A2", topic: "feelings", isCommon: true },
  { id: "deopda", lemma: "덥다", stem: "덥", pos: "adjective", meaningRu: "жарко", level: "A1", topic: "weather", isCommon: true },
  { id: "chupda", lemma: "춥다", stem: "춥", pos: "adjective", meaningRu: "холодно", level: "A1", topic: "weather", isCommon: true },
  { id: "tteutteuthada", lemma: "따뜻하다", stem: "따뜻하", pos: "adjective", meaningRu: "теплый", level: "A2", topic: "weather", isCommon: true },
  { id: "siwonhada", lemma: "시원하다", stem: "시원하", pos: "adjective", meaningRu: "прохладный / освежающий", level: "A1", topic: "weather", isCommon: true },
  { id: "bissada", lemma: "비싸다", stem: "비싸", pos: "adjective", meaningRu: "дорогой", level: "A1", topic: "shopping", isCommon: true },
  { id: "ssada", lemma: "싸다", stem: "싸", pos: "adjective", meaningRu: "дешевый", level: "A1", topic: "shopping", isCommon: true },
  { id: "eoryeopda", lemma: "어렵다", stem: "어렵", pos: "adjective", meaningRu: "трудный", level: "A1", topic: "study", isCommon: true },
  { id: "swipda", lemma: "쉽다", stem: "쉽", pos: "adjective", meaningRu: "легкий", level: "A1", topic: "study", isCommon: true },
  { id: "gakkapda", lemma: "가깝다", stem: "가깝", pos: "adjective", meaningRu: "близкий", level: "A2", topic: "location", isCommon: true },
  { id: "meolda", lemma: "멀다", stem: "멀", pos: "adjective", meaningRu: "далекий", level: "A2", topic: "location", isCommon: true },
  { id: "apeuda", lemma: "아프다", stem: "아프", pos: "adjective", meaningRu: "больной / болеть / больно", level: "A1", topic: "health", isCommon: true },
  { id: "dareuda", lemma: "다르다", stem: "다르", pos: "adjective", meaningRu: "другой / отличаться", level: "A1", topic: "description", isCommon: true }
];

const conjugationMap = {
  gada: "regular",
  oda: "regular",
  meokda: "regular",
  masida: "regular",
  hada: "hada",
  gongbuhada: "hada",
  ilhada: "hada",
  jada: "regular",
  ireonada: "regular",
  mannada: "regular",
  boda: "regular",
  deutda: "d_irregular",
  ikda: "regular",
  sseuda: "eu_drop",
  sada: "regular",
  salda: "regular",
  joahada: "hada",
  silheohada: "hada",
  undonghada: "hada",
  swida: "regular",
  tada: "regular",
  yeolda: "regular",
  datda: "regular",
  gidarida: "regular",
  nolda: "regular",
  mandeulda: "regular",
  keuda: "eu_drop",
  jakda: "regular",
  nopda: "regular",
  natda: "regular",
  johta: "regular",
  nappeuda: "eu_drop",
  jaemiitda: "regular",
  jaemieopda: "regular",
  yeppeuda: "eu_drop",
  bappeuda: "eu_drop",
  haengbokhada: "hada",
  seulpeuda: "eu_drop",
  deopda: "b_irregular",
  chupda: "b_irregular",
  tteutteuthada: "hada",
  siwonhada: "hada",
  bissada: "regular",
  ssada: "regular",
  eoryeopda: "b_irregular",
  swipda: "b_irregular",
  gakkapda: "b_irregular",
  meolda: "regular",
  apeuda: "eu_drop",
  dareuda: "reu_irregular"
};

const grammaticalCompatibilityMap = {
  past_tense: { allowedPrev: ["go_sipda", "neuryeogo_hada", "ji_anta", "geot_gatda_adj", "geot_gatda_verb_present", "ajida_eojida"], allowedNext: ["jiman", "eul_ttae", "myeon_eumyeon"] },
  go_sipda: { allowedPrev: ["ajida_eojida"], allowedNext: ["past_tense", "aseo_eoseo", "jiman", "eul_ttae", "ji_anta", "geot_gatda_adj", "myeon_eumyeon"] },
  neuryeogo_hada: { allowedPrev: ["ajida_eojida", "ji_anta"], allowedNext: ["past_tense", "aseo_eoseo", "jiman", "eul_ttae", "ji_anta", "geot_gatda_verb_present", "myeon_eumyeon"] },
  aseo_eoseo: { allowedPrev: ["go_sipda", "neuryeogo_hada", "ji_anta", "geot_gatda_adj", "geot_gatda_verb_present", "ajida_eojida"], allowedNext: [] },
  jiman: { allowedPrev: ["past_tense", "go_sipda", "neuryeogo_hada", "ji_anta", "geot_gatda_adj", "geot_gatda_verb_present", "ajida_eojida"], allowedNext: [] },
  eul_ttae: { allowedPrev: ["past_tense", "go_sipda", "neuryeogo_hada", "ji_anta", "geot_gatda_adj", "geot_gatda_verb_present", "ajida_eojida"], allowedNext: [] },
  ji_anta: { allowedPrev: ["go_sipda", "neuryeogo_hada", "geot_gatda_adj", "geot_gatda_verb_present", "ajida_eojida"], allowedNext: ["past_tense", "aseo_eoseo", "jiman", "eul_ttae", "neuryeogo_hada", "myeon_eumyeon", "geot_gatda_adj", "geot_gatda_verb_present"] },
  geot_gatda_adj: { allowedPrev: ["go_sipda", "ji_anta"], allowedNext: ["past_tense", "aseo_eoseo", "jiman", "eul_ttae", "ji_anta", "myeon_eumyeon"] },
  geot_gatda_verb_present: { allowedPrev: ["neuryeogo_hada", "ji_anta", "ajida_eojida"], allowedNext: ["past_tense", "aseo_eoseo", "jiman", "eul_ttae", "ji_anta", "myeon_eumyeon"] },
  ajida_eojida: { allowedPrev: [], allowedNext: ["past_tense", "go_sipda", "neuryeogo_hada", "aseo_eoseo", "jiman", "eul_ttae", "ji_anta", "geot_gatda_verb_present", "myeon_eumyeon"] },
  myeon_eumyeon: { allowedPrev: ["past_tense", "go_sipda", "neuryeogo_hada", "ji_anta", "geot_gatda_adj", "geot_gatda_verb_present", "ajida_eojida"], allowedNext: [] }
};

const compatibilityConditions = {
  ji_anta: {
    geot_gatda_adj: { onlyIfResultType: "adjective", example: "예쁘지 않은 것 같다" },
    geot_gatda_verb_present: { onlyIfResultType: "verb", example: "먹지 않는 것 같다" }
  }
};

const naturalChainWhitelist = [
  ["go_sipda", "past_tense"],
  ["ji_anta", "past_tense"],
  ["go_sipda", "ji_anta"],
  ["go_sipda", "geot_gatda_adj"],
  ["go_sipda", "aseo_eoseo"],
  ["go_sipda", "jiman"],
  ["go_sipda", "eul_ttae"],
  ["go_sipda", "myeon_eumyeon"],
  ["neuryeogo_hada", "ji_anta"],
  ["neuryeogo_hada", "geot_gatda_verb_present"],
  ["neuryeogo_hada", "aseo_eoseo"],
  ["neuryeogo_hada", "jiman"],
  ["neuryeogo_hada", "eul_ttae"],
  ["neuryeogo_hada", "myeon_eumyeon"],
  ["ji_anta", "geot_gatda_adj"],
  ["ji_anta", "geot_gatda_verb_present"],
  ["ji_anta", "aseo_eoseo"],
  ["ji_anta", "jiman"],
  ["ji_anta", "eul_ttae"],
  ["ji_anta", "myeon_eumyeon"],
  ["geot_gatda_adj", "ji_anta"],
  ["geot_gatda_adj", "aseo_eoseo"],
  ["geot_gatda_adj", "jiman"],
  ["geot_gatda_adj", "eul_ttae"],
  ["geot_gatda_adj", "myeon_eumyeon"],
  ["geot_gatda_verb_present", "ji_anta"],
  ["geot_gatda_verb_present", "aseo_eoseo"],
  ["geot_gatda_verb_present", "jiman"],
  ["geot_gatda_verb_present", "eul_ttae"],
  ["geot_gatda_verb_present", "myeon_eumyeon"],
  ["ajida_eojida", "ji_anta"],
  ["ajida_eojida", "geot_gatda_verb_present"],
  ["ajida_eojida", "aseo_eoseo"],
  ["ajida_eojida", "jiman"],
  ["ajida_eojida", "eul_ttae"],
  ["ajida_eojida", "myeon_eumyeon"],
  ["past_tense", "jiman"],
  ["past_tense", "eul_ttae"],
  ["past_tense", "myeon_eumyeon"]
];

const naturalTripleChainWhitelist = [
  ["ji_anta", "past_tense", "jiman"],
  ["ji_anta", "past_tense", "eul_ttae"],
  ["ji_anta", "past_tense", "myeon_eumyeon"],
  ["go_sipda", "ji_anta", "past_tense"],
  ["go_sipda", "ji_anta", "aseo_eoseo"],
  ["go_sipda", "ji_anta", "jiman"],
  ["go_sipda", "ji_anta", "eul_ttae"],
  ["go_sipda", "ji_anta", "myeon_eumyeon"],
  ["go_sipda", "geot_gatda_adj", "ji_anta"],
  ["go_sipda", "geot_gatda_adj", "aseo_eoseo"],
  ["go_sipda", "geot_gatda_adj", "jiman"],
  ["go_sipda", "geot_gatda_adj", "eul_ttae"],
  ["go_sipda", "geot_gatda_adj", "myeon_eumyeon"],
  ["neuryeogo_hada", "ji_anta", "aseo_eoseo"],
  ["neuryeogo_hada", "ji_anta", "jiman"],
  ["neuryeogo_hada", "ji_anta", "eul_ttae"],
  ["neuryeogo_hada", "ji_anta", "myeon_eumyeon"],
  ["neuryeogo_hada", "geot_gatda_verb_present", "ji_anta"],
  ["neuryeogo_hada", "geot_gatda_verb_present", "aseo_eoseo"],
  ["neuryeogo_hada", "geot_gatda_verb_present", "jiman"],
  ["neuryeogo_hada", "geot_gatda_verb_present", "eul_ttae"],
  ["neuryeogo_hada", "geot_gatda_verb_present", "myeon_eumyeon"],
  ["ajida_eojida", "ji_anta", "aseo_eoseo"],
  ["ajida_eojida", "ji_anta", "jiman"],
  ["ajida_eojida", "ji_anta", "eul_ttae"],
  ["ajida_eojida", "ji_anta", "myeon_eumyeon"],
  ["ajida_eojida", "geot_gatda_verb_present", "ji_anta"],
  ["ajida_eojida", "geot_gatda_verb_present", "aseo_eoseo"],
  ["ajida_eojida", "geot_gatda_verb_present", "jiman"],
  ["ajida_eojida", "geot_gatda_verb_present", "eul_ttae"],
  ["ajida_eojida", "geot_gatda_verb_present", "myeon_eumyeon"],
  ["past_tense", "jiman"],
  ["past_tense", "eul_ttae"],
  ["past_tense", "myeon_eumyeon"]
];

const naturalQuadChainWhitelist = [
  ["geot_gatda_adj", "ji_anta", "past_tense", "jiman"],
  ["geot_gatda_adj", "ji_anta", "past_tense", "eul_ttae"],
  ["geot_gatda_adj", "ji_anta", "past_tense", "myeon_eumyeon"],
  ["geot_gatda_verb_present", "ji_anta", "past_tense", "jiman"],
  ["geot_gatda_verb_present", "ji_anta", "past_tense", "eul_ttae"],
  ["geot_gatda_verb_present", "ji_anta", "past_tense", "myeon_eumyeon"],
  ["go_sipda", "geot_gatda_adj", "ji_anta", "aseo_eoseo"],
  ["go_sipda", "geot_gatda_adj", "ji_anta", "jiman"],
  ["go_sipda", "geot_gatda_adj", "ji_anta", "eul_ttae"],
  ["go_sipda", "geot_gatda_adj", "ji_anta", "myeon_eumyeon"],
  ["neuryeogo_hada", "geot_gatda_verb_present", "ji_anta", "aseo_eoseo"],
  ["neuryeogo_hada", "geot_gatda_verb_present", "ji_anta", "jiman"],
  ["neuryeogo_hada", "geot_gatda_verb_present", "ji_anta", "eul_ttae"],
  ["neuryeogo_hada", "geot_gatda_verb_present", "ji_anta", "myeon_eumyeon"],
  ["ajida_eojida", "geot_gatda_verb_present", "ji_anta", "aseo_eoseo"],
  ["ajida_eojida", "geot_gatda_verb_present", "ji_anta", "jiman"],
  ["ajida_eojida", "geot_gatda_verb_present", "ji_anta", "eul_ttae"],
  ["ajida_eojida", "geot_gatda_verb_present", "ji_anta", "myeon_eumyeon"]
];

const exampleBank = {
  single: {
    go_sipda: [
      {
        sentence: "오늘 저녁에는 한국 음식을 먹고 싶어요.",
        meaningRu: "Сегодня вечером я хочу поесть корейскую еду.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    neuryeogo_hada: [
      {
        sentence: "주말에 오랜만에 친구를 만나려고 해요.",
        meaningRu: "На выходных я собираюсь наконец встретиться с другом.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    aseo_eoseo: [
      {
        sentence: "밖에 비가 와서 오늘은 집에 있어요.",
        meaningRu: "На улице идет дождь, поэтому сегодня я дома.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    jiman: [
      {
        sentence: "한국어는 아직 어렵지만 배울수록 재미있어요.",
        meaningRu: "Корейский пока трудный, но чем больше его учишь, тем интереснее.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    eul_ttae: [
      {
        sentence: "시간이 있을 때 카페에서 책을 읽어요.",
        meaningRu: "Когда у меня есть время, я читаю книгу в кафе.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    ji_anta: [
      {
        sentence: "오늘은 늦게 자고 싶지 않아서 커피를 마시지 않아요.",
        meaningRu: "Сегодня я не пью кофе, потому что не хочу поздно ложиться спать.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    geot_gatda_adj: [
      {
        sentence: "이 가방은 디자인은 예쁘지만 조금 비싼 것 같아요.",
        meaningRu: "Эта сумка красивая по дизайну, но, кажется, немного дорогая.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    geot_gatda_verb_present: [
      {
        sentence: "창밖을 보니까 밖에 비가 오는 것 같아요.",
        meaningRu: "Судя по окну, кажется, на улице идет дождь.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    ajida_eojida: [
      {
        sentence: "가을이 되니까 날씨가 점점 추워져요.",
        meaningRu: "Наступает осень, и погода постепенно становится холоднее.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    myeon_eumyeon: [
      {
        sentence: "오늘 시간이 없으면 숙제는 내일 해도 돼요.",
        meaningRu: "Если сегодня нет времени, домашнее задание можно сделать завтра.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    past_tense: [
      {
        sentence: "어제 친구를 만나러 학교에 갔어요.",
        meaningRu: "Вчера я ходил в школу, чтобы встретиться с другом.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ]
  },
  chain: {
    "go_sipda__geot_gatda_adj": [
      {
        sentence: "민수가 집에 가고 싶은 것 같아요.",
        meaningRu: "Кажется, Минсу хочет пойти домой.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "go_sipda__ji_anta": [
      {
        sentence: "오늘은 아무것도 먹고 싶지 않아요.",
        meaningRu: "Сегодня мне совсем не хочется ничего есть.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "neuryeogo_hada__aseo_eoseo": [
      {
        sentence: "일찍 자려고 해서 숙제를 빨리 했어요.",
        meaningRu: "Я собирался лечь спать рано, поэтому быстро сделал домашнее задание.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ji_anta__geot_gatda_verb_present": [
      {
        sentence: "지금은 비가 오지 않는 것 같아요.",
        meaningRu: "Сейчас, кажется, дождь не идет.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ji_anta__geot_gatda_adj": [
      {
        sentence: "그 식당은 비싸지 않은 것 같아요.",
        meaningRu: "Кажется, тот ресторан не дорогой.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ajida_eojida__geot_gatda_verb_present": [
      {
        sentence: "날씨가 더 추워지는 것 같아요.",
        meaningRu: "Кажется, погода становится еще холоднее.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "past_tense__eul_ttae": [
      {
        sentence: "어렸을 때 이 노래를 자주 들었어요.",
        meaningRu: "Когда я был маленьким, я часто слушал эту песню.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "past_tense__jiman": [
      {
        sentence: "어제는 바빴지만 오늘은 괜찮아요.",
        meaningRu: "Вчера я был занят, но сегодня все нормально.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "go_sipda__aseo_eoseo": [
      {
        sentence: "배가 고파서 빨리 먹고 싶어요.",
        meaningRu: "Я проголодалась, поэтому хочу быстро поесть.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "go_sipda__jiman": [
      {
        sentence: "쉬고 싶지만 아직 일이 많아요.",
        meaningRu: "Хочу отдохнуть, но дел еще много.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "go_sipda__eul_ttae": [
      {
        sentence: "집에 가고 싶을 때 음악을 들어요.",
        meaningRu: "Когда хочется пойти домой, я слушаю музыку.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "go_sipda__myeon_eumyeon": [
      {
        sentence: "여행을 가고 싶으면 표를 먼저 사야 해요.",
        meaningRu: "Если хочешь поехать в путешествие, сначала нужно купить билет.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "neuryeogo_hada__jiman": [
      {
        sentence: "오늘 운동하려고 하지만 비가 와요.",
        meaningRu: "Сегодня я собираюсь позаниматься спортом, но идет дождь.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "neuryeogo_hada__eul_ttae": [
      {
        sentence: "집에서 공부하려고 할 때 조용한 방을 찾아요.",
        meaningRu: "Когда я собираюсь заниматься дома, я ищу тихую комнату.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "neuryeogo_hada__myeon_eumyeon": [
      {
        sentence: "일찍 자려고 하면 커피를 마시지 않아요.",
        meaningRu: "Если я собираюсь лечь спать рано, я не пью кофе.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ji_anta__aseo_eoseo": [
      {
        sentence: "오늘은 바쁘지 않아서 같이 점심을 먹어요.",
        meaningRu: "Сегодня я не занята, поэтому пообедаю вместе с тобой.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ji_anta__jiman": [
      {
        sentence: "그 영화는 재미있지 않지만 한 번 보고 싶어요.",
        meaningRu: "Этот фильм не очень интересный, но я все равно хочу посмотреть его один раз.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ji_anta__eul_ttae": [
      {
        sentence: "바쁘지 않을 때 산책을 해요.",
        meaningRu: "Когда я не занята, я гуляю.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ji_anta__myeon_eumyeon": [
      {
        sentence: "아프지 않으면 내일 학교에 가요.",
        meaningRu: "Если не болею, завтра иду в школу.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ajida_eojida__aseo_eoseo": [
      {
        sentence: "날씨가 추워져서 창문을 닫아요.",
        meaningRu: "Стало холодно, поэтому я закрываю окно.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ajida_eojida__jiman": [
      {
        sentence: "요즘은 편해졌지만 날씨는 더 추워졌어요.",
        meaningRu: "В последнее время стало удобнее, но погода стала холоднее.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ajida_eojida__eul_ttae": [
      {
        sentence: "기분이 좋아질 때 친구를 만나요.",
        meaningRu: "Когда настроение улучшается, я встречаюсь с друзьями.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ajida_eojida__myeon_eumyeon": [
      {
        sentence: "더 높아지면 멀리 볼 수 있어요.",
        meaningRu: "Если станет выше, можно будет видеть дальше.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "past_tense__myeon_eumyeon": [
      {
        sentence: "늦었으면 바로 전화해 주세요.",
        meaningRu: "Если опоздали, пожалуйста, сразу позвоните.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ji_anta__past_tense": [
      {
        sentence: "어제는 바쁘지 않았어요.",
        meaningRu: "Вчера я не была занята.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "go_sipda__past_tense": [
      {
        sentence: "어제는 집에 일찍 가고 싶었어요.",
        meaningRu: "Вчера мне хотелось пойти домой пораньше.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "neuryeogo_hada__past_tense": [
      {
        sentence: "주말에 친구를 만나려고 했어요.",
        meaningRu: "На выходных я собиралась встретиться с другом.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_adj__past_tense": [
      {
        sentence: "어제 그 가방은 조금 비싼 것 같았어요.",
        meaningRu: "Вчера мне показалось, что та сумка была немного дорогой.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_verb_present__past_tense": [
      {
        sentence: "아까 밖에 비가 오는 것 같았어요.",
        meaningRu: "Недавно мне казалось, что на улице идет дождь.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ajida_eojida__past_tense": [
      {
        sentence: "작년에는 날씨가 더 추워졌어요.",
        meaningRu: "В прошлом году погода стала холоднее.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ajida_eojida__go_sipda": [
      {
        sentence: "요즘은 더 건강해지고 싶어요.",
        meaningRu: "В последнее время я хочу стать здоровее.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "neuryeogo_hada__ji_anta": [
      {
        sentence: "오늘은 늦게 자려고 하지 않아요.",
        meaningRu: "Сегодня я не собираюсь ложиться спать поздно.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "neuryeogo_hada__geot_gatda_verb_present": [
      {
        sentence: "민수는 집에 가려고 하는 것 같아요.",
        meaningRu: "Кажется, Минсу собирается пойти домой.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ajida_eojida__neuryeogo_hada": [
      {
        sentence: "요즘은 더 부지런해지려고 해요.",
        meaningRu: "В последнее время я стараюсь стать более старательной.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_adj__aseo_eoseo": [
      {
        sentence: "오늘은 좀 피곤한 것 같아서 일찍 잘 거예요.",
        meaningRu: "Сегодня я, кажется, немного уставшая, поэтому лягу спать рано.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_verb_present__aseo_eoseo": [
      {
        sentence: "밖에 비가 오는 것 같아서 우산을 가져가요.",
        meaningRu: "Кажется, на улице идет дождь, поэтому я беру зонт.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_adj__jiman": [
      {
        sentence: "그 책은 재미있는 것 같지만 아직 못 읽었어요.",
        meaningRu: "Кажется, эта книга интересная, но я еще не прочитала ее.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_verb_present__jiman": [
      {
        sentence: "지금 비가 오는 것 같지만 그냥 나갈게요.",
        meaningRu: "Кажется, сейчас идет дождь, но я все равно выйду.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_adj__eul_ttae": [
      {
        sentence: "피곤한 것 같을 때 커피를 마셔요.",
        meaningRu: "Когда кажется, что я устала, я пью кофе.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_verb_present__eul_ttae": [
      {
        sentence: "비가 오는 것 같을 때 창문을 닫아요.",
        meaningRu: "Когда кажется, что идет дождь, я закрываю окно.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "ajida_eojida__ji_anta": [
      {
        sentence: "날씨가 더 따뜻해지지 않아요.",
        meaningRu: "Погода не становится теплее.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_adj__myeon_eumyeon": [
      {
        sentence: "너무 비싼 것 같으면 사지 마세요.",
        meaningRu: "Если кажется, что это слишком дорого, не покупайте.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ],
    "geot_gatda_verb_present__myeon_eumyeon": [
      {
        sentence: "비가 오는 것 같으면 일찍 출발해요.",
        meaningRu: "Если кажется, что идет дождь, выходим пораньше.",
        sourceType: "curated",
        sourceLabel: "Local example bank"
      }
    ]
  }
};

function makeCuratedExample(sentence, meaningRu) {
  return [
    {
      sentence,
      meaningRu,
      sourceType: "curated",
      sourceLabel: "Local example bank"
    }
  ];
}

Object.assign(exampleBank.single, {
  go_sipda: makeCuratedExample(
    "오늘 저녁에는 한국 음식을 먹고 싶어요.",
    "Сегодня вечером я хочу поесть корейскую еду."
  ),
  neuryeogo_hada: makeCuratedExample(
    "주말에 오랜만에 친구를 만나려고 해요.",
    "На выходных я собираюсь наконец встретиться с другом."
  ),
  aseo_eoseo: makeCuratedExample(
    "밖에 비가 와서 오늘은 집에 있어요.",
    "На улице идет дождь, поэтому сегодня я дома."
  ),
  jiman: makeCuratedExample(
    "한국어는 아직 어렵지만 배울수록 재미있어요.",
    "Корейский пока трудный, но чем больше его учишь, тем интереснее."
  ),
  eul_ttae: makeCuratedExample(
    "시간이 있을 때 카페에서 책을 읽어요.",
    "Когда у меня есть время, я читаю книгу в кафе."
  ),
  ji_anta: makeCuratedExample(
    "오늘은 늦게 자고 싶지 않아서 커피를 마시지 않아요.",
    "Сегодня я не пью кофе, потому что не хочу поздно ложиться спать."
  ),
  geot_gatda_adj: makeCuratedExample(
    "이 가방은 디자인은 예쁘지만 조금 비싼 것 같아요.",
    "Эта сумка красивая по дизайну, но, кажется, немного дорогая."
  ),
  geot_gatda_verb_present: makeCuratedExample(
    "창밖을 보니까 밖에 비가 오는 것 같아요.",
    "Судя по окну, кажется, на улице идет дождь."
  ),
  ajida_eojida: makeCuratedExample(
    "가을이 되니까 날씨가 점점 추워져요.",
    "Наступает осень, и погода постепенно становится холоднее."
  ),
  myeon_eumyeon: makeCuratedExample(
    "오늘 시간이 없으면 숙제는 내일 해도 돼요.",
    "Если сегодня нет времени, домашнее задание можно сделать завтра."
  ),
  past_tense: makeCuratedExample(
    "어제 친구를 만나러 학교에 갔어요.",
    "Вчера я ходил(а) в школу, чтобы встретиться с другом."
  )
});

Object.assign(exampleBank.chain, {
  go_sipda__geot_gatda_adj: makeCuratedExample(
    "민수가 오늘 많이 피곤해서 집에 가고 싶은 것 같아요.",
    "Кажется, Минсу сегодня очень устал и хочет пойти домой."
  ),
  go_sipda__ji_anta: makeCuratedExample(
    "오늘은 속이 안 좋아서 아무것도 먹고 싶지 않아요.",
    "Сегодня у меня болит живот, поэтому совсем не хочется ничего есть."
  ),
  neuryeogo_hada__aseo_eoseo: makeCuratedExample(
    "오늘은 일찍 자려고 해서 숙제를 저녁에 빨리 했어요.",
    "Сегодня я хотел(а) лечь спать пораньше, поэтому быстро сделал(а) домашнее задание еще вечером."
  ),
  ji_anta__geot_gatda_verb_present: makeCuratedExample(
    "창밖을 보니까 지금은 비가 오지 않는 것 같아요.",
    "Судя по окну, сейчас дождь, кажется, уже не идет."
  ),
  ji_anta__geot_gatda_adj: makeCuratedExample(
    "메뉴를 보니까 그 식당은 그렇게 비싸지 않은 것 같아요.",
    "Судя по меню, тот ресторан, кажется, не такой уж дорогой."
  ),
  ajida_eojida__geot_gatda_verb_present: makeCuratedExample(
    "바람이 불어서 날씨가 더 추워지는 것 같아요.",
    "Из-за ветра кажется, что погода становится еще холоднее."
  ),
  past_tense__eul_ttae: makeCuratedExample(
    "어릴 때는 이 노래를 들으면서 자주 잤어요.",
    "Когда я был(а) маленьким(ой), я часто засыпал(а) под эту песню."
  ),
  past_tense__jiman: makeCuratedExample(
    "어제는 정말 바빴지만 오늘은 조금 여유가 있어요.",
    "Вчера было очень много дел, но сегодня у меня уже есть немного свободного времени."
  ),
  go_sipda__aseo_eoseo: makeCuratedExample(
    "점심을 못 먹어서 지금은 따뜻한 밥을 빨리 먹고 싶어요.",
    "Я не успел(а) пообедать, поэтому сейчас очень хочу поскорее поесть чего-нибудь горячего."
  ),
  go_sipda__jiman: makeCuratedExample(
    "집에 가서 쉬고 싶지만 아직 끝내야 할 일이 많아요.",
    "Хочется пойти домой и отдохнуть, но у меня еще много дел, которые нужно закончить."
  ),
  go_sipda__eul_ttae: makeCuratedExample(
    "공부하다가 집에 가고 싶을 때는 조용한 음악을 들어요.",
    "Когда во время учебы мне хочется пойти домой, я слушаю спокойную музыку."
  ),
  go_sipda__myeon_eumyeon: makeCuratedExample(
    "주말에 여행을 가고 싶으면 기차표를 먼저 예매해야 해요.",
    "Если хочешь поехать куда-нибудь на выходных, нужно заранее купить билет на поезд."
  ),
  neuryeogo_hada__jiman: makeCuratedExample(
    "오늘 공원에서 운동하려고 하지만 갑자기 비가 와요.",
    "Сегодня я собирался(ась) позаниматься спортом в парке, но вдруг пошел дождь."
  ),
  neuryeogo_hada__eul_ttae: makeCuratedExample(
    "집에서 집중해서 공부하려고 할 때는 조용한 방을 먼저 찾아요.",
    "Когда я собираюсь серьезно заниматься дома, я сначала ищу тихую комнату."
  ),
  neuryeogo_hada__myeon_eumyeon: makeCuratedExample(
    "오늘 일찍 자려고 하면 저녁에는 커피를 마시지 않아요.",
    "Если я собираюсь сегодня лечь пораньше, вечером я не пью кофе."
  ),
  ji_anta__aseo_eoseo: makeCuratedExample(
    "오늘은 회사에서 바쁘지 않아서 같이 천천히 점심을 먹을 수 있어요.",
    "Сегодня на работе не очень занято, поэтому мы можем спокойно пообедать вместе."
  ),
  ji_anta__jiman: makeCuratedExample(
    "그 영화는 그렇게 재미있지 않지만 배우가 좋아서 한 번 보고 싶어요.",
    "Этот фильм, может, не очень интересный, но мне нравится актер, поэтому я все равно хочу посмотреть его один раз."
  ),
  ji_anta__eul_ttae: makeCuratedExample(
    "주말에 바쁘지 않을 때는 집 근처 공원에서 산책을 해요.",
    "Когда на выходных я не занята, я гуляю в парке рядом с домом."
  ),
  ji_anta__myeon_eumyeon: makeCuratedExample(
    "내일도 아프지 않으면 학교에 가서 수업을 들을 거예요.",
    "Если завтра я не буду болеть, пойду в школу на занятия."
  ),
  ajida_eojida__aseo_eoseo: makeCuratedExample(
    "저녁이 되니까 날씨가 추워져서 창문을 닫았어요.",
    "К вечеру похолодало, поэтому я закрыл(а) окно."
  ),
  ajida_eojida__jiman: makeCuratedExample(
    "새 집으로 이사한 뒤 생활은 편해졌지만 출근길은 더 멀어졌어요.",
    "После переезда в новый дом жить стало удобнее, но дорога на работу стала длиннее."
  ),
  ajida_eojida__eul_ttae: makeCuratedExample(
    "기분이 좋아질 때는 친구를 만나서 같이 커피를 마셔요.",
    "Когда у меня улучшается настроение, я встречаюсь с друзьями и пью с ними кофе."
  ),
  ajida_eojida__myeon_eumyeon: makeCuratedExample(
    "날씨가 더 좋아지면 산에 올라가서 멀리 볼 수 있어요.",
    "Если погода станет лучше, можно будет подняться в горы и смотреть далеко вокруг."
  ),
  past_tense__myeon_eumyeon: makeCuratedExample(
    "약속 시간에 늦었으면 바로 전화해 주세요.",
    "Если вы опаздываете ко времени встречи, пожалуйста, сразу позвоните."
  ),
  ji_anta__past_tense: makeCuratedExample(
    "어제는 생각보다 바쁘지 않아서 일찍 집에 갔어요.",
    "Вчера было не так занято, как я ожидал(а), поэтому я рано пошел(пошла) домой."
  ),
  go_sipda__past_tense: makeCuratedExample(
    "어제는 너무 피곤해서 집에 일찍 가고 싶었어요.",
    "Вчера я очень устал(а), поэтому мне хотелось пораньше пойти домой."
  ),
  neuryeogo_hada__past_tense: makeCuratedExample(
    "주말에 친구를 만나려고 했는데 갑자기 일이 생겼어요.",
    "На выходных я собирался(ась) встретиться с другом, но вдруг появились дела."
  ),
  ajida_eojida__go_sipda: makeCuratedExample(
    "요즘은 운동도 하고 더 건강해지고 싶어요.",
    "В последнее время мне хочется заниматься спортом и стать здоровее."
  ),
  neuryeogo_hada__ji_anta: makeCuratedExample(
    "내일 일찍 일어나야 해서 오늘은 늦게 자려고 하지 않아요.",
    "Завтра мне нужно рано вставать, поэтому сегодня я не собираюсь ложиться поздно."
  ),
  neuryeogo_hada__geot_gatda_verb_present: makeCuratedExample(
    "민수는 가방을 챙기는 걸 보니 집에 가려고 하는 것 같아요.",
    "Судя по тому, что Минсу собирает сумку, кажется, он собирается идти домой."
  ),
  ajida_eojida__neuryeogo_hada: makeCuratedExample(
    "요즘은 아침에 일찍 일어나면서 더 부지런해지려고 해요.",
    "В последнее время я стараюсь стать более собранным(ой) и для этого рано встаю по утрам."
  ),
  geot_gatda_adj__aseo_eoseo: makeCuratedExample(
    "오늘은 조금 피곤한 것 같아서 일찍 잘 거예요.",
    "Сегодня я, кажется, немного устал(а), поэтому лягу спать пораньше."
  ),
  geot_gatda_verb_present__aseo_eoseo: makeCuratedExample(
    "밖에 비가 오는 것 같아서 우산을 가져가요.",
    "Кажется, на улице идет дождь, поэтому я беру зонт."
  ),
  geot_gatda_adj__jiman: makeCuratedExample(
    "그 책은 재미있는 것 같지만 아직 끝까지 읽지는 못했어요.",
    "Кажется, книга интересная, но я еще не успел(а) дочитать ее до конца."
  ),
  geot_gatda_verb_present__jiman: makeCuratedExample(
    "지금 비가 오는 것 같지만 그래도 약속에 나갈 거예요.",
    "Похоже, сейчас идет дождь, но я все равно пойду на встречу."
  ),
  geot_gatda_adj__eul_ttae: makeCuratedExample(
    "피곤한 것 같을 때는 따뜻한 차를 마시고 좀 쉬어요.",
    "Когда мне кажется, что я устал(а), я пью теплый чай и немного отдыхаю."
  ),
  geot_gatda_verb_present__eul_ttae: makeCuratedExample(
    "비가 오는 것 같을 때는 창문을 닫고 빨래를 안으로 들여요.",
    "Когда кажется, что начинается дождь, я закрываю окно и заношу белье домой."
  ),
  ajida_eojida__ji_anta: makeCuratedExample(
    "날씨가 생각보다 따뜻해져서 더 추워지지 않아요.",
    "Погода неожиданно потеплела, поэтому больше не становится холоднее."
  ),
  geot_gatda_adj__myeon_eumyeon: makeCuratedExample(
    "가격이 너무 비싼 것 같으면 조금 더 찾아보고 나중에 사세요.",
    "Если кажется, что цена слишком высокая, лучше еще поискать и купить позже."
  ),
  geot_gatda_verb_present__myeon_eumyeon: makeCuratedExample(
    "비가 오는 것 같으면 조금 일찍 출발하는 게 좋아요.",
    "Если кажется, что начинается дождь, лучше выйти немного пораньше."
  )
});

Object.assign(exampleBank.single, {
  go_sipda: makeCuratedExample(
    "오늘 저녁에는 한국 음식을 먹고 싶어요.",
    "Сегодня вечером я хочу поесть корейскую еду."
  ),
  neuryeogo_hada: makeCuratedExample(
    "주말에 오랜만에 친구를 만나려고 해요.",
    "На выходных я собираюсь наконец встретиться с другом."
  ),
  aseo_eoseo: makeCuratedExample(
    "밖에 비가 와서 오늘은 집에 있어요.",
    "На улице идет дождь, поэтому сегодня я дома."
  ),
  jiman: makeCuratedExample(
    "한국어는 아직 어렵지만 배울수록 재미있어요.",
    "Корейский пока трудный, но чем больше его учишь, тем интереснее."
  ),
  eul_ttae: makeCuratedExample(
    "시간이 있을 때 카페에서 책을 읽어요.",
    "Когда у меня есть время, я читаю книгу в кафе."
  ),
  ji_anta: makeCuratedExample(
    "오늘은 늦게 자고 싶지 않아서 커피를 마시지 않아요.",
    "Сегодня я не пью кофе, потому что не хочу поздно ложиться спать."
  ),
  geot_gatda_adj: makeCuratedExample(
    "이 가방은 디자인은 예쁘지만 조금 비싼 것 같아요.",
    "Эта сумка красивая по дизайну, но, кажется, немного дорогая."
  ),
  geot_gatda_verb_present: makeCuratedExample(
    "창밖을 보니까 밖에 비가 오는 것 같아요.",
    "Судя по окну, кажется, на улице идет дождь."
  ),
  ajida_eojida: makeCuratedExample(
    "가을이 되니까 날씨가 점점 추워져요.",
    "Наступает осень, и погода постепенно становится холоднее."
  ),
  myeon_eumyeon: makeCuratedExample(
    "오늘 시간이 없으면 숙제는 내일 해도 돼요.",
    "Если сегодня нет времени, домашнее задание можно сделать завтра."
  ),
  past_tense: makeCuratedExample(
    "어제 친구를 만나러 학교에 갔어요.",
    "Вчера я пошел(пошла) в школу, чтобы встретиться с другом."
  )
});

Object.assign(exampleBank.chain, {
  go_sipda__geot_gatda_adj: makeCuratedExample(
    "민수는 오늘 많이 피곤해서 집에 가고 싶은 것 같아요.",
    "Кажется, Минсу сегодня очень устал и хочет пойти домой."
  ),
  go_sipda__ji_anta: makeCuratedExample(
    "오늘은 속이 안 좋아서 아무것도 먹고 싶지 않아요.",
    "Сегодня у меня болит живот, поэтому совсем не хочется ничего есть."
  ),
  neuryeogo_hada__aseo_eoseo: makeCuratedExample(
    "오늘은 일찍 자려고 해서 숙제를 저녁에 빨리 했어요.",
    "Сегодня я хотел(а) лечь пораньше, поэтому быстро сделал(а) домашнее задание еще вечером."
  ),
  ji_anta__geot_gatda_verb_present: makeCuratedExample(
    "창밖을 보니까 지금은 비가 오지 않는 것 같아요.",
    "Судя по окну, кажется, сейчас дождь уже не идет."
  ),
  ji_anta__geot_gatda_adj: makeCuratedExample(
    "메뉴를 보니까 그 식당은 그렇게 비싸지 않은 것 같아요.",
    "Судя по меню, тот ресторан, кажется, не такой уж дорогой."
  ),
  ajida_eojida__geot_gatda_verb_present: makeCuratedExample(
    "바람이 불어서 날씨가 더 추워지는 것 같아요.",
    "Из-за ветра кажется, что погода становится еще холоднее."
  ),
  past_tense__eul_ttae: makeCuratedExample(
    "어릴 때는 이 노래를 들으면서 자주 잤어요.",
    "Когда я был(а) маленьким(ой), я часто засыпал(а) под эту песню."
  ),
  past_tense__jiman: makeCuratedExample(
    "어제는 정말 바빴지만 오늘은 조금 여유가 있어요.",
    "Вчера я был(а) очень занят(а), но сегодня у меня уже есть немного свободного времени."
  ),
  go_sipda__aseo_eoseo: makeCuratedExample(
    "점심을 못 먹어서 지금은 따뜻한 국을 빨리 먹고 싶어요.",
    "Я не успел(а) пообедать, поэтому сейчас очень хочу поскорее поесть горячего супа."
  ),
  go_sipda__jiman: makeCuratedExample(
    "집에 가서 쉬고 싶지만 아직 끝내야 할 일이 많아요.",
    "Хочется пойти домой и отдохнуть, но у меня еще много дел, которые нужно закончить."
  ),
  go_sipda__eul_ttae: makeCuratedExample(
    "공부하다가 집에 가고 싶을 때는 조용한 음악을 들어요.",
    "Когда во время учебы мне хочется пойти домой, я слушаю спокойную музыку."
  ),
  go_sipda__myeon_eumyeon: makeCuratedExample(
    "주말에 여행을 가고 싶으면 기차표를 먼저 예매해야 해요.",
    "Если хочешь поехать куда-нибудь на выходных, нужно заранее купить билет на поезд."
  ),
  neuryeogo_hada__jiman: makeCuratedExample(
    "오늘 공원에서 운동하려고 하지만 갑자기 비가 와요.",
    "Сегодня я собираюсь позаниматься спортом в парке, но вдруг начинается дождь."
  ),
  neuryeogo_hada__eul_ttae: makeCuratedExample(
    "집에서 집중해서 공부하려고 할 때는 조용한 방을 먼저 찾아요.",
    "Когда я собираюсь серьезно заниматься дома, я сначала ищу тихую комнату."
  ),
  neuryeogo_hada__myeon_eumyeon: makeCuratedExample(
    "오늘 일찍 자려고 하면 저녁에는 커피를 마시지 않아요.",
    "Если я собираюсь сегодня лечь пораньше, вечером я не пью кофе."
  ),
  ji_anta__aseo_eoseo: makeCuratedExample(
    "오늘은 회사에서 바쁘지 않아서 같이 천천히 점심을 먹을 수 있어요.",
    "Сегодня на работе не очень занято, поэтому мы можем спокойно пообедать вместе."
  ),
  ji_anta__jiman: makeCuratedExample(
    "그 영화는 그렇게 재미있지 않지만 배우가 좋아서 한 번 보고 싶어요.",
    "Фильм не очень интересный, но мне нравится актер, поэтому я все равно хочу посмотреть его один раз."
  ),
  ji_anta__eul_ttae: makeCuratedExample(
    "주말에 바쁘지 않을 때는 집 근처 공원에서 산책을 해요.",
    "Когда на выходных я не занята, я гуляю в парке рядом с домом."
  ),
  ji_anta__myeon_eumyeon: makeCuratedExample(
    "내일도 아프지 않으면 학교에 가서 수업을 들을 거예요.",
    "Если завтра я тоже не буду болеть, то пойду в школу на занятия."
  ),
  ajida_eojida__aseo_eoseo: makeCuratedExample(
    "저녁이 되니까 날씨가 추워져서 창문을 닫았어요.",
    "К вечеру похолодало, поэтому я закрыл(а) окно."
  ),
  ajida_eojida__jiman: makeCuratedExample(
    "새 집으로 이사한 뒤 생활은 편해졌지만 출근길은 더 멀어졌어요.",
    "После переезда в новый дом жить стало удобнее, но дорога на работу стала длиннее."
  ),
  ajida_eojida__eul_ttae: makeCuratedExample(
    "기분이 좋아질 때는 친구를 만나서 같이 커피를 마셔요.",
    "Когда настроение улучшается, я встречаюсь с друзьями и пью с ними кофе."
  ),
  ajida_eojida__myeon_eumyeon: makeCuratedExample(
    "날씨가 더 좋아지면 산에 올라가서 멀리 볼 수 있어요.",
    "Если погода станет лучше, можно будет подняться в горы и смотреть далеко вокруг."
  ),
  past_tense__myeon_eumyeon: makeCuratedExample(
    "약속 시간에 늦었으면 바로 전화해 주세요.",
    "Если вы опоздали ко времени встречи, пожалуйста, сразу позвоните."
  ),
  ji_anta__past_tense: makeCuratedExample(
    "어제는 생각보다 바쁘지 않아서 일찍 집에 갔어요.",
    "Вчера было не так занято, как я ожидал(а), поэтому я рано пошел(пошла) домой."
  ),
  go_sipda__past_tense: makeCuratedExample(
    "어제는 너무 피곤해서 집에 일찍 가고 싶었어요.",
    "Вчера я очень устал(а), поэтому мне хотелось пораньше пойти домой."
  ),
  neuryeogo_hada__past_tense: makeCuratedExample(
    "주말에 친구를 만나려고 했는데 갑자기 일이 생겼어요.",
    "На выходных я собирался(собиралась) встретиться с другом, но вдруг появились дела."
  ),
  ajida_eojida__go_sipda: makeCuratedExample(
    "요즘은 운동도 하고 더 건강해지고 싶어요.",
    "В последнее время мне хочется заниматься спортом и стать здоровее."
  ),
  neuryeogo_hada__ji_anta: makeCuratedExample(
    "내일 일찍 일어나야 해서 오늘은 늦게 자려고 하지 않아요.",
    "Завтра мне нужно рано вставать, поэтому сегодня я не собираюсь ложиться поздно."
  ),
  neuryeogo_hada__geot_gatda_verb_present: makeCuratedExample(
    "가방을 챙기는 걸 보니 민수는 집에 가려고 하는 것 같아요.",
    "Судя по тому, что Минсу собирает сумку, кажется, он собирается идти домой."
  ),
  ajida_eojida__neuryeogo_hada: makeCuratedExample(
    "요즘은 아침에 일찍 일어나면서 더 부지런해지려고 해요.",
    "В последнее время я стараюсь вставать пораньше и стать более собранным(ой)."
  ),
  geot_gatda_adj__aseo_eoseo: makeCuratedExample(
    "오늘은 조금 피곤한 것 같아서 일찍 자려고 해요.",
    "Сегодня я, кажется, немного устал(а), поэтому собираюсь лечь пораньше."
  ),
  geot_gatda_verb_present__aseo_eoseo: makeCuratedExample(
    "밖에 비가 오는 것 같아서 우산을 가져가요.",
    "Кажется, на улице идет дождь, поэтому я беру зонт."
  ),
  geot_gatda_adj__jiman: makeCuratedExample(
    "그 책은 재미있는 것 같지만 아직 끝까지 읽지는 못했어요.",
    "Кажется, книга интересная, но я еще не успел(а) дочитать ее до конца."
  ),
  geot_gatda_verb_present__jiman: makeCuratedExample(
    "지금 비가 오는 것 같지만 그래도 약속에 나갈 거예요.",
    "Похоже, сейчас идет дождь, но я все равно пойду на встречу."
  ),
  geot_gatda_adj__eul_ttae: makeCuratedExample(
    "피곤한 것 같을 때는 따뜻한 차를 마시고 조금 쉬어요.",
    "Когда мне кажется, что я устал(а), я пью теплый чай и немного отдыхаю."
  ),
  geot_gatda_verb_present__eul_ttae: makeCuratedExample(
    "비가 오는 것 같을 때는 창문을 닫고 빨래를 안으로 들여요.",
    "Когда кажется, что начинается дождь, я закрываю окно и заношу белье домой."
  ),
  ajida_eojida__ji_anta: makeCuratedExample(
    "날씨가 생각보다 따뜻해져서 더 추워지지 않아요.",
    "Погода потеплела сильнее, чем я ожидал(а), поэтому больше не становится холоднее."
  ),
  geot_gatda_adj__myeon_eumyeon: makeCuratedExample(
    "가격이 너무 비싼 것 같으면 조금 더 찾아보고 나중에 사세요.",
    "Если кажется, что цена слишком высокая, лучше еще поискать и купить позже."
  ),
  geot_gatda_verb_present__myeon_eumyeon: makeCuratedExample(
    "비가 오는 것 같으면 조금 일찍 출발하는 게 좋아요.",
    "Если кажется, что начинается дождь, лучше выйти немного пораньше."
  )
});

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ",
  "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"
];

function getGrammarById(grammarId) {
  return grammarList.find((item) => item.id === grammarId);
}

function getWordById(wordId) {
  return wordList.find((item) => item.id === wordId);
}

function getResultType(grammar, currentType) {
  if (grammar.resultTypeByInput) {
    return grammar.resultTypeByInput[currentType] ?? null;
  }

  return grammar.resultType ?? null;
}

function canConnect(firstGrammarId, secondGrammarId, basePos) {
  const first = getGrammarById(firstGrammarId);
  const second = getGrammarById(secondGrammarId);

  if (!first || !second) {
    return { ok: false, reason: "Не удалось найти одну из грамматик." };
  }

  if (!first.inputType.includes(basePos)) {
    return {
      ok: false,
      reason: `Первая грамматика не присоединяется к типу "${basePos}".`
    };
  }

  return canFollow(firstGrammarId, secondGrammarId, getResultType(first, basePos));
}

function canFollow(firstGrammarId, secondGrammarId, firstResultType) {
  const first = getGrammarById(firstGrammarId);
  const second = getGrammarById(secondGrammarId);

  if (!first || !second) {
    return { ok: false, reason: "Не удалось найти одну из грамматик." };
  }

  const firstMap = grammaticalCompatibilityMap[firstGrammarId];
  const secondMap = grammaticalCompatibilityMap[secondGrammarId];

  if (!firstMap || !secondMap) {
    return { ok: false, reason: "Для одной из грамматик нет карты совместимости." };
  }

  const nextOk = firstMap.allowedNext.includes(secondGrammarId);
  const prevOk = secondMap.allowedPrev.includes(firstGrammarId);

  if (!nextOk || !prevOk) {
    return { ok: false, reason: "Эти грамматики не соединяются в таком порядке." };
  }

  const condition = compatibilityConditions?.[firstGrammarId]?.[secondGrammarId];
  if (condition && condition.onlyIfResultType !== firstResultType) {
    return {
      ok: false,
      reason: `Это соединение возможно только если результат первой грамматики имеет тип "${condition.onlyIfResultType}".`
    };
  }

  if (!second.inputType.includes(firstResultType)) {
    return {
      ok: false,
      reason: `Вторая грамматика не присоединяется к типу "${firstResultType}".`
    };
  }

  return {
    ok: true,
    reason: "Эти грамматики можно соединить.",
    firstResultType,
    secondResultType: getResultType(second, firstResultType)
  };
}

function getResultTypeForStep(grammarId, currentType) {
  const grammar = getGrammarById(grammarId);
  return grammar ? getResultType(grammar, currentType) : null;
}

function findValidGrammarOrder(grammarIds, basePos) {
  const used = new Array(grammarIds.length).fill(false);
  const results = [];

  function backtrack(path, currentType) {
    if (path.length === grammarIds.length) {
      results.push([...path]);
      return;
    }

    for (let i = 0; i < grammarIds.length; i += 1) {
      if (used[i]) continue;

      const grammarId = grammarIds[i];
      const grammar = getGrammarById(grammarId);
      if (!grammar) continue;

      if (path.length === 0) {
        if (!grammar.inputType.includes(basePos)) continue;

        used[i] = true;
        path.push(grammarId);
        backtrack(path, getResultTypeForStep(grammarId, basePos));
        path.pop();
        used[i] = false;
        continue;
      }

      const previousGrammarId = path[path.length - 1];
      const connectResult = canFollow(previousGrammarId, grammarId, currentType);
      if (!connectResult.ok) continue;

      used[i] = true;
      path.push(grammarId);
      backtrack(path, connectResult.secondResultType);
      path.pop();
      used[i] = false;
    }
  }

  backtrack([], basePos);

  if (results.length === 0) {
    return { ok: false, reason: "Эти грамматики не соединяются." };
  }

  return { ok: true, order: results[0], allOrders: results };
}

function buildOrderTypeTrace(order, basePos) {
  const trace = [];
  let currentType = basePos;

  for (let index = 0; index < order.length; index += 1) {
    const grammarId = order[index];
    const resultType = getResultTypeForStep(grammarId, currentType);

    trace.push({
      grammarId,
      inputType: currentType,
      resultType
    });

    currentType = resultType;
  }

  return trace;
}

function translateResultType(type) {
  const labels = {
    verb: "глагольной",
    adjective: "прилагательной",
    clause_connector: "соединительной",
    noun_phrase: "именной",
    final: "финальной"
  };

  return labels[type] || type;
}

function humanizeReason(reason, previousGrammarId, nextGrammarId) {
  const previousLabel = getGrammarById(previousGrammarId)?.label || previousGrammarId;
  const nextLabel = getGrammarById(nextGrammarId)?.label || nextGrammarId;

  if (reason === "Эти грамматики не соединяются в таком порядке.") {
    return `${previousLabel} не может стоять перед ${nextLabel}.`;
  }

  const condition = compatibilityConditions?.[previousGrammarId]?.[nextGrammarId];
  if (condition?.onlyIfResultType) {
    const typeLabel = translateResultType(condition.onlyIfResultType);
    return `${nextLabel} присоединяется после ${previousLabel} только если форма к этому моменту уже становится ${typeLabel}.`;
  }

  if (reason?.includes("Вторая грамматика не присоединяется к типу")) {
    const previousGrammar = getGrammarById(previousGrammarId);
    const previousType = previousGrammar?.resultTypeByInput
      ? Object.values(previousGrammar.resultTypeByInput)[0]
      : previousGrammar?.resultType;

    if (previousType) {
      return `После ${previousLabel} форма уже становится ${translateResultType(previousType)}, поэтому ${nextLabel} сюда не присоединяется.`;
    }

    return `${nextLabel} не присоединяется к форме после ${previousLabel}.`;
  }

  return reason || `${previousLabel} и ${nextLabel} здесь не соединяются.`;
}

function getPermutations(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  if (items.length === 1) {
    return [[items[0]]];
  }

  const result = [];

  for (let index = 0; index < items.length; index += 1) {
    const current = items[index];
    const rest = items.filter((_, restIndex) => restIndex !== index);
    const restPermutations = getPermutations(rest);

    for (const permutation of restPermutations) {
      result.push([current, ...permutation]);
    }
  }

  return result;
}

function explainBestFailedOrder(selectedGrammarIds) {
  if (!Array.isArray(selectedGrammarIds) || selectedGrammarIds.length < 2) {
    return null;
  }

  const permutations = getPermutations(selectedGrammarIds);
  let bestFailure = null;

  for (const basePos of ["verb", "adjective"]) {
    for (const order of permutations) {
      let currentType = basePos;
      let builtOrder = [];
      let failure = null;

      for (let index = 0; index < order.length; index += 1) {
        const grammarId = order[index];
        const grammar = getGrammarById(grammarId);

        if (!grammar) {
          failure = {
            builtOrder,
            reason: "Не удалось найти одну из грамматик.",
            depth: builtOrder.length
          };
          break;
        }

        if (index === 0) {
          if (!grammar.inputType.includes(basePos)) {
            failure = {
              builtOrder: [],
              reason: `${grammar.label} не может стоять первой после ${basePos === "verb" ? "глагола" : "прилагательного"}.`,
              depth: 0
            };
            break;
          }

          builtOrder.push(grammarId);
          currentType = getResultTypeForStep(grammarId, basePos);
          continue;
        }

        const previousGrammarId = builtOrder[builtOrder.length - 1];
        const connectResult = canFollow(previousGrammarId, grammarId, currentType);

        if (!connectResult.ok) {
          failure = {
            builtOrder: [...builtOrder],
            reason: humanizeReason(connectResult.reason, previousGrammarId, grammarId),
            depth: builtOrder.length
          };
          break;
        }

        builtOrder.push(grammarId);
        currentType = connectResult.secondResultType;
      }

      if (!failure) {
        continue;
      }

      if (!bestFailure || failure.depth > bestFailure.depth) {
        bestFailure = failure;
      }
    }
  }

  if (!bestFailure) {
    return null;
  }

  const builtLabels = bestFailure.builtOrder
    .map((grammarId) => getGrammarById(grammarId)?.label || grammarId)
    .join(" -> ");

  if (builtLabels) {
    return `Ближе всего подходит такой порядок: ${builtLabels}. Дальше цепочка останавливается, потому что ${bestFailure.reason}`;
  }

  return bestFailure.reason;
}

function explainNearMissSelection(selectedGrammarIds) {
  const swapPairs = [
    {
      from: "geot_gatda_verb_present",
      to: "geot_gatda_adj",
      reasonType: "adjective"
    },
    {
      from: "geot_gatda_adj",
      to: "geot_gatda_verb_present",
      reasonType: "verb"
    }
  ];

  for (const pair of swapPairs) {
    const targetIndex = selectedGrammarIds.indexOf(pair.from);
    if (targetIndex === -1 || selectedGrammarIds.includes(pair.to)) {
      continue;
    }

    const replacedGrammarIds = [...selectedGrammarIds];
    replacedGrammarIds[targetIndex] = pair.to;

    for (const basePos of ["verb", "adjective"]) {
      const orderResult = findValidGrammarOrder(replacedGrammarIds, basePos);
      if (!orderResult.ok) {
        continue;
      }

      const trace = buildOrderTypeTrace(orderResult.order, basePos);
      const replacedStep = trace.find((step) => step.grammarId === pair.to);
      const beforeType = replacedStep?.inputType || null;

      if (beforeType !== pair.reasonType) {
        continue;
      }

      const wrongGrammar = getGrammarById(pair.from);
      const correctGrammar = getGrammarById(pair.to);
      const orderLabels = orderResult.order
        .map((grammarId) => getGrammarById(grammarId)?.label || grammarId)
        .join(" -> ");

      const typeReason =
        pair.reasonType === "adjective"
          ? "перед этой точкой форма уже становится прилагательной"
          : "перед этой точкой форма уже становится глагольной";

      return `Эта цепочка почти собирается. Здесь нужна ${correctGrammar?.label || pair.to} вместо ${wrongGrammar?.label || pair.from}, потому что ${typeReason}. Подходящий порядок: ${orderLabels}.`;
    }
  }

  return null;
}

function explainTerminalGrammarConflict(selectedGrammarIds) {
  const terminalGroups = [
    {
      ids: ["aseo_eoseo", "jiman", "myeon_eumyeon"],
      label: "соединительные грамматики"
    },
    {
      ids: ["geot_gatda_adj", "geot_gatda_verb_present"],
      label: "формы 것 같다"
    }
  ];

  for (const group of terminalGroups) {
    const selectedInGroup = selectedGrammarIds.filter((grammarId) => group.ids.includes(grammarId));
    if (selectedInGroup.length < 2) {
      continue;
    }

    const labels = selectedInGroup
      .map((grammarId) => getGrammarById(grammarId)?.label || grammarId)
      .join(", ");

    if (group.label === "соединительные грамматики") {
      return `Эта цепочка не собирается, потому что здесь выбрано сразу несколько соединительных грамматик: ${labels}. В одной цепочке такого типа обычно нужна только одна грамматика, которая завершает первую часть предложения.`;
    }

    return `Эта цепочка не собирается, потому что здесь выбрано сразу несколько форм ${group.label}: ${labels}. Нужно оставить только один подходящий вариант для этой точки цепочки.`;
  }

  return null;
}

function explainSingleBlockingGrammar(selectedGrammarIds) {
  if (selectedGrammarIds.length < 3) {
    return null;
  }

  for (let index = 0; index < selectedGrammarIds.length; index += 1) {
    const reducedGrammarIds = selectedGrammarIds.filter((_, currentIndex) => currentIndex !== index);

    for (const basePos of ["verb", "adjective"]) {
      const orderResult = findValidGrammarOrder(reducedGrammarIds, basePos);
      if (!orderResult.ok) {
        continue;
      }

      const blockedGrammar = getGrammarById(selectedGrammarIds[index]);
      const orderLabels = orderResult.order
        .map((grammarId) => getGrammarById(grammarId)?.label || grammarId)
        .join(" -> ");

      return `Почти вся цепочка собирается, но ${blockedGrammar?.label || selectedGrammarIds[index]} не встраивается вместе с остальными. Без нее получается такая рабочая цепочка: ${orderLabels}.`;
    }
  }

  return null;
}

function buildNotConnectableExplanation(selectedGrammarIds) {
  const nearMissExplanation = explainNearMissSelection(selectedGrammarIds);
  if (nearMissExplanation) {
    return nearMissExplanation;
  }

  const terminalConflictExplanation = explainTerminalGrammarConflict(selectedGrammarIds);
  if (terminalConflictExplanation) {
    return terminalConflictExplanation;
  }

  const blockingGrammarExplanation = explainSingleBlockingGrammar(selectedGrammarIds);
  if (blockingGrammarExplanation) {
    return blockingGrammarExplanation;
  }

  return "Эти грамматики не соединяются.";
}

const originalBuildNotConnectableExplanation = buildNotConnectableExplanation;

buildNotConnectableExplanation = function buildNotConnectableExplanationWithFallback(selectedGrammarIds) {
  const originalExplanation = originalBuildNotConnectableExplanation(selectedGrammarIds);
  const bestFailedOrderExplanation = explainBestFailedOrder(selectedGrammarIds);

  if (
    originalExplanation &&
    originalExplanation.startsWith("Почти вся цепочка собирается") &&
    bestFailedOrderExplanation
  ) {
    return `${originalExplanation} ${bestFailedOrderExplanation}`;
  }

  if (
    originalExplanation &&
    originalExplanation !== "Эти грамматики не соединяются." &&
    originalExplanation !== "Р­С‚Рё РіСЂР°РјРјР°С‚РёРєРё РЅРµ СЃРѕРµРґРёРЅСЏСЋС‚СЃСЏ."
  ) {
    return originalExplanation;
  }

  if (bestFailedOrderExplanation) {
    return bestFailedOrderExplanation;
  }

  return "Эти грамматики не соединяются.";
};

function stripDa(lemma) {
  return lemma.endsWith("다") ? lemma.slice(0, -1) : lemma;
}

function decomposeSyllable(char) {
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) return null;

  const offset = code - HANGUL_BASE;
  const jong = offset % 28;
  const jung = Math.floor(offset / 28) % 21;
  const cho = Math.floor(offset / 588);

  return { cho, jung, jong };
}

function composeSyllable(cho, jung, jong) {
  return String.fromCharCode(HANGUL_BASE + cho * 588 + jung * 28 + jong);
}

function getLastSyllable(stem) {
  return stem[stem.length - 1];
}

function getLastJung(stem) {
  const syllable = decomposeSyllable(getLastSyllable(stem));
  return syllable ? JUNGSEONG[syllable.jung] : null;
}

function getLastJongIndex(stem) {
  const syllable = decomposeSyllable(getLastSyllable(stem));
  return syllable ? syllable.jong : 0;
}

function hasBatchim(stem) {
  return getLastJongIndex(stem) !== 0;
}

function endsWithLieul(stem) {
  return getLastJongIndex(stem) === 8;
}

function removeLastSyllable(stem) {
  return stem.slice(0, -1);
}

function replaceLastJong(stem, jongIndex) {
  const last = getLastSyllable(stem);
  const decomposed = decomposeSyllable(last);
  if (!decomposed) return stem;

  return removeLastSyllable(stem) + composeSyllable(decomposed.cho, decomposed.jung, jongIndex);
}

function replaceLastJung(stem, jungIndex) {
  const last = getLastSyllable(stem);
  const decomposed = decomposeSyllable(last);
  if (!decomposed) return stem;

  return removeLastSyllable(stem) + composeSyllable(decomposed.cho, jungIndex, 0);
}

function makeOpenSyllable(stem) {
  return replaceLastJong(stem, 0);
}

function addFinalConsonant(stem, jongIndex) {
  return replaceLastJong(stem, jongIndex);
}

function isAVowel(jung) {
  return jung === "ㅏ" || jung === "ㅗ";
}

function getPrecedingJung(stem) {
  if (stem.length < 2) return null;
  const syllable = decomposeSyllable(stem[stem.length - 2]);
  return syllable ? JUNGSEONG[syllable.jung] : null;
}

function transformEuDropStem(stem) {
  const precedingJung = getPrecedingJung(stem);
  const useA = precedingJung ? isAVowel(precedingJung) : false;
  return replaceLastJung(stem, useA ? 0 : 4);
}

function addAEOFamily(stem, conjugationType) {
  if (conjugationType === "hada") return stem.slice(0, -1) + "해";

  if (conjugationType === "d_irregular") {
    stem = replaceLastJong(stem, 8);
  }

  if (conjugationType === "b_irregular") {
    return makeOpenSyllable(stem) + "워";
  }

  if (conjugationType === "reu_irregular") {
    const withoutReu = stem.slice(0, -1);
    const lastJung = getLastJung(withoutReu);
    return addFinalConsonant(withoutReu, 8) + (isAVowel(lastJung) ? "라" : "러");
  }

  if (conjugationType === "eu_drop") {
    return transformEuDropStem(stem);
  }

  const lastJung = getLastJung(stem);

  if (!hasBatchim(stem) && (lastJung === "ㅏ" || lastJung === "ㅓ")) {
    return stem;
  }

  if (!hasBatchim(stem) && lastJung === "ㅗ") {
    return replaceLastJung(stem, 9);
  }

  return stem + (isAVowel(lastJung) ? "아" : "어");
}

function addPast(stem, conjugationType) {
  if (conjugationType === "hada") return stem.slice(0, -1) + "했";

  if (conjugationType === "d_irregular") {
    stem = replaceLastJong(stem, 8);
  }

  if (conjugationType === "b_irregular") {
    return makeOpenSyllable(stem) + "웠";
  }

  if (conjugationType === "reu_irregular") {
    const withoutReu = stem.slice(0, -1);
    const lastJung = getLastJung(withoutReu);
    return addFinalConsonant(withoutReu, 8) + (isAVowel(lastJung) ? "랐" : "렀");
  }

  if (conjugationType === "eu_drop") {
    return addFinalConsonant(transformEuDropStem(stem), 20);
  }

  const lastJung = getLastJung(stem);

  if (!hasBatchim(stem) && (lastJung === "ㅏ" || lastJung === "ㅓ")) {
    return addFinalConsonant(stem, 20);
  }

  if (!hasBatchim(stem) && lastJung === "ㅗ") {
    return addFinalConsonant(replaceLastJung(stem, 9), 20);
  }

  return stem + (isAVowel(lastJung) ? "았" : "었");
}

function addMyeon(stem, conjugationType) {
  if (conjugationType === "d_irregular") {
    return replaceLastJong(stem, 8) + "으면";
  }

  if (conjugationType === "b_irregular") {
    return makeOpenSyllable(stem) + "우면";
  }

  if (!hasBatchim(stem) || endsWithLieul(stem)) {
    return stem + "면";
  }

  return stem + "으면";
}

function addEulTtae(stem, conjugationType) {
  if (conjugationType === "d_irregular") {
    return replaceLastJong(stem, 8) + "을 때";
  }

  if (conjugationType === "b_irregular") {
    return makeOpenSyllable(stem) + "울 때";
  }

  if (!hasBatchim(stem) || endsWithLieul(stem)) {
    return addFinalConsonant(stem, 8) + " 때";
  }

  return stem + "을 때";
}

function addNeuryeogoHada(stem, conjugationType) {
  if (conjugationType === "hada") {
    return stem.slice(0, -1) + "하려고 하다";
  }

  if (conjugationType === "d_irregular") {
    stem = replaceLastJong(stem, 8);
  }

  if (!hasBatchim(stem) || endsWithLieul(stem)) {
    return stem + "려고 하다";
  }

  return stem + "으려고 하다";
}

function addAdjModifier(stem, conjugationType, lemma) {
  if (lemma.endsWith("있다") || lemma.endsWith("없다")) {
    return stem + "는";
  }

  if (conjugationType === "hada") {
    return stem.slice(0, -1) + "한";
  }

  if (conjugationType === "b_irregular") {
    return makeOpenSyllable(stem) + "운";
  }

  if (conjugationType === "reu_irregular") {
    return stem.slice(0, -1) + "른";
  }

  if (conjugationType === "eu_drop") {
    return addFinalConsonant(stem, 4);
  }

  if (!hasBatchim(stem) || endsWithLieul(stem)) {
    return addFinalConsonant(stem, 4);
  }

  return stem + "은";
}

function buildForm(word, grammarId, conjugationType) {
  const stem = stripDa(word.lemma);

  switch (grammarId) {
    case "past_tense":
      return addPast(stem, conjugationType);
    case "go_sipda":
      return stem + "고 싶다";
    case "neuryeogo_hada":
      return addNeuryeogoHada(stem, conjugationType);
    case "aseo_eoseo":
      return addAEOFamily(stem, conjugationType) + "서";
    case "jiman":
      return stem + "지만";
    case "eul_ttae":
      return addEulTtae(stem, conjugationType);
    case "ji_anta":
      return stem + "지 않다";
    case "geot_gatda_adj":
      return addAdjModifier(stem, conjugationType, word.lemma) + " 것 같다";
    case "geot_gatda_verb_present":
      return stem + "는 것 같다";
    case "ajida_eojida":
      return addAEOFamily(stem, conjugationType) + "지다";
    case "myeon_eumyeon":
      return addMyeon(stem, conjugationType);
    default:
      return null;
  }
}

function conjugate(word, grammarId) {
  const grammar = getGrammarById(grammarId);

  if (!grammar.inputType.includes(word.pos)) {
    return {
      ok: false,
      reason: `Грамматика ${grammar.label} не присоединяется к ${word.pos}.`
    };
  }

  const conjugationType = conjugationMap[word.id] ?? "regular";
  const form = buildForm(word, grammarId, conjugationType);

  if (!form) {
    return { ok: false, reason: "Не удалось построить форму." };
  }

  return { ok: true, form, base: word.lemma, grammarId };
}

function getPredicateMeta(form, lastGrammarId, resultType) {
  switch (lastGrammarId) {
    case "go_sipda":
      return {
        prefix: form.slice(0, -2),
        predicateLemma: "싶다",
        resultType
      };
    case "neuryeogo_hada":
      return {
        prefix: form.slice(0, -2),
        predicateLemma: "하다",
        resultType
      };
    case "ji_anta":
      return {
        prefix: form.slice(0, -2),
        predicateLemma: "않다",
        resultType
      };
    case "geot_gatda_adj":
    case "geot_gatda_verb_present":
      return {
        prefix: form.slice(0, -2),
        predicateLemma: "같다",
        resultType
      };
    case "ajida_eojida":
      return {
        prefix: form.slice(0, -2),
        predicateLemma: "지다",
        resultType
      };
    default:
      return {
        prefix: "",
        predicateLemma: form,
        resultType
      };
  }
}

function inferConjugationTypeFromLemma(lemma) {
  if (lemma.endsWith("하다")) return "hada";
  if (lemma === "같다") return "regular";
  if (lemma === "않다") return "regular";
  if (lemma === "싶다") return "regular";
  if (lemma === "지다") return "regular";
  return "regular";
}

function buildWordFormFromLemma(lemma, grammarId, conjugationType) {
  return buildForm({ lemma }, grammarId, conjugationType);
}

function conjugatePredicatePhrase(currentForm, grammarId, lastGrammarId, currentType) {
  const { prefix, predicateLemma } = getPredicateMeta(currentForm, lastGrammarId, currentType);
  const conjugationType = inferConjugationTypeFromLemma(predicateLemma);
  const newPredicate = buildWordFormFromLemma(predicateLemma, grammarId, conjugationType);

  if (!newPredicate) return null;
  return prefix ? `${prefix}${newPredicate}` : newPredicate;
}

function conjugatePrefinalStem(prefinalStem, grammarId) {
  switch (grammarId) {
    case "jiman":
      return prefinalStem + "지만";
    case "myeon_eumyeon":
      return prefinalStem + "으면";
    case "eul_ttae":
      return prefinalStem + "을 때";
    default:
      return null;
  }
}

function applyGrammarStep(word, currentState, grammarId) {
  const grammar = getGrammarById(grammarId);
  if (!grammar) {
    return { ok: false, reason: "Не удалось применить грамматику." };
  }

  if (currentState.stepIndex === 0) {
    const firstStep = conjugate(word, grammarId);
    if (!firstStep.ok) return firstStep;

    return {
      ok: true,
      form: firstStep.form,
      resultType: getResultTypeForStep(grammarId, currentState.resultType),
      stepIndex: 1,
      appliedGrammarIds: [...currentState.appliedGrammarIds, grammarId],
      lastGrammarId: grammarId
    };
  }

  const lastGrammar = getGrammarById(currentState.lastGrammarId);

  if (lastGrammar?.id === "past_tense") {
    const form = conjugatePrefinalStem(currentState.form, grammarId);
    if (!form) {
      return {
        ok: false,
        reason: "Не удалось продолжить цепочку после прошедшего времени."
      };
    }

    return {
      ok: true,
      form,
      resultType: getResultTypeForStep(grammarId, currentState.resultType),
      stepIndex: currentState.stepIndex + 1,
      appliedGrammarIds: [...currentState.appliedGrammarIds, grammarId],
      lastGrammarId: grammarId
    };
  }

  const form = conjugatePredicatePhrase(
    currentState.form,
    grammarId,
    currentState.lastGrammarId,
    currentState.resultType
  );

  if (!form) {
    return {
      ok: false,
      reason: "Не удалось построить следующую форму цепочки."
    };
  }

  return {
    ok: true,
    form,
    resultType: getResultTypeForStep(grammarId, currentState.resultType),
    stepIndex: currentState.stepIndex + 1,
    appliedGrammarIds: [...currentState.appliedGrammarIds, grammarId],
    lastGrammarId: grammarId
  };
}

function conjugateChain(word, grammarIds) {
  if (!Array.isArray(grammarIds) || grammarIds.length === 0) {
    return { ok: false, reason: "Нужно передать хотя бы одну грамматику." };
  }

  const orderResult = findValidGrammarOrder(grammarIds, word.pos);
  if (!orderResult.ok) {
    return { ok: false, reason: orderResult.reason };
  }

  let currentState = {
    form: word.lemma,
    resultType: word.pos,
    stepIndex: 0,
    appliedGrammarIds: [],
    lastGrammarId: null
  };

  for (const grammarId of orderResult.order) {
    const stepResult = applyGrammarStep(word, currentState, grammarId);
    if (!stepResult.ok) {
      return {
        ok: false,
        reason: stepResult.reason,
        order: orderResult.order,
        failedAt: grammarId
      };
    }

    currentState = stepResult;
  }

  return {
    ok: true,
    order: orderResult.order,
    allOrders: orderResult.allOrders,
    form: currentState.form,
    base: word.lemma,
    resultType: currentState.resultType
  };
}

function normalizeAnswer(answer) {
  return String(answer ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function toPolitePredicate(stem) {
  if (!stem) return stem;

  if (stem.endsWith("하")) {
    return `${stem.slice(0, -1)}해요`;
  }

  const lastJung = getLastJung(stem);
  const openSyllableYoVowels = ["ㅏ", "ㅓ", "ㅐ", "ㅔ", "ㅒ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ"];

  if (!hasBatchim(stem) && openSyllableYoVowels.includes(lastJung)) {
    return `${stem}요`;
  }

  return `${stem}${isAVowel(lastJung) ? "아요" : "어요"}`;
}

function toPoliteAnswer(form, resultType, lastGrammarId) {
  if (!form) return form;

  if (lastGrammarId === "jiman" || lastGrammarId === "neunde" || lastGrammarId === "aseo_eoseo") {
    return form;
  }

  if (resultType === "clause_connector") {
    return `${form}요`;
  }

  if (resultType === "noun_phrase") {
    return `${form}예요`;
  }

  if (form.endsWith("다")) {
    return toPolitePredicate(form.slice(0, -1));
  }

  if (lastGrammarId === "past_tense") {
    return `${form}어요`;
  }

  return toPolitePredicate(form);
}

function buildConnectionExplanation(word, resolvedOrder) {
  const [firstGrammarId, secondGrammarId] = resolvedOrder;
  const lastGrammarId = resolvedOrder[resolvedOrder.length - 1];

  if (firstGrammarId === "go_sipda" && secondGrammarId === "geot_gatda_adj") {
    const finalResult = conjugateChain(word, resolvedOrder);
    return {
      flow: `${word.lemma} -> ${conjugate(word, firstGrammarId).form} -> ${toPoliteAnswer(finalResult.form, finalResult.resultType, lastGrammarId)}`,
      why: "싶다 здесь работает как прилагательное, поэтому дальше нужна форма для прилагательных: -(으)ㄴ 것 같다."
    };
  }

  if (firstGrammarId === "go_sipda" && secondGrammarId === "geot_gatda_verb_present") {
    return {
      flow: `${word.lemma} -> ${conjugate(word, firstGrammarId).form}`,
      why: "После -고 싶다 конструкция ведет себя как прилагательное, поэтому -는 것 같다 здесь не подходит."
    };
  }

  const firstStep = conjugate(word, firstGrammarId);
  const secondStep = conjugateChain(word, resolvedOrder);

  return {
    flow:
      firstStep.ok && secondStep.ok
        ? `${word.lemma} -> ${firstStep.form} -> ${toPoliteAnswer(secondStep.form, secondStep.resultType, lastGrammarId)}`
        : null,
    why: "Сначала применяется первая грамматика, затем вторая присоединяется к результату первой."
  };
}

const originalBuildConnectionExplanation = buildConnectionExplanation;

buildConnectionExplanation = function buildConnectionExplanationWithLabels(word, resolvedOrder) {
  const explanation = originalBuildConnectionExplanation(word, resolvedOrder);

  if (!explanation?.why || !Array.isArray(resolvedOrder) || resolvedOrder.length < 2) {
    return explanation;
  }

  if (!explanation.why.includes("первая грамматика") && !explanation.why.includes("РїРµСЂРІР°СЏ РіСЂР°РјРјР°С‚РёРєР°")) {
    return explanation;
  }

  const firstGrammarLabel = getGrammarById(resolvedOrder[0])?.label || resolvedOrder[0];
  const secondGrammarLabel = getGrammarById(resolvedOrder[1])?.label || resolvedOrder[1];

  return {
    ...explanation,
    why: `Сначала применяется ${firstGrammarLabel}, затем ${secondGrammarLabel} присоединяется к результату первой грамматики.`
  };
};

const labeledBuildConnectionExplanation = buildConnectionExplanation;

buildConnectionExplanation = function buildConnectionExplanationWithNaturalStepText(word, resolvedOrder) {
  const explanation = labeledBuildConnectionExplanation(word, resolvedOrder);

  if (!explanation?.why || !Array.isArray(resolvedOrder) || resolvedOrder.length < 2) {
    return explanation;
  }

  if (
    !explanation.why.includes("Сначала применяется") &&
    !explanation.why.includes("РЎРЅР°С‡Р°Р»Р° РїСЂРёРјРµРЅСЏРµС‚СЃСЏ")
  ) {
    return explanation;
  }

  const firstGrammarLabel = getGrammarById(resolvedOrder[0])?.label || resolvedOrder[0];
  const secondGrammarLabel = getGrammarById(resolvedOrder[1])?.label || resolvedOrder[1];

  return {
    ...explanation,
    why: `Сначала ставится ${firstGrammarLabel}, затем ставится ${secondGrammarLabel}.`
  };
};

function shuffleArray(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function sampleCount(items, count) {
  return shuffleArray(items).slice(0, count);
}

function sameGrammarOrder(a = [], b = []) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getNaturalWhitelistByCount(grammarCount) {
  if (grammarCount === 2) return naturalChainWhitelist;
  if (grammarCount === 3) return naturalTripleChainWhitelist;
  if (grammarCount === 4) return naturalQuadChainWhitelist;
  return [];
}

function isNaturalResolvedOrder(order, grammarCount = order.length) {
  const whitelist = getNaturalWhitelistByCount(grammarCount);

  if (whitelist.length === 0) {
    return true;
  }

  return whitelist.some((allowedOrder) => sameGrammarOrder(allowedOrder, order));
}

function getGrammarCountsByDifficulty(difficulty = "easy") {
  switch (difficulty) {
    case "easy":
      return [2];
    case "hard":
      return [3];
    default:
      return [2];
  }
}

function generateExercise(selectedGrammarIds, preferredWordId, options = {}) {
  const selectedWord = preferredWordId ? getWordById(preferredWordId) : null;
  const candidates = selectedWord ? [selectedWord] : shuffleArray(wordList);

  for (const word of candidates) {
    const chainResult = conjugateChain(word, selectedGrammarIds);
    if (!chainResult.ok) continue;

    const explanation = buildConnectionExplanation(word, chainResult.order);

    return {
      ok: true,
      word: {
        id: word.id,
        lemma: word.lemma,
        meaningRu: word.meaningRu,
        pos: word.pos
      },
    selectedGrammarIds,
    resolvedOrder: chainResult.order,
    prompt: "Соедините выбранные грамматики с данным словом.",
    correctAnswer: toPoliteAnswer(
      chainResult.form,
      chainResult.resultType,
      chainResult.order[chainResult.order.length - 1]
    ),
    explanation
  };
  }

  return {
    ok: false,
    errorType: "not_connectable",
    message: buildNotConnectableExplanation(selectedGrammarIds)
  };

  return {
    ok: false,
    errorType: "not_connectable",
    message: "Эти грамматики не соединяются."
  };
}

function generateExerciseBatch(selectedGrammarIds, options = {}) {
  const {
    count = 5,
    allowedWordIds = null
  } = options;

  const candidateWords = shuffleArray(
    Array.isArray(allowedWordIds) && allowedWordIds.length > 0
      ? wordList.filter((word) => allowedWordIds.includes(word.id))
      : wordList
  );

  const exercises = [];

  for (const word of candidateWords) {
    const exercise = generateExercise(selectedGrammarIds, word.id);
    if (!exercise.ok) continue;

    exercises.push(exercise);
    if (exercises.length >= count) break;
  }

  if (exercises.length === 0) {
    return {
      ok: false,
      errorType: "not_connectable",
      message: buildNotConnectableExplanation(selectedGrammarIds)
    };

    return {
      ok: false,
      errorType: "not_connectable",
      message: "Эти грамматики не соединяются."
    };
  }

  return {
    ok: true,
    exercises,
    totalExercises: exercises.length,
    selectedGrammarIds: exercises[0].selectedGrammarIds,
    resolvedOrder: exercises[0].resolvedOrder
  };
}

function generateFreePractice(options = {}) {
  const {
    difficulty = "easy",
    preferredWordId,
    allowedGrammarIds = grammarList.map((grammar) => grammar.id),
    maxAttempts = 200
  } = options;

  const selectedWord = preferredWordId ? getWordById(preferredWordId) : null;
  const candidateWords = selectedWord ? [selectedWord] : shuffleArray(wordList);
  const candidateGrammarIds = allowedGrammarIds.filter((grammarId) =>
    grammarList.some((grammar) => grammar.id === grammarId)
  );
  const grammarCounts = getGrammarCountsByDifficulty(difficulty);

  for (const grammarCount of grammarCounts) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const grammarIds = sampleCount(candidateGrammarIds, grammarCount);
      if (grammarIds.length !== grammarCount) {
        continue;
      }

      const candidateSet = selectedWord ? candidateWords : shuffleArray(candidateWords);

      for (const word of candidateSet) {
        const exercise = generateExercise(grammarIds, word.id);
        if (!exercise.ok) continue;

        return {
          ...exercise,
          mode: "free_practice",
          difficulty
        };
      }
    }
  }

  return {
    ok: false,
    mode: "free_practice",
    errorType: "not_connectable",
    difficulty,
    message: "Не удалось подобрать упражнение для свободной тренировки."
  };
}

function checkExerciseAnswer(exercise, studentAnswer) {
  const normalizedStudentAnswer = normalizeAnswer(studentAnswer);
  const normalizedCorrectAnswer = normalizeAnswer(exercise.correctAnswer);

  if (normalizedStudentAnswer === normalizedCorrectAnswer) {
    return {
      ok: true,
      errorType: null,
      message: "Правильно.",
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation
    };
  }

  const studentOrderResult = findValidGrammarOrder(exercise.selectedGrammarIds, exercise.word.pos);
  if (!studentOrderResult.ok) {
    return {
      ok: false,
      errorType: "not_connectable",
      message: "Эти грамматики не соединяются.",
      explanation: exercise.explanation?.why ?? "Выбранные грамматики не образуют допустимую цепочку."
    };
  }

  const expectedOrder = exercise.resolvedOrder;
  const selectedOrderMatchesResolved =
    JSON.stringify(expectedOrder) === JSON.stringify(exercise.selectedGrammarIds);

  if (!selectedOrderMatchesResolved && normalizedStudentAnswer.length === 0) {
    return {
      ok: false,
      errorType: "wrong_order",
      message: "Грамматики соединяются, но порядок должен быть другим.",
      resolvedOrder: expectedOrder,
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation
    };
  }

  if (!selectedOrderMatchesResolved && normalizedStudentAnswer === normalizeAnswer(exercise.word.lemma)) {
    return {
      ok: false,
      errorType: "wrong_order",
      message: "Грамматики соединяются, но порядок должен быть другим.",
      resolvedOrder: expectedOrder,
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation
    };
  }

  return {
    ok: false,
    errorType: "wrong_form",
    message: "Порядок подходит, но форма построена с ошибкой.",
    resolvedOrder: expectedOrder,
    correctAnswer: exercise.correctAnswer,
    explanation: exercise.explanation
  };
}

function generateStudentOptions() {
  return {
    selfPractice: {
      id: "self_practice",
      title: "РЈС‡РµРЅРёРє РІС‹Р±РёСЂР°РµС‚ РіСЂР°РјРјР°С‚РёРєРё СЃР°Рј",
      description: "РњРѕР¶РЅРѕ РІС‹Р±СЂР°С‚СЊ Р»СЋР±РѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ РіСЂР°РјРјР°С‚РёРє.",
      selectionMode: "multiple",
      minSelection: 1,
      maxSelection: null,
      grammars: grammarList.map((grammar) => ({
        id: grammar.id,
        label: grammar.label,
        pattern: grammar.pattern,
        meaning: grammar.meaning
      }))
    },
    freePractice: {
      id: "free_practice",
      title: "РЎРІРѕР±РѕРґРЅР°СЏ С‚СЂРµРЅРёСЂРѕРІРєР°",
      description: "РџСЂРёР»РѕР¶РµРЅРёРµ СЃР°РјРѕ РїРѕРґР±РёСЂР°РµС‚ РµСЃС‚РµСЃС‚РІРµРЅРЅС‹Рµ С†РµРїРѕС‡РєРё.",
      difficultyOptions: [
        { id: "easy", label: "РџРѕР»РµРіС‡Рµ", description: "РћР±С‹С‡РЅРѕ 2 РіСЂР°РјРјР°С‚РёРєРё." },
        { id: "hard", label: "РџРѕСЃР»РѕР¶РЅРµРµ", description: "РћР±С‹С‡РЅРѕ 4 РіСЂР°РјРјР°С‚РёРєРё, РёРЅРѕРіРґР° 3." }
      ]
    }
  };
}

function getEncouragementMessage(errorType = "wrong_form") {
  const messageMap = {
    not_connectable: [
      "Р­С‚Рѕ РЅРѕСЂРјР°Р»СЊРЅРѕ: РЅРµ РІСЃРµ РіСЂР°РјРјР°С‚РёРєРё РјРѕР¶РЅРѕ СЃРѕРµРґРёРЅСЏС‚СЊ. Р”Р°РІР°Р№ РїРѕСЃРјРѕС‚СЂРёРј, РєР°РєРёРµ РІР°СЂРёР°РЅС‚С‹ РїРѕРґРѕР№РґСѓС‚.",
      "РќРёС‡РµРіРѕ СЃС‚СЂР°С€РЅРѕРіРѕ. Р—РґРµСЃСЊ РїСЂРѕСЃС‚Рѕ РЅРµРґРѕРїСѓСЃС‚РёРјРѕРµ СЃРѕС‡РµС‚Р°РЅРёРµ РіСЂР°РјРјР°С‚РёРє."
    ],
    wrong_order: [
      "РўС‹ РЅР° РїСЂР°РІРёР»СЊРЅРѕРј РїСѓС‚Рё. Р—РґРµСЃСЊ РЅСѓР¶РЅРѕ С‚РѕР»СЊРєРѕ РїРµСЂРµСЃС‚Р°РІРёС‚СЊ РїРѕСЂСЏРґРѕРє.",
      "РҐРѕСЂРѕС€Р°СЏ РїРѕРїС‹С‚РєР°. Р“СЂР°РјРјР°С‚РёРєРё СЃРѕРІРјРµСЃС‚РёРјС‹, РЅРѕ РёС… РЅСѓР¶РЅРѕ СЃРѕРµРґРёРЅРёС‚СЊ РІ РґСЂСѓРіРѕРј РїРѕСЂСЏРґРєРµ."
    ],
    wrong_form: [
      "РџРѕС‡С‚Рё РїРѕР»СѓС‡РёР»РѕСЃСЊ. РџРѕСЂСЏРґРѕРє С‚С‹ СѓР¶Рµ РїРѕР№РјР°Р»(Р°), РѕСЃС‚Р°Р»РѕСЃСЊ РґРѕС‚РѕС‡РёС‚СЊ С„РѕСЂРјСѓ.",
      "Р­С‚Рѕ С…РѕСЂРѕС€Р°СЏ РїРѕРїС‹С‚РєР°. РЎРІСЏР·СЊ РјРµР¶РґСѓ РіСЂР°РјРјР°С‚РёРєР°РјРё С‚С‹ СѓРІРёРґРµР»(Р°), С‚РµРїРµСЂСЊ РїРѕРїСЂРѕР±СѓР№ РёСЃРїСЂР°РІРёС‚СЊ РѕРєРѕРЅС‡Р°РЅРёРµ."
    ]
  };

  const messages = messageMap[errorType] ?? messageMap.wrong_form;
  return messages[Math.floor(Math.random() * messages.length)];
}

function pickRandomExample(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function getChainExample(grammarIds = []) {
  const key = grammarIds.join("__");
  return pickRandomExample(exampleBank.chain[key]);
}

function getPrimaryMeaningRu(word) {
  const rawMeaning = String(word?.meaningRu ?? "").trim();
  if (!rawMeaning) {
    return "это";
  }

  return rawMeaning
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)[0] || rawMeaning;
}

function getFallbackUsageContext(word) {
  const usageMap = {
    meokda: {
      objectKo: "매운 음식을",
      actionRu: "есть острую еду"
    },
    masida: {
      objectKo: "커피를",
      actionRu: "пить кофе"
    },
    hada: {
      objectKo: "숙제를",
      actionRu: "делать домашнее задание"
    },
    gongbuhada: {
      objectKo: "한국어를",
      actionRu: "учить корейский"
    },
    ilhada: {
      objectKo: "회사에서",
      actionRu: "работать в офисе"
    },
    mannada: {
      objectKo: "친구를",
      actionRu: "встречаться с другом"
    },
    boda: {
      objectKo: "그 영화를",
      actionRu: "смотреть этот фильм"
    },
    deutda: {
      objectKo: "좋아하는 음악을",
      actionRu: "слушать любимую музыку"
    },
    ikda: {
      objectKo: "한국어 책을",
      actionRu: "читать книгу на корейском"
    },
    sseuda: {
      objectKo: "일기를",
      actionRu: "писать дневник"
    },
    sada: {
      objectKo: "새 옷을",
      actionRu: "покупать новую одежду"
    },
    joahada: {
      objectKo: "그 가수를",
      actionRu: "любить того певца"
    },
    silheohada: {
      objectKo: "매운 음식을",
      actionRu: "не любить острую еду"
    },
    undonghada: {
      objectKo: "헬스장에서",
      actionRu: "заниматься спортом в зале"
    },
    tada: {
      objectKo: "버스를",
      actionRu: "садиться на автобус"
    },
    yeolda: {
      objectKo: "창문을",
      actionRu: "открывать окно"
    },
    datda: {
      objectKo: "문을",
      actionRu: "закрывать дверь"
    },
    gidarida: {
      objectKo: "친구를",
      actionRu: "ждать друга"
    },
    mandeulda: {
      objectKo: "발표 자료를",
      actionRu: "готовить материалы для презентации"
    }
  };

  Object.assign(usageMap, {
    gada: { objectKo: "집에", actionRu: "пойти домой" },
    oda: { objectKo: "일찍", actionRu: "прийти пораньше" },
    jada: { objectKo: "좀 더", actionRu: "поспать подольше" },
    ireonada: { objectKo: "일찍", actionRu: "встать пораньше" },
    swida: { objectKo: "잠깐", actionRu: "немного отдохнуть" },
    nolda: { objectKo: "친구하고", actionRu: "провести время с друзьями" }
  });

  return usageMap[word?.id] || {
    objectKo: "",
    actionRu: getPrimaryMeaningRu(word)
  };
}

function buildFallbackExampleForExercise(exercise) {
  if (!exercise?.ok || !Array.isArray(exercise.resolvedOrder) || exercise.resolvedOrder.length === 0) {
    return null;
  }

  const answer = exercise.correctAnswer;
  const lastGrammarId = exercise.resolvedOrder[exercise.resolvedOrder.length - 1];
  const chainKey = exercise.resolvedOrder.join("__");
  const usage = getFallbackUsageContext(exercise.word);
  const objectKo = usage.objectKo ? `${usage.objectKo} ` : "";
  const actionMeaningRu = usage.actionRu;

  const curatedThreeGrammarFallbacks = {
    go_sipda__geot_gatda_adj__past_tense: {
      sentence: `어제는 ${objectKo}${answer}.`,
      meaningRu: `Вчера мне казалось, что мне хочется ${actionMeaningRu}.`
    },
    go_sipda__ji_anta__past_tense: {
      sentence: `어제는 ${objectKo}${answer}.`,
      meaningRu: `Вчера мне не хотелось ${actionMeaningRu}.`
    },
    neuryeogo_hada__ji_anta__past_tense: {
      sentence: `어제는 ${objectKo}${answer}.`,
      meaningRu: `Вчера я не собирался(не собиралась) ${actionMeaningRu}.`
    },
    neuryeogo_hada__geot_gatda_verb_present__past_tense: {
      sentence: `아까는 ${objectKo}${answer}.`,
      meaningRu: `Недавно мне казалось, что я собираюсь ${actionMeaningRu}.`
    },
    ji_anta__geot_gatda_verb_present__past_tense: {
      sentence: `아까는 ${objectKo}${answer}.`,
      meaningRu: `Недавно мне казалось, что я не ${actionMeaningRu}.`
    },
    ajida_eojida__geot_gatda_verb_present__past_tense: {
      sentence: `아까는 ${objectKo}${answer}.`,
      meaningRu: "Недавно мне казалось, что состояние постепенно меняется."
    }
  };

  if (curatedThreeGrammarFallbacks[chainKey]) {
    return {
      ...curatedThreeGrammarFallbacks[chainKey],
      sourceType: "generated"
    };
  }

  const improvedFallbackMap = {
    past_tense: {
      sentence: `어제는 ${objectKo}${answer}.`,
      meaningRu: `Вчера речь шла о том, что нужно было ${actionMeaningRu}.`
    },
    go_sipda: {
      sentence: `저는 오늘 ${objectKo}${answer}.`,
      meaningRu: `Сегодня мне хочется ${actionMeaningRu}.`
    },
    neuryeogo_hada: {
      sentence: `저는 오늘 ${objectKo}${answer}.`,
      meaningRu: `Сегодня я собираюсь ${actionMeaningRu}.`
    },
    aseo_eoseo: {
      sentence: `오늘은 ${objectKo}${answer} 집에 있을 거예요.`,
      meaningRu: "Сегодня так получилось, поэтому я, наверное, останусь дома."
    },
    jiman: {
      sentence: `오늘은 ${objectKo}${answer} 괜찮아요.`,
      meaningRu: "Сегодня это так, но в целом все в порядке."
    },
    eul_ttae: {
      sentence: `${objectKo}${answer} 잠깐 쉬어요.`,
      meaningRu: "Когда так бывает, я немного отдыхаю."
    },
    ji_anta: {
      sentence: `저는 오늘 ${objectKo}${answer}.`,
      meaningRu: `Сегодня мне не хочется ${actionMeaningRu}.`
    },
    geot_gatda_adj: {
      sentence: `지금은 ${objectKo}${answer}.`,
      meaningRu: "Сейчас мне так кажется."
    },
    geot_gatda_verb_present: {
      sentence: `지금은 ${objectKo}${answer}.`,
      meaningRu: "Сейчас мне кажется, что это происходит."
    },
    ajida_eojida: {
      sentence: `요즘은 ${objectKo}${answer}.`,
      meaningRu: "В последнее время состояние постепенно меняется."
    },
    myeon_eumyeon: {
      sentence: `내일 ${objectKo}${answer} 좋겠어요.`,
      meaningRu: "Если так будет, это будет хорошо."
    }
  };

  const improvedFallback = improvedFallbackMap[lastGrammarId];
  if (improvedFallback) {
    return {
      ...improvedFallback,
      sourceType: "generated"
    };
  }

  const chainTranslationMap = {
    go_sipda__ji_anta__past_tense: `Вчера мне не хотелось ${actionMeaningRu}.`,
    go_sipda__past_tense: `Вчера мне хотелось ${actionMeaningRu}.`,
    ji_anta__past_tense: `Вчера я этого не делал(а).`,
    neuryeogo_hada__ji_anta: `Сегодня я не собираюсь ${actionMeaningRu}.`,
    go_sipda__ji_anta: `Сегодня мне не хочется ${actionMeaningRu}.`
  };

  if (chainTranslationMap[chainKey]) {
    return {
      sentence: `어제 ${objectKo}${answer}.`,
      meaningRu: chainTranslationMap[chainKey],
      sourceType: "generated"
    };
  }

  const fallbackMap = {
    past_tense: {
      sentence: `어제 ${objectKo}${answer}.`,
      meaningRu: `Вчера это произошло: ${actionMeaningRu}.`
    },
    go_sipda: {
      sentence: `저는 오늘 ${objectKo}${answer}.`,
      meaningRu: `Сегодня я хочу ${actionMeaningRu}.`
    },
    neuryeogo_hada: {
      sentence: `저는 주말에 ${objectKo}${answer}.`,
      meaningRu: `На выходных я собираюсь ${actionMeaningRu}.`
    },
    aseo_eoseo: {
      sentence: `오늘은 ${objectKo}${answer} 집에 있어요.`,
      meaningRu: `Сегодня так получилось, поэтому я дома.`
    },
    jiman: {
      sentence: `오늘은 ${objectKo}${answer} 괜찮아요.`,
      meaningRu: `Сегодня это так, но в целом все в порядке.`
    },
    eul_ttae: {
      sentence: `${objectKo}${answer} 음악을 들어요.`,
      meaningRu: `Когда это происходит, я слушаю музыку.`
    },
    ji_anta: {
      sentence: `저는 오늘 ${objectKo}${answer}.`,
      meaningRu: `Сегодня я не хочу ${actionMeaningRu}.`
    },
    geot_gatda_adj: {
      sentence: `민수는 ${objectKo}${answer}.`,
      meaningRu: "Кажется, это так."
    },
    geot_gatda_verb_present: {
      sentence: `민수는 ${objectKo}${answer}.`,
      meaningRu: "Кажется, это сейчас происходит."
    },
    ajida_eojida: {
      sentence: `요즘은 ${objectKo}${answer}.`,
      meaningRu: "В последнее время так меняется состояние."
    },
    myeon_eumyeon: {
      sentence: `내일 ${objectKo}${answer} 좋아요.`,
      meaningRu: "Если так будет, это хорошо."
    }
  };

  const fallback = fallbackMap[lastGrammarId];
  if (!fallback) {
    return {
      sentence: answer,
      meaningRu: "Пример с этой формой.",
      sourceType: "generated"
    };
  }

  return {
    ...fallback,
    sourceType: "generated"
  };
}

const originalBuildFallbackExampleForExercise = buildFallbackExampleForExercise;

function getBetterFallbackMeaningRu(exercise) {
  const chainKey = Array.isArray(exercise?.resolvedOrder) ? exercise.resolvedOrder.join("__") : "";
  const lastGrammarId = exercise?.resolvedOrder?.[exercise.resolvedOrder.length - 1];
  const actionMeaningRu = getFallbackUsageContext(exercise?.word).actionRu;

  const chainMeaningMap = {
    go_sipda__past_tense: `Вчера мне хотелось ${actionMeaningRu}.`,
    go_sipda__ji_anta__past_tense: `Вчера мне не хотелось ${actionMeaningRu}.`,
    go_sipda__ji_anta: `Сегодня мне не хочется ${actionMeaningRu}.`,
    ji_anta__past_tense: `Вчера я не ${actionMeaningRu}.`,
    neuryeogo_hada__past_tense: `Вчера я собирался(собиралась) ${actionMeaningRu}.`,
    neuryeogo_hada__aseo_eoseo: `Сегодня я буду дома, потому что собираюсь ${actionMeaningRu}.`,
    neuryeogo_hada__ji_anta: `Сегодня я не собираюсь ${actionMeaningRu}.`,
    past_tense__jiman: "Сегодня это было так, но сейчас все в порядке.",
    past_tense__eul_ttae: "Когда это произошло, я немного отдыхаю.",
    ji_anta__geot_gatda_verb_present: "Кажется, сейчас этого не происходит.",
    ajida_eojida__geot_gatda_verb_present: "Кажется, сейчас что-то постепенно меняется."
  };

  if (chainMeaningMap[chainKey]) {
    return chainMeaningMap[chainKey];
  }

  const genericMeaningMap = {
    past_tense: `Вчера это было связано с тем, что нужно было ${actionMeaningRu}.`,
    go_sipda: `Сегодня мне хочется ${actionMeaningRu}.`,
    neuryeogo_hada: `Сегодня я собираюсь ${actionMeaningRu}.`,
    aseo_eoseo: `Сегодня я буду дома, потому что ${actionMeaningRu}.`,
    jiman: "Сегодня это так, но в целом все в порядке.",
    eul_ttae: "Когда это происходит, я немного отдыхаю.",
    ji_anta: `Сегодня мне не хочется ${actionMeaningRu}.`,
    geot_gatda_adj: "Сейчас мне кажется, что это именно так.",
    geot_gatda_verb_present: "Сейчас мне кажется, что это происходит.",
    ajida_eojida: "В последнее время состояние постепенно меняется.",
    myeon_eumyeon: "Если так будет, это будет хорошо."
  };

  return genericMeaningMap[lastGrammarId] || null;
}

buildFallbackExampleForExercise = function buildFallbackExampleForExerciseWithBetterRu(exercise) {
  const fallback = originalBuildFallbackExampleForExercise(exercise);
  if (!fallback) {
    return fallback;
  }

  const betterMeaningRu = getBetterFallbackMeaningRu(exercise);
  if (!betterMeaningRu) {
    return fallback;
  }

  return {
    ...fallback,
    meaningRu: betterMeaningRu
  };
};

const originalGetBetterFallbackMeaningRu = getBetterFallbackMeaningRu;

getBetterFallbackMeaningRu = function getBetterFallbackMeaningRuWithExtraChains(exercise) {
  const chainKey = Array.isArray(exercise?.resolvedOrder) ? exercise.resolvedOrder.join("__") : "";
  const actionMeaningRu = getFallbackUsageContext(exercise?.word).actionRu;

  if (chainKey === "go_sipda__jiman") {
    return `Сегодня мне хочется ${actionMeaningRu}, но ничего страшного.`;
  }

  return originalGetBetterFallbackMeaningRu(exercise);
};

function getExampleForExercise(exercise) {
  if (!exercise?.ok) {
    return null;
  }

  if (!Array.isArray(exercise.resolvedOrder) || exercise.resolvedOrder.length < 2) {
    return null;
  }

  const fallbackExample = buildFallbackExampleForExercise(exercise);
  if (fallbackExample) {
    return {
      ...fallbackExample,
      matchType: "generated_chain",
      grammarIds: exercise.resolvedOrder
    };
  }

  const chainExample = getChainExample(exercise.resolvedOrder);
  if (!chainExample) {
    return null;
  }

  return {
    ...chainExample,
    matchType: "chain",
    grammarIds: exercise.resolvedOrder
  };
}

async function getBestExampleForExercise(exercise, options = {}) {
  const apiKey = options.apiKey ?? getKrdictApiKey();
  const preferOfficial = options.preferOfficial !== false;

  if (preferOfficial && apiKey) {
    try {
      const officialExample = await getOfficialExampleForExercise(exercise, {
        ...options,
        apiKey
      });

      if (officialExample) {
        return officialExample;
      }
    } catch (error) {
      const localExample = getExampleForExercise(exercise);

      if (localExample) {
        return {
          ...localExample,
          fallbackReason: error.message,
          sourceType: "local_fallback"
        };
      }

      return null;
    }
  }

  return getExampleForExercise(exercise);
}

function mockAppScreen(screenId, payload = {}) {
  const options = generateStudentOptions();

  if (screenId === "home") {
    return [
      "=== Korean Grammar Trainer ===",
      "",
      "1. РЎРІРѕСЏ С‚СЂРµРЅРёСЂРѕРІРєР°",
      `   ${options.selfPractice.description}`,
      "",
      "2. РЎРІРѕР±РѕРґРЅР°СЏ С‚СЂРµРЅРёСЂРѕРІРєР°",
      `   ${options.freePractice.description}`
    ].join("\n");
  }

  if (screenId === "grammar_selection") {
    const grammarLines = options.selfPractice.grammars.map(
      (grammar, index) => `${index + 1}. ${grammar.label} - ${grammar.meaning}`
    );

    return [
      "=== Р’С‹Р±РѕСЂ РіСЂР°РјРјР°С‚РёРє ===",
      "Р’С‹Р±РµСЂРё СЃРєРѕР»СЊРєРѕ С…РѕС‡РµС€СЊ РіСЂР°РјРјР°С‚РёРє РґР»СЏ С‚СЂРµРЅРёСЂРѕРІРєРё.",
      "",
      ...grammarLines
    ].join("\n");
  }

  if (screenId === "difficulty_selection") {
    const difficultyLines = options.freePractice.difficultyOptions.map(
      (item, index) => `${index + 1}. ${item.label} - ${item.description}`
    );

    return [
      "=== РЎРІРѕР±РѕРґРЅР°СЏ С‚СЂРµРЅРёСЂРѕРІРєР° ===",
      "Р’С‹Р±РµСЂРё СЃР»РѕР¶РЅРѕСЃС‚СЊ:",
      "",
      ...difficultyLines
    ].join("\n");
  }

  if (screenId === "exercise") {
    const { exercise } = payload;
    if (!exercise?.ok) {
      return ["=== РЈРїСЂР°Р¶РЅРµРЅРёРµ ===", "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ СѓРїСЂР°Р¶РЅРµРЅРёРµ."].join("\n");
    }

    return [
      "=== РЈРїСЂР°Р¶РЅРµРЅРёРµ ===",
      `РЎР»РѕРІРѕ: ${exercise.word.lemma} (${exercise.word.meaningRu})`,
      `Р“СЂР°РјРјР°С‚РёРєРё: ${exercise.selectedGrammarIds.join(", ")}`,
      "",
      "РџРѕР»Рµ РѕС‚РІРµС‚Р°: [________________]",
      "РљРЅРѕРїРєРё: [РџСЂРѕРІРµСЂРёС‚СЊ] [РџРѕРєР°Р·Р°С‚СЊ РѕС‚РІРµС‚]"
    ].join("\n");
  }

  if (screenId === "result") {
    const { exercise, checkResult } = payload;
    const encouragement = checkResult?.ok ? null : getEncouragementMessage(checkResult?.errorType);
    const example = exercise ? getExampleForExercise(exercise) : null;

    return [
      "=== Р РµР·СѓР»СЊС‚Р°С‚ ===",
      `РЎС‚Р°С‚СѓСЃ: ${checkResult?.ok ? "РџСЂР°РІРёР»СЊРЅРѕ" : "Р•С‰Рµ РЅРµС‚"}`,
      !checkResult?.ok && encouragement ? `РџРѕРґР±Р°РґСЂРёРІР°РЅРёРµ: ${encouragement}` : null,
      `РџСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚: ${exercise?.correctAnswer ?? "-"}`,
      exercise?.explanation?.flow ? `РЎС…РµРјР°: ${exercise.explanation.flow}` : null,
      exercise?.explanation?.why ? `РџРѕС‡РµРјСѓ: ${exercise.explanation.why}` : null,
      example?.sentence ? `РџСЂРёРјРµСЂ: ${example.sentence}` : null,
      example?.meaningRu ? `РџРµСЂРµРІРѕРґ: ${example.meaningRu}` : null,
      example?.sourceLabel ? `РСЃС‚РѕС‡РЅРёРє: ${example.sourceLabel}` : null
    ].filter(Boolean).join("\n");
  }

  return "Unknown screen";
}

function generateStudentOptions() {
  return {
    selfPractice: {
      id: "self_practice",
      title: "Выберите грамматики для тренировки",
      description: "Можно выбрать любое количество грамматик.",
      selectionMode: "multiple",
      minSelection: 1,
      maxSelection: null,
      grammars: grammarList.map((grammar) => ({
        id: grammar.id,
        label: grammar.label,
        pattern: grammar.pattern,
        meaning: grammar.meaning
      }))
    },
    freePractice: {
      id: "free_practice",
      title: "Свободная тренировка",
      description: "Выберите уровень сложности, а дальше приложение само предложит подходящую цепочку.",
      difficultyOptions: [
        { id: "easy", label: "Полегче", description: "Обычно 2 грамматики." },
        { id: "medium", label: "Средне", description: "Обычно 3 грамматики." },
        { id: "hard", label: "Посложнее", description: "Обычно 3 грамматики." }
      ]
    }
  };
}

function generateStudentOptions() {
  return {
    selfPractice: {
      id: "self_practice",
      title: "Выберите грамматики для тренировки",
      description: "Можно выбрать любое количество грамматик.",
      selectionMode: "multiple",
      minSelection: 1,
      maxSelection: null,
      grammars: grammarList.map((grammar) => ({
        id: grammar.id,
        label: grammar.label,
        pattern: grammar.pattern,
        meaning: grammar.meaning
      }))
    },
    freePractice: {
      id: "free_practice",
      title: "Свободная тренировка",
      description: "Выберите уровень сложности, а дальше приложение само предложит подходящую цепочку.",
      difficultyOptions: [
        { id: "easy", label: "Полегче", description: "Обычно 2 грамматики." },
        { id: "hard", label: "Посложнее", description: "Обычно 3 грамматики." }
      ]
    }
  };
}

module.exports = {
  grammarList,
  wordList,
  conjugationMap,
  grammaticalCompatibilityMap,
  compatibilityConditions,
  naturalChainWhitelist,
  naturalTripleChainWhitelist,
  naturalQuadChainWhitelist,
  getWordById,
  getGrammarById,
  canConnect,
  findValidGrammarOrder,
  conjugate,
  conjugateChain,
  getGrammarCountsByDifficulty,
  isNaturalResolvedOrder,
  generateStudentOptions,
  getEncouragementMessage,
  getChainExample,
  getExampleForExercise,
  getBestExampleForExercise,
  mockAppScreen,
  generateExercise,
  generateExerciseBatch,
  checkExerciseAnswer,
  generateFreePractice
};
