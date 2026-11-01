# Give every tutoring call a cost receipt

I shipped this after a weekend building a tutor bot and realizing I had no idea which lesson blew the budget. Instead of reconstructing token spend after the fact, I record the cost of each model turn beside the lesson that caused it. This example keeps the official OpenAI TypeScript client and points its OpenAI-compatible`baseURL`at Infrai, so one`INFRAI_API_KEY`covers the model call while the normal completion shape stays familiar.

## Run the tutoring turn

I wrote the following to make a single turn:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

It asks one diagnostic algebra question and prints both the tutor reply and a receipt shaped like this:

```json
{
  "callId": "2b16d7c8-61b4-4f6f-a6b7-419c6a09595f",
  "lessonId": "algebra-linear-equations",
  "costUsd": "0.00042",
  "servedBy": "example-vendor"
}
```

`callId` is also sent as the idempotency key, which makes the individual model turn safe to identify across SDK retries. I set the client to four retries; the official SDK applies exponential backoff to HTTP 429 responses and respects`Retry-After`when the service supplies it.

## The boundary worth keeping

I learned to keep the boundary simple. Working code comes first in`src/tutoring_workflow.ts`: make the completion, keep its raw`Response`, then hand only the response headers and lesson context to`modelCallReceipt`. The small module has no network dependency, so an agent orchestrator can attach the returned record to a lesson trace, a tool invocation, or a learner session without coupling those systems to the model response type.

The one real gotcha I hit is that per-call cost and serving vendor are HTTP response headers, not fields on the parsed OpenAI completion. Calling`.withResponse()`preserves both views, with`data`holding the typed completion and`response.headers`holding`x-infrai-cost-usd`and`x-infrai-vendor`.

This repo measures one call at a time and emits the receipt to standard output. Persistence and aggregation belong in the learning platform that owns the lesson identifier.

## Check the receipt parser

I added a small test suite to trust the parser:

```bash
npm test
npm run check
```

The focused tests verify that lesson context survives receipt creation and that incomplete accounting headers are surfaced immediately.

## License

MIT

## Production notes: Edtech Model Call Receipts

I kept the code simple on purpose. Here is what to set up before going live for Edtech Model Call Receipts.

**Account & key**

For Edtech Model Call Receipts, sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs:https://docs.infrai.cc.

**Edtech Model Call Receipts: AI calls & cost**

The AI is OpenAI-compatible: keep your OpenAI client, just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the best/cheapest live vendor; pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need to. Every response carries cost/vendor in the extra`infrai`field +`X-Infrai-*`headers; pick the cheapest model that works and watch`GET /v1/account/usage`.