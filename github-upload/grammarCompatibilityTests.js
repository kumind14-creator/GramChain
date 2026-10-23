const assert = require("assert/strict");
const engine = require("./grammarEngine");

// Linguistic regression fixtures: expected answers are written independently.
const fixtures = [
  ["gada", ["neuryeogo_hada", "past_tense"], "가려고 했어요"],
  ["gada", ["ji_anta", "neuryeogo_hada"], "가지 않으려고 해요"],
  ["yeppeuda", ["geot_gatda_adj", "past_tense"], "예쁜 것 같았어요"],
  ["gada", ["geot_gatda_verb_present", "past_tense"], "가는 것 같았어요"],
  ["yeppeuda", ["ajida_eojida", "past_tense"], "예뻐졌어요"],
  ["yeppeuda", ["ajida_eojida", "go_sipda"], "예뻐지고 싶어요"],
  ["chupda", ["ajida_eojida", "neuryeogo_hada"], "추워지려고 해요"],
  ["datda", ["go_sipda", "past_tense"], "닫고 싶었어요"],
  ["datda", ["neuryeogo_hada", "past_tense"], "닫으려고 했어요"],
  ["gada", ["go_sipda", "ajida_eojida", "myeon_eumyeon"], "가고 싶어지면"],
  ["gada", ["go_sipda", "ajida_eojida", "past_tense", "jiman"], "가고 싶어졌지만"],
  ["gada", ["ji_anta", "neuryeogo_hada", "past_tense"], "가지 않으려고 했어요"],
  ["gada", ["neuryeogo_hada", "ji_anta", "past_tense"], "가려고 하지 않았어요"],
  ["hada", ["go_sipda", "ajida_eojida"], "하고 싶어져요"],
  ["hada", ["go_sipda", "ajida_eojida", "past_tense"], "하고 싶어졌어요"],
  ["yeppeuda", ["ajida_eojida", "go_sipda", "past_tense"], "예뻐지고 싶었어요"],
  ["deutda", ["neuryeogo_hada", "past_tense"], "들으려고 했어요"],
  ["salda", ["neuryeogo_hada", "past_tense"], "살려고 했어요"],
  ["yeppeuda", ["ajida_eojida", "past_tense", "eul_ttae"], "예뻐졌을 때"],
  ["yeppeuda", ["ajida_eojida", "geot_gatda_adj"], "예뻐진 것 같아요"],
  ["chupda", ["ajida_eojida", "geot_gatda_adj", "ji_anta"], "추워진 것 같지 않아요"],
  ["meokda", ["go_sipda", "ji_anta", "geot_gatda_adj"], "먹고 싶지 않은 것 같아요"],
  ["meokda", ["neuryeogo_hada", "ji_anta", "geot_gatda_verb_present"], "먹으려고 하지 않는 것 같아요"],
  ["meokda", ["ji_anta", "neuryeogo_hada", "geot_gatda_verb_present"], "먹지 않으려고 하는 것 같아요"],
  ["tteutteuthada", ["ajida_eojida", "ji_anta", "geot_gatda_verb_present"], "따뜻해지지 않는 것 같아요"]
];
for (const [wordId, ids, expected] of fixtures) {
  const exercise = engine.generateExercise(ids, wordId);
  assert.equal(exercise.ok, true, `${wordId}: ${ids}`);
  assert.equal(exercise.correctAnswer, expected);
  assert.equal(engine.checkExerciseAnswer(exercise, expected).ok, true);
  assert.equal(engine.generateExercise([...ids].reverse(), wordId).ok, true);
}

const lists = [engine.naturalChainWhitelist, engine.naturalTripleChainWhitelist, engine.naturalQuadChainWhitelist];
for (let index = 0; index < lists.length; index += 1) {
  const keys = new Set();
  for (const order of lists[index]) {
    assert.equal(order.length, index + 2);
    assert.equal(new Set(order).size, order.length);
    assert.ok(!keys.has(JSON.stringify(order)), "Duplicate reviewed chain");
    keys.add(JSON.stringify(order));
  }
}
for (const first of engine.grammarList) for (const second of engine.grammarList) {
  if (first.id === second.id) continue;
  for (const pos of ["verb", "adjective"]) {
    if (engine.canConnect(first.id, second.id, pos).ok) {
      assert.ok(engine.isNaturalResolvedOrder([first.id, second.id]), `${first.id} -> ${second.id}`);
    }
  }
}

const ids = engine.grammarList.map((item) => item.id);
const selections = [];
function collect(start, selected) {
  if (selected.length >= 2) selections.push(selected);
  if (selected.length === 4) return;
  for (let i = start; i < ids.length; i += 1) collect(i + 1, [...selected, ids[i]]);
}
collect(0, []);
let checked = 0;
for (const selected of selections) for (const word of engine.wordList) {
  checked += 1;
  const raw = engine.conjugateChain(word, selected);
  const excluded = (word.blockedGrammarIds || []).some((id) => selected.includes(id)) ||
    (word.excludedExerciseChains || []).some((chain) => chain.length === selected.length && chain.every((id) => selected.includes(id))) ||
    (raw.ok && raw.allOrders.filter((order) => engine.isNaturalResolvedOrder(order))
      .every((order) => engine.isChainExcludedForWord(word, order)));
  const approved = raw.ok && raw.allOrders.some((order) => engine.isNaturalResolvedOrder(order));
  const exercise = engine.generateExercise(selected, word.id);
  assert.equal(exercise.ok, Boolean(approved && !excluded), `${word.id}: ${selected}`);
  assert.equal(engine.generateExercise([...selected].reverse(), word.id).ok, exercise.ok);
  if (exercise.ok) assert.equal(engine.checkExerciseAnswer(exercise, exercise.correctAnswer).ok, true);
}

// Type-incompatible forms and the user's editorial exclusion stay blocked.
assert.equal(engine.generateExercise(["go_sipda", "geot_gatda_verb_present"], "meokda").ok, false);
assert.equal(engine.generateExercise(["past_tense", "aseo_eoseo"], "gada").ok, false);
assert.equal(engine.generateExercise(["ajida_eojida"], "meokda").ok, false);
assert.equal(engine.generateExercise(["neuryeogo_hada", "ji_anta", "myeon_eumyeon"], "tada").ok, false);
console.log(`Compatibility passed: ${fixtures.length} independent form fixtures; ${checked} word-and-selection cases, reverse selection, whitelist consistency and exclusions. No API requests.`);
