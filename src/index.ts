import "dotenv/config";

const hubspotAccessToken = process.env.HUBSPOT_ACCESS_TOKEN;

console.log("HubSpot job discovery tool is ready.");
console.log(
  `HubSpot access token: ${hubspotAccessToken ? "configured" : "not configured"}`,
);
