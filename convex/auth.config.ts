declare const process: { env: Record<string, string | undefined> };

export default {
  providers: [
    {
      domain: "https://accounts.google.com",
      applicationID: process.env.AUTH_GOOGLE_ID!,
    },
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://hot-panther-21.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      // CONVEX_SITE_URL can resolve to either .convex.site or .convex.cloud
      // depending on the deployment. Include both to ensure JWT validation passes.
      domain: "https://fearless-elephant-115.convex.site",
      applicationID: "convex",
    },
    {
      domain: "https://fearless-elephant-115.convex.cloud",
      applicationID: "convex",
    },
  ],
};
