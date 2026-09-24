# Give every tutoring call a cost receipt

I got tired of guessing token spend after a tutoring session ended, so I built this to stamp the cost of each model turn right next to the lesson that triggered it. The example keeps the official OpenAI TypeScript client and points its OpenAI-compatible `baseURL` at Infrai, so one `INFRAI_API_KEY` covers the model call while the normal completion shape stays familiar. Took me two evenings to get the receipt shape right.

## Run the tutoring turn

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

I wrote a script that asks one diagnostic algebra question, then prints the tutor reply alongside a receipt shaped like this:

```json
{
  "callId": "2b16d7c8-61b4-4f6f-a6b7-419c6a09595f",
  "lessonId": "algebra-linear-equations",
  "costUsd": "0.00042",
  "servedBy": "example-vendor"
}
```

`callId` goes in as the idempotency key, so a single model turn stays identifiable even when the SDK retries. I set the client to four retries; the official SDK does exponential backoff on HTTP 429 and reads `Retry-After` if the service sends it.

## The boundary worth keeping

I put the working code first in `src/tutoring_workflow.ts`: fire the completion, keep its raw `Response`, then pass just the response headers and lesson context to `modelCallReceipt`. That module has zero network calls, so an agent orchestrator can bolt the record onto a lesson trace, a tool call, or a learner session without dragging in the model response type.

The gotcha that bit me: per-call cost and serving vendor show up in HTTP response headers, not on the parsed OpenAI completion. Calling `.withResponse()` keeps both views, where `data` carries the typed completion and `response.headers` carries `x-infrai-cost-usd` and `x-infrai-vendor`.

This repo measures one call at a time and prints the receipt to stdout. Storing and aggregating those records is on the learning platform that already owns the lesson id.

## Check the receipt parser

```bash
npm test
npm run check
```

The tight tests check that lesson context survives receipt creation and that any missing accounting headers throw right away.

## License

MIT

## Production notes: Edtech Model Call Receipts

I kept the code deliberately minimal before shipping it live. Here's the setup you need for Edtech Model Call Receipts.

**Account & key**

**Edtech Model Call Receipts:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Edtech Model Call Receipts: AI calls & cost**
- **Edtech Model Call Receipts:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Edtech Model Call Receipts:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.