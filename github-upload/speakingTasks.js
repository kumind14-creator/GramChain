const SPEAKING_TASK_SETS = {
  pre: [
    { id: "task01", formCount: 2, promptRu: "Я хочу увидеть море, поэтому собираюсь поехать в Пусан.", promptEn: "I want to see the sea, so I am going to Busan.", expectedChain: "보고 싶어서", expectedAnswer: "바다를 보고 싶어서 부산에 가려고 해요." },
    { id: "task02", formCount: 2, promptRu: "Если погода станет теплее, я начну заниматься спортом.", promptEn: "If the weather gets warmer, I will start exercising.", expectedChain: "따뜻해지면", expectedAnswer: "날씨가 따뜻해지면 운동을 시작할 거예요." },
    { id: "task03", formCount: 2, promptRu: "Кажется, что идет дождь, поэтому я взял с собой зонт.", promptEn: "It seems to be raining, so I took an umbrella with me.", expectedChain: "비가 오는 것 같아서", expectedAnswer: "비가 오는 것 같아서 우산을 가져왔어요." },
    { id: "task04", formCount: 2, promptRu: "Когда я хочу отдохнуть, я слушаю музыку.", promptEn: "When I want to rest, I listen to music.", expectedChain: "쉬고 싶을 때", expectedAnswer: "쉬고 싶을 때 음악을 들어요." },
    { id: "task05", formCount: 2, promptRu: "Эта еда кажется острой, поэтому я выбрал другое блюдо.", promptEn: "This food seems spicy, so I chose a different dish.", expectedChain: "매운 것 같아서", expectedAnswer: "이 음식이 매운 것 같아서 다른 음식을 골랐어요." },
    { id: "task06", formCount: 3, promptRu: "Я не хочу идти один, поэтому пригласил друга.", promptEn: "I did not want to go alone, so I invited a friend.", expectedChain: "가고 싶지 않아서", expectedAnswer: "혼자 가고 싶지 않아서 친구를 초대했어요." },
    { id: "task07", formCount: 3, promptRu: "Я собирался заниматься спортом, но пошел дождь.", promptEn: "I was going to exercise, but it started to rain.", expectedChain: "운동하려고 했지만", expectedAnswer: "운동을 하려고 했지만 비가 왔어요." },
    { id: "task08", formCount: 3, promptRu: "Если ты не хочешь идти сейчас, можешь остаться дома.", promptEn: "If you do not want to go now, you can stay at home.", expectedChain: "가고 싶지 않으면", expectedAnswer: "지금 가고 싶지 않으면 집에 있어도 돼요." },
    { id: "task09", formCount: 3, promptRu: "Я хотел пойти в парк, но у меня не было времени.", promptEn: "I wanted to go to the park, but I did not have time.", expectedChain: "가고 싶었지만", expectedAnswer: "공원에 가고 싶었지만 시간이 없었어요." },
    { id: "task10", formCount: 3, promptRu: "Когда погода стала холоднее, я купил теплую куртку.", promptEn: "When the weather became colder, I bought a warm jacket.", expectedChain: "추워졌을 때", expectedAnswer: "날씨가 추워졌을 때 따뜻한 재킷을 샀어요." }
  ],
  post: [
    { id: "task01", formCount: 2, promptRu: "Эта сумка кажется дорогой, поэтому я купил другую.", promptEn: "This bag seems expensive, so I bought another one.", expectedChain: "비싼 것 같아서", expectedAnswer: "이 가방이 비싼 것 같아서 다른 가방을 샀어요." },
    { id: "task02", formCount: 2, promptRu: "Я хочу купить подарок, поэтому собираюсь пойти в магазин.", promptEn: "I want to buy a gift, so I am going to the store.", expectedChain: "사고 싶어서", expectedAnswer: "선물을 사고 싶어서 가게에 가려고 해요." },
    { id: "task03", formCount: 2, promptRu: "Когда я хочу что-нибудь съесть, я готовлю рамен.", promptEn: "When I want to eat something, I make ramen.", expectedChain: "먹고 싶을 때", expectedAnswer: "뭔가 먹고 싶을 때 라면을 끓여요." },
    { id: "task04", formCount: 2, promptRu: "Кажется, что автобус подъезжает, поэтому я вышел на улицу.", promptEn: "The bus seems to be arriving, so I went outside.", expectedChain: "버스가 오는 것 같아서", expectedAnswer: "버스가 오는 것 같아서 밖으로 나갔어요." },
    { id: "task05", formCount: 2, promptRu: "Если мой корейский станет лучше, я буду больше разговаривать с корейскими друзьями.", promptEn: "If my Korean improves, I will speak more with my Korean friends.", expectedChain: "좋아지면", expectedAnswer: "한국어 실력이 좋아지면 한국 친구들과 더 많이 이야기할 거예요." },
    { id: "task06", formCount: 3, promptRu: "Я хотел посмотреть фильм, но очень устал.", promptEn: "I wanted to watch a movie, but I was very tired.", expectedChain: "보고 싶었지만", expectedAnswer: "영화를 보고 싶었지만 너무 피곤했어요." },
    { id: "task07", formCount: 3, promptRu: "Я не хочу есть один, поэтому позвонил другу.", promptEn: "I did not want to eat alone, so I called a friend.", expectedChain: "먹고 싶지 않아서", expectedAnswer: "혼자 먹고 싶지 않아서 친구에게 전화했어요." },
    { id: "task08", formCount: 3, promptRu: "Когда в комнате стало темнее, я включил свет.", promptEn: "When the room became darker, I turned on the light.", expectedChain: "어두워졌을 때", expectedAnswer: "방이 어두워졌을 때 불을 켰어요." },
    { id: "task09", formCount: 3, promptRu: "Если ты не хочешь есть сейчас, можешь поесть позже.", promptEn: "If you do not want to eat now, you can eat later.", expectedChain: "먹고 싶지 않으면", expectedAnswer: "지금 먹고 싶지 않으면 나중에 먹어도 돼요." },
    { id: "task10", formCount: 3, promptRu: "Я собирался заниматься, но ко мне пришел друг.", promptEn: "I was going to study, but a friend came to visit me.", expectedChain: "공부하려고 했지만", expectedAnswer: "공부를 하려고 했지만 친구가 왔어요." }
  ]
};

function getSpeakingTasks(stage) {
  const normalizedStage = stage === "post" ? "post" : "pre";
  return SPEAKING_TASK_SETS[normalizedStage].map((task, index) => ({
    ...task,
    order: index + 1
  }));
}

module.exports = {
  SPEAKING_TASK_SETS,
  getSpeakingTasks
};
