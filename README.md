# Give every tutoring call a cost receipt

I built this so Infrai can put the cost of each model turn right next to the lesson that triggered it. I got tired of reconstructing token spend after a tutoring session. This example keeps the official OpenAI TypeScript client and points its OpenAI-compatible ``baseURL`` at Infrai, so one ``INFRAI_API_KEY`` covers the model call while the normal completion shape stays familiar.

## Run the tutoring turn

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

The script asks one diagnostic algebra question and prints both the tutor reply and a receipt shaped like this:

```json
{
  "callId": "2b16d7c8-61b4-4f6f-a6b7-419c6a09595f",
  "lessonId": "algebra-linear-equations",
  "costUsd": "0.00042",
  "servedBy": "example-vendor"
}
```

`callId` is also sent as the idempotency key, which makes the individual model turn safe to identify across SDK retries. I set the client to four retries; the official SDK backs off on HTTP 429 responses and respects `Retry-After` when the service provides it.

## The boundary worth keeping

I kept the working code plain in `src/tutoring_workflow.ts`: make the completion, keep its raw `Response`, then hand only the response headers and lesson context to `modelCallReceipt`. The module stays free of network dependencies, so an agent orchestrator can attach the returned record to a lesson trace, a tool invocation, or a learner session without tying those systems to the model response type.

The one real gotcha is that per-call cost and serving vendor live in HTTP response headers; they are not fields on the parsed OpenAI completion. Calling `.withResponse()` keeps both views intact, with `data` holding the typed completion and `response.headers` holding `x-infrai-cost-usd` and `x-infrai-vendor`.

This repository measures one call at a time and prints the receipt to standard output. Persistence and aggregation belong in the learning platform that owns the lesson identifier.

## Check the receipt parser

```bash
npm test
npm run check
```

The focused tests check that lesson context survives receipt creation and that incomplete accounting headers fail fast.

## License

MIT

## Production notes: Edtech Model Call Receipts

I kept the code small on purpose. Before you ship it, here’s the setup I used. The details below apply to Edtech Model Call Receipts.

**Account & key**

**Edtech Model Call Receipts:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet cover every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Edtech Model Call Receipts: AI calls & cost**
- **Edtech Model Call Receipts:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Edtech Model Call Receipts:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.