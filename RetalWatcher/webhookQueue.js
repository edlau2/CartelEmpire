// webhookQueue.js
//const fetch = global.fetch || require("node-fetch");
const fetch = global.fetch || require('cross-fetch');

function createWebhookQueue({ minIntervalMs = 1000, logger }) {
  const pending = [];
  let processing = false;
  let lastSendTime = 0;

  async function processQueue() {
    if (processing || pending.length === 0) return;
    processing = true;

    while (pending.length > 0) {
      const { url, payload } = pending.shift();

      const now = Date.now();
      const elapsed = now - lastSendTime;
      const delay = Math.max(0, minIntervalMs - elapsed);

      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }

      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        // Discord rate limit
        if (resp.status === 429) {
          const data = await resp.json();
          const retry = (data.retry_after || 1) * 1000;

          logger.error(`Discord rate limit hit. Retrying in ${retry} ms`);
          await new Promise(r => setTimeout(r, retry));

          // Put back in queue
          pending.unshift({ url, payload });
        } else if (!resp.ok) {
          logger.error("Discord webhook error:", resp.status);
        } else {
          logger.log("Webhook sent successfully");
        }

        lastSendTime = Date.now();

      } catch (err) {
        logger.error("Error sending webhook:", err);
      }
    }

    processing = false;
  }

  function enqueue(url, payload) {
    pending.push({ url, payload });
    processQueue();
  }

  return { enqueue };
}

module.exports = { createWebhookQueue };
