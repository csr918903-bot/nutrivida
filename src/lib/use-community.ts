import { useCallback, useEffect, useState } from "react";

import { banco, bancoAtivo } from "./db";
import { COMMUNITY_BUCKET, imagemLocal, salvarPostsLocais } from "./community-image";

export type Comentario = {
  id: string;
  autor: string;
  texto: string;
  data: string;
};

export type Post = {
  id: string;
  autor: string;
  titulo: string;
  texto: string;
  data: string;
  curtidas: number;
  comentarios: Comentario[];
  imagem_url?: string;
};

const KEY = "nutrivida:posts";
const EVENT = "nutrivida:posts-change";

const SEED: Post[] = [
  {
    id: "p1",
    imagem_url: "/images/community-breakfast.webp",
    autor: "Marina Alves",
    titulo: "Café da manhã que me segura até o almoço",
    texto:
      "Ovos mexidos com 2 fatias de pão integral, meio abacate e um café sem açúcar. Simples, barato e eu não sinto fome antes do meio-dia.",
    data: "2026-08-10T09:12:00.000Z",
    curtidas: 12,
    comentarios: [
      {
        id: "c1",
        autor: "Rafael Lima",
        texto: "Testei ontem e funcionou demais, obrigado!",
        data: "2026-08-10T12:40:00.000Z",
      },
    ],
  },
  {
    id: "p2",
    imagem_url: "/images/community-meal-prep.webp",
    autor: "Rafael Lima",
    titulo: "Marmita de domingo para a semana toda",
    texto:
      "Faço arroz integral, frango desfiado e legumes assados no domingo à noite. Divido em 5 potes. Gasto 1h e paro de pedir delivery na correria.",
    data: "2026-08-12T18:05:00.000Z",
    curtidas: 27,
    comentarios: [],
  },
  {
    id: "p3",
    imagem_url: "/images/community-water.webp",
    autor: "Bianca Souza",
    titulo: "Truque para beber mais água",
    texto:
      "Deixo uma garrafa de 1L na mesa e marco com caneta os horários. Se está atrasado eu bebo. Já cheguei em 2,5L por dia sem sofrimento.",
    data: "2026-08-14T08:30:00.000Z",
    curtidas: 8,
    comentarios: [
      {
        id: "c2",
        autor: "Marina Alves",
        texto: "Vou fazer isso hoje, sempre esqueço de beber água.",
        data: "2026-08-14T10:02:00.000Z",
      },
      {
        id: "c3",
        autor: "Nutrivida",
        texto: "Boa! Água antes das refeições também ajuda na saciedade.",
        data: "2026-08-14T11:15:00.000Z",
      },
    ],
  },
];

/* ---------- modo navegador (localStorage) ---------- */

function fotoExemplo(post: Post): Post {
  if (post.imagem_url) return post;
  const exemplo = SEED.find((p) => p.autor === post.autor && p.titulo === post.titulo && p.texto === post.texto);
  return exemplo?.imagem_url ? { ...post, imagem_url: exemplo.imagem_url } : post;
}

function ler(): Post[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    const dados = JSON.parse(raw) as Post[];
    return Array.isArray(dados) ? dados.map(fotoExemplo) : SEED;
  } catch {
    return SEED;
  }
}

function gravar(posts: Post[]) {
  salvarPostsLocais(localStorage, KEY, posts);
  window.dispatchEvent(new Event(EVENT));
}

function novoId() {
  return Math.random().toString(36).slice(2, 10);
}

/* ---------- modo banco de dados (online) ---------- */

type LinhaPost = {
  id: string;
  autor: string;
  titulo: string;
  texto: string;
  curtidas: number;
  criado_em: string;
  imagem_url?: string | null;
};

type LinhaComentario = {
  id: string;
  post_id: string;
  autor: string;
  texto: string;
  criado_em: string;
};

async function lerDoBanco(): Promise<Post[]> {
  if (!banco) return [];

  const [posts, comentarios] = await Promise.all([
    banco.from("posts").select("*").order("criado_em", { ascending: false }),
    banco.from("comentarios").select("*").order("criado_em", { ascending: true }),
  ]);

  if (posts.error) throw posts.error;
  if (comentarios.error) throw comentarios.error;

  const linhasPost = (posts.data ?? []) as LinhaPost[];
  const linhasComentario = (comentarios.data ?? []) as LinhaComentario[];

  return linhasPost.map((p) => fotoExemplo({
    id: p.id,
    autor: p.autor,
    titulo: p.titulo,
    texto: p.texto,
    data: p.criado_em,
    curtidas: p.curtidas,
    ...(p.imagem_url ? { imagem_url: p.imagem_url } : {}),
    comentarios: linhasComentario
      .filter((c) => c.post_id === p.id)
      .map((c) => ({ id: c.id, autor: c.autor, texto: c.texto, data: c.criado_em })),
  }));
}

export function formatarData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useCommunity() {
  const [posts, setPosts] = useState<Post[]>(bancoAtivo ? [] : SEED);

  const atualizar = useCallback(async () => {
    if (bancoAtivo) {
      try {
        setPosts(await lerDoBanco());
      } catch (erro) {
        console.error("Não consegui carregar os posts do banco:", erro);
      }
      return;
    }
    setPosts(ler());
  }, []);

  useEffect(() => {
    void atualizar();
    const sync = () => void atualizar();
    window.addEventListener("storage", sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT, sync);
    };
  }, [atualizar]);

  const publicar = useCallback(
    async (autor: string, titulo: string, texto: string, foto?: File) => {
      if (banco) {
        let imagem_url: string | undefined;
        if (foto) {
          const path = `posts/${crypto.randomUUID()}.${foto.type === "image/png" ? "png" : foto.type === "image/jpeg" ? "jpg" : "webp"}`;
          const { error: uploadError } = await banco.storage.from(COMMUNITY_BUCKET).upload(path, foto, { contentType: foto.type, upsert: false });
          if (uploadError) throw new Error("Não foi possível enviar a foto. Confira o armazenamento online ou publique sem foto.");
          imagem_url = banco.storage.from(COMMUNITY_BUCKET).getPublicUrl(path).data.publicUrl;
        }
        const { error } = await banco.from("posts").insert({ autor, titulo, texto, ...(imagem_url ? { imagem_url } : {}) });
        if (error) throw new Error("Não foi possível publicar. Confira a conexão e a coluna imagem_url se anexou uma foto. Seu texto e sua foto foram mantidos.");
        await atualizar();
        return;
      }
      const post: Post = {
        id: novoId(),
        autor,
        titulo,
        texto,
        data: new Date().toISOString(),
        curtidas: 0,
        comentarios: [],
        ...(foto ? { imagem_url: await imagemLocal(foto) } : {}),
      };
      gravar([post, ...ler()]);
    },
    [atualizar],
  );

  const curtir = useCallback(
    async (id: string) => {
      if (banco) {
        const atual = posts.find((p) => p.id === id);
        const { error } = await banco
          .from("posts")
          .update({ curtidas: (atual?.curtidas ?? 0) + 1 })
          .eq("id", id);
        if (error) console.error("Não consegui curtir:", error);
        await atualizar();
        return;
      }
      gravar(ler().map((p) => (p.id === id ? { ...p, curtidas: p.curtidas + 1 } : p)));
    },
    [posts, atualizar],
  );

  const comentar = useCallback(
    async (id: string, autor: string, texto: string) => {
      if (banco) {
        const { error } = await banco
          .from("comentarios")
          .insert({ post_id: id, autor, texto });
        if (error) console.error("Não consegui comentar:", error);
        await atualizar();
        return;
      }
      gravar(
        ler().map((p) =>
          p.id === id
            ? {
                ...p,
                comentarios: [
                  ...p.comentarios,
                  { id: novoId(), autor, texto, data: new Date().toISOString() },
                ],
              }
            : p,
        ),
      );
    },
    [atualizar],
  );

  const apagar = useCallback(
    async (id: string) => {
      if (banco) {
        const { error } = await banco.from("posts").delete().eq("id", id);
        if (error) console.error("Não consegui apagar:", error);
        await atualizar();
        return;
      }
      gravar(ler().filter((p) => p.id !== id));
    },
    [atualizar],
  );

  return { posts, publicar, curtir, comentar, apagar, online: bancoAtivo };
}

export function avatarDe(nome: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=2e7d32&color=fff`;
}
