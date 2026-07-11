import { redirect } from "next/navigation";

/** Raiz redireciona para a primeira seção (docs/04 §3.1, R-NAV-05). */
export default function RootPage() {
  redirect("/founder");
}
