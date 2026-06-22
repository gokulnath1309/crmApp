declare const process: { env: Record<string, string | undefined> };

export default {
  providers: [
    {
      domain: "https://accounts.google.com",
      applicationID: process.env.AUTH_GOOGLE_ID!,
    },
    {
      // CONVEX_SITE_URL can resolve to either .convex.site or .convex.cloud
      // depending on the deployment. Include both to ensure JWT validation passes.
      domain: "https://reliable-fox-165.convex.site",
      applicationID: "convex",
    },
    {
      domain: "https://reliable-fox-165.convex.cloud",
      applicationID: "convex",
    },
  ],
};
