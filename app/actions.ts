"use server";

import { revalidatePath } from "next/cache";

export async function refreshMetrics(): Promise<void> {
  revalidatePath("/");
  revalidatePath("/widget");
}
