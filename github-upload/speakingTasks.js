const SPEAKING_TASK_SETS = {
  pre: [
    {
      id: "task01",
      promptRu: "Здесь будет текст первого pre-test задания.",
      promptEn: "The first pre-test prompt will go here."
    },
    {
      id: "task02",
      promptRu: "Здесь будет текст второго pre-test задания.",
      promptEn: "The second pre-test prompt will go here."
    },
    {
      id: "task03",
      promptRu: "Здесь будет текст третьего pre-test задания.",
      promptEn: "The third pre-test prompt will go here."
    }
  ],
  post: [
    {
      id: "task01",
      promptRu: "Здесь будет текст первого post-test задания.",
      promptEn: "The first post-test prompt will go here."
    },
    {
      id: "task02",
      promptRu: "Здесь будет текст второго post-test задания.",
      promptEn: "The second post-test prompt will go here."
    },
    {
      id: "task03",
      promptRu: "Здесь будет текст третьего post-test задания.",
      promptEn: "The third post-test prompt will go here."
    }
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
