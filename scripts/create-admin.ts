/**
 * Cria (ou redefine a senha d)o usuario ADMIN — o founder (ADR 0001 §5).
 *
 * A senha vem SEMPRE da env `ADMIN_PASSWORD` (nunca hardcoded, nunca via arg no
 * shell history se possivel). O e-mail e `config.FOUNDER_EMAIL`. O usuario e criado
 * com e-mail JA confirmado (`email_confirm: true`) — nao depende de SMTP.
 *
 * O trigger `on_auth_user_created` provisiona o profile como `admin` (e-mail do
 * founder). Este script tambem garante `role = 'admin'` no profile (idempotente).
 *
 * IDEMPOTENTE: se o admin ja existe, apenas ATUALIZA a senha (util para o founder
 * assumir a conta apos um bootstrap com senha temporaria).
 *
 * Uso (PowerShell):  $env:ADMIN_PASSWORD="suaSenhaForte"; pnpm tsx --conditions=react-server scripts/create-admin.ts
 * Uso (bash):        ADMIN_PASSWORD="suaSenhaForte" pnpm tsx --conditions=react-server scripts/create-admin.ts
 */
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

async function main(): Promise<void> {
  const email = config.FOUNDER_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (config.CONTENT_STORE !== "supabase") {
    console.warn(
      "Aviso: CONTENT_STORE nao e 'supabase' — o script ainda cria o usuario no " +
        "Auth do projeto configurado, mas confirme que e o ambiente certo.",
    );
  }
  if (!password || password.length < 8) {
    console.error(
      "ERRO: defina ADMIN_PASSWORD (>= 8 caracteres) no ambiente antes de rodar.\n" +
        '  PowerShell: $env:ADMIN_PASSWORD="suaSenha"; pnpm tsx --conditions=react-server scripts/create-admin.ts',
    );
    process.exit(1);
  }

  const admin = createAdminClient();

  // Existe um usuario com esse e-mail? (varre a 1a pagina; base pequena)
  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === email);

  let userId: string;
  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Admin ja existia — senha atualizada. (${email})`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Admin criado. (${email})`);
  }

  // Garante role=admin no profile (o trigger ja deve ter feito; idempotente).
  const { error: profErr } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);
  if (profErr) {
    console.warn(`Aviso: nao consegui confirmar role=admin no profile: ${profErr.message}`);
  }

  console.log(`admin userId: ${userId}`);
  console.log("Pronto. Faca login em /login com esse e-mail e a senha definida.");
}

main().catch((err: unknown) => {
  console.error("Falha ao criar/atualizar admin:", err instanceof Error ? err.message : err);
  process.exit(1);
});
