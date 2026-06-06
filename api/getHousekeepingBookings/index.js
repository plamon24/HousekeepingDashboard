module.exports = async function (context, req) {
  const flowUrl = process.env.FLOW_GET_HOUSEKEEPING_URL;

  if (!flowUrl) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "FLOW_GET_HOUSEKEEPING_URL is not configured" }
    };
    return;
  }

  try {
    const response = await fetch(flowUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {})
    });

    const text = await response.text();

    context.res = {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: text || "[]"
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: error.message || String(error) }
    };
  }
};
