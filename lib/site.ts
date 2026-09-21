export const site = {
  name: "Oura Home Widget",
  shortName: "Oura Widget",
  contactEmail:
    process.env.CONTACT_EMAIL ?? "replace-with-your-email@example.com",
  attribution: "Data provided by Oura",
  ouraApplicationsUrl: "https://cloud.ouraring.com/oauth/applications",
  ouraRevokeUrl: "https://cloud.ouraring.com",
} as const;
