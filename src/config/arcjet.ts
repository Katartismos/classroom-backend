import arcjet, {
  detectBot,
  shield,
  tokenBucket,
  slidingWindow,
} from "@arcjet/node";

const key = process.env.ARCJET_KEY || (process.env.NODE_ENV === "test" ? "ajkey_test" : "");

if (!key) {
  throw new Error("ARCJET_KEY environment variable is not set.");
}

const aj = arcjet({
  key,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        //"CATEGORY:MONITOR", // Uptime monitoring services
        "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    slidingWindow({
      mode: "LIVE",
      interval: 2,
      max: 5,
    }),
  ],
});

export default aj;
