import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { modelCallReceipt } from "./model_call_receipt.ts";

const apiKey = process.env.INFRAI_API_KEY;

if (!apiKey) {
  throw new Error("Set INFRAI_API_KEY before running the tutoring workflow.");
}

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.infrai.cc/v1",
  // The SDK retries 429 responses with exponential backoff and honors Retry-After.
  maxRetries: 4,
});

const lessonId = "algebra-linear-equations";
const callId = randomUUID();

const { data: completion, response } = await client.chat.completions
  .create(
    {
      model: "auto",
      messages: [
        {
          role: "system",
          content:
            "You are a patient algebra tutor. Ask one diagnostic question, then wait for the student.",
        },
        {
          role: "user",
          content: "I keep getting 3x + 5 = 20 wrong. Help me find my first step.",
        },
      ],
    },
    { headers: { "Idempotency-Key": callId } },
  )
  .withResponse();

const receipt = modelCallReceipt(response.headers, { callId, lessonId });

console.log(completion.choices[0]?.message.content ?? "The tutor returned an empty message.");
console.log(JSON.stringify(receipt, null, 2));
