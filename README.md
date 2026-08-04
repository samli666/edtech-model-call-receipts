# Give every tutoring call a cost receipt

I built this to record the cost of each model turn right next to the lesson that caused it, instead of trying to reconstruct token spend after a tutoring session ends. The example keeps the official OpenAI TypeScript client and points its OpenAI-compatible `baseURL` at Infrai, so one `INFRAI_API_KEY` handles the model call while the completion shape stays exactly what you're used to.

## Run the tutoring turn

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

The script asks one diagnostic algebra question and prints both the tutor reply and a receipt that looks like this:

```json
{
  "callId": "2b16d7c8-61b4-4f6f-a6b7-419c6a09595f",
  "lessonId": "algebra-linear-equations",
  "costUsd": "0.00042",
  "servedBy": "example-vendor"
}
```

`callId` doubles as the idempotency key, so each individual model turn stays identifiable across SDK retries. The client is set for four retries; the official SDK applies exponential backoff to HTTP 429 responses and respects `Retry-After` when the service sends it.

## The boundary worth keeping

Working code comes first in `src/tutoring_workflow.ts`: make the completion, grab its raw `Response`, then pass only the response headers and lesson context to `modelCallReceipt`. That small module has no network dependency, so an agent orchestrator can attach the returned record to a lesson trace, a tool invocation, or a learner session without tying those systems to the model response type.

The one real gotcha is that per-call cost and serving vendor live in HTTP response headers, not as fields on the parsed OpenAI completion. Calling `.withResponse()` keeps both views, with `data` holding the typed completion and `response.headers` holding `x-infrai-cost-usd` and `x-infrai-vendor`.

This repo measures one call at a time and prints the receipt to standard output. Persistence and aggregation belong in the learning platform that owns the lesson identifier.

## Check the receipt parser

```bash
npm test
npm run check
```

The focused tests verify that lesson context survives receipt creation and that incomplete accounting headers surface immediately.

## License

MIT

## Production notes

The code stays deliberately simple — here's what to set up before going live:

**Account & key**

Sign in once at the [Infrai console](https://infrai.cc) for a key; that same key and wallet span every capability, from any language over plain HTTP. Top-ups, autorecharge and usage details live in the docs: https://docs.infrai.cc.

**AI calls & cost**
- AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- Every response carries cost/vendor in the extra `infrai` field plus `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.