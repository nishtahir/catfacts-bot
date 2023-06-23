import fs from "fs/promises";

const SERVER_URL = process.env.SERVER_URL;
const CAT_FACTS_APP_KEY = process.env.CAT_FACTS_APP_KEY;
const PALM_API_KEY = process.env.PALM_API_KEY;
const MODEL_NAME = "models/text-bison-001";
const PROMPT_TEMPLATE = `{}
  ---
  Rewrite this cat fact in the style of a cute cat informing humans in the first person. Use emojis where appropriate.`;

const TEMPERATURE = 0.7;
const TOP_K = 40;
const TOP_P = 0.95;
const CANDIDATE_COUNT = 1;
const MAX_OUTPUT_TOKENS = 1024;
const STOP_SEQUENCES = [];

export async function main(args: {}): Promise<{}> {
  const corpus = await fs.readFile("corpus.txt", "utf-8");

  const lines = corpus.split("\n");
  const randomLine = lines[Math.floor(Math.random() * lines.length)];
  const PROMPT = PROMPT_TEMPLATE.replace("{}", randomLine);

  const body = JSON.stringify({
    prompt: { text: PROMPT },
    temperature: TEMPERATURE,
    top_k: TOP_K,
    top_p: TOP_P,
    candidate_count: CANDIDATE_COUNT,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    stop_sequences: STOP_SEQUENCES,
    safety_settings: [
      { category: "HARM_CATEGORY_DEROGATORY", threshold: 1 },
      { category: "HARM_CATEGORY_TOXICITY", threshold: 1 },
      { category: "HARM_CATEGORY_VIOLENCE", threshold: 2 },
      { category: "HARM_CATEGORY_SEXUAL", threshold: 2 },
      { category: "HARM_CATEGORY_MEDICAL", threshold: 2 },
      { category: "HARM_CATEGORY_DANGEROUS", threshold: 2 },
    ],
  });

  const palmRawResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta2/${MODEL_NAME}:generateText?key=${PALM_API_KEY}`,
    {
      body,
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  const palmResponse = await palmRawResponse.json();
  const palmOutput = palmResponse.candidates[0].output;
  const response = await fetch(`${SERVER_URL}/api/v1/statuses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CAT_FACTS_APP_KEY}`,
    },
    body: JSON.stringify({
      status: palmOutput,
    }),
  });
  return { body: await response.json() };
}
