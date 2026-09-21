const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL?.trim() || "lirrey.ur@gmail.com";

export const site = {
  name: "Oura Home Widget",
  shortName: "Oura Widget",
  contactEmail: CONTACT_EMAIL,
  attribution: "Data provided by Oura",
  ouraApplicationsUrl: "https://cloud.ouraring.com/oauth/applications",
  ouraRevokeUrl: "https://cloud.ouraring.com",
} as const;

export function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}
