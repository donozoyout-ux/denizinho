export default async function handler() {
  const baseUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL;
  const apiKey = process.env.INCOMING_WEBHOOK_API_KEY || "";

  if (!baseUrl) {
    return { statusCode: 500, body: "URL not configured" };
  }

  try {
    const res = await fetch(
      `${baseUrl}/api/cron/email-sync?key=${encodeURIComponent(apiKey)}`,
      { method: "POST" }
    );
    const text = await res.text();
    return {
      statusCode: res.ok ? 200 : res.status,
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: err instanceof Error ? err.message : "Sync failed",
    };
  }
}
