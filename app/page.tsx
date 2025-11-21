// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // 👇 ajuste o caminho se a sua tela de login estiver em outra rota
  redirect("/login");
}
