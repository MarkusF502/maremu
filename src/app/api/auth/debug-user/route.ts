// app/api/debug-user/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcrypt";

export async function GET() {
  try {
    // 1. Cria uma loja fictícia para o usuário pertencer (Regra Multi-tenant)
    const loja = await prisma.loja.create({
      data: {
        razaoSocial: "Maremu Vestuarios LTDA",
        nomeFantasia: "Maremu Store",
        cnpj: "12345678000199",
        custoFixoMensal: 2000.00,
        metaLucroMensal: 5000.00
      }
    });

    // 2. Criptografa a senha de teste
    const senhaCriptografada = await bcrypt.hash("admin123", 10);

    // 3. Cria o usuário administrador atrelado à loja
    const usuario = await prisma.usuario.create({
      data: {
        nome: "Administrador Teste",
        email: "teste@maremu.com",
        senhaHash: senhaCriptografada,
        perfil: "ADMIN",
        lojaId: loja.id
      }
    });

    return NextResponse.json({ message: "Loja e Usuário criados com sucesso!", email: usuario.email, senha: "admin123" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}