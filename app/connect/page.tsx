import { redirect } from "next/navigation";

export default function ConnectPage() {
  redirect("/api/auth/oura");
}
