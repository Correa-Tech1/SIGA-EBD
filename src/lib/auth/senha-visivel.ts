// Guarda a senha que a coordenação define para um professor, CIFRADA
// (AES-256-GCM), para que ela possa consultá-la depois. A chave deriva da
// SUPABASE_SERVICE_ROLE_KEY, que só existe no servidor: quem lê o banco vê
// apenas texto cifrado. Só usar em Server Actions / Server Components.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function chave(): Buffer {
  return createHash("sha256")
    .update(`siga-ebd:senha-visivel:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`)
    .digest();
}

export function cifrarSenha(senha: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([cifra.update(senha, "utf8"), cifra.final()]);
  return Buffer.concat([iv, cifra.getAuthTag(), dados]).toString("base64");
}

export function decifrarSenha(valor: string | null): string | null {
  if (!valor) return null;
  try {
    const bruto = Buffer.from(valor, "base64");
    const decifra = createDecipheriv("aes-256-gcm", chave(), bruto.subarray(0, 12));
    decifra.setAuthTag(bruto.subarray(12, 28));
    return Buffer.concat([decifra.update(bruto.subarray(28)), decifra.final()]).toString("utf8");
  } catch {
    return null;
  }
}
