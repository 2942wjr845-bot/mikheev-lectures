import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const role = await verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);

  if (role === "uploader") redirect("/upload");
  if (role === "reader") redirect("/lectures");
  redirect("/login");
}
