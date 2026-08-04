export type ModelCallReceipt = {
  callId: string;
  lessonId: string;
  costUsd: string;
  servedBy: string;
};

export function modelCallReceipt(
  headers: Headers,
  context: { callId: string; lessonId: string },
): ModelCallReceipt {
  const costUsd = headers.get("x-infrai-cost-usd");
  const servedBy = headers.get("x-infrai-vendor");

  if (costUsd === null || servedBy === null) {
    throw new Error("The model response did not include complete call accounting headers.");
  }

  return { ...context, costUsd, servedBy };
}
