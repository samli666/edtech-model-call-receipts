import assert from "node:assert/strict";
import test from "node:test";
import { modelCallReceipt } from "../src/model_call_receipt.ts";

test("ties cost and vendor headers to the lesson call", () => {
  const headers = new Headers({
    "x-infrai-cost-usd": "0.00042",
    "x-infrai-vendor": "example-vendor",
  });

  assert.deepEqual(
    modelCallReceipt(headers, {
      callId: "call-lesson-17",
      lessonId: "lesson-17",
    }),
    {
      callId: "call-lesson-17",
      lessonId: "lesson-17",
      costUsd: "0.00042",
      servedBy: "example-vendor",
    },
  );
});

test("rejects an incomplete accounting receipt", () => {
  assert.throws(
    () =>
      modelCallReceipt(new Headers(), {
        callId: "call-lesson-18",
        lessonId: "lesson-18",
      }),
    /complete call accounting headers/,
  );
});
