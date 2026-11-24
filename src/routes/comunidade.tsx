import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, ImagePlus, MessageSquare, Send, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostImage } from "@/components/PostImage";
import { prepararImagem, validarImagem } from "@/lib/community-image";
import { SiteLayout } from "@/components/SiteLayout";
import { useProfile } from "@/lib/use-profile";
import { avatarDe, formatarData, useCommunity, type Post } from "@/lib/use-community";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade | Nutrivida" },
      {
        name: "description",
        content:
          "Poste suas ideias de dieta, comente nas publicações do pessoal e conheça o perfil de outros membros da Nutrivida.",
      },
      { property: "og:title", content: "Comunidade | Nutrivida" },
      {
        property: "og:description",
        content: "Um feed para trocar ideias de dieta, receitas e rotinas com outras pessoas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Comunidade,
});

function Comunidade() {
  const { profile } = useProfile();
  const { posts, publicar, curtir, comentar, apagar } = useCommunity();
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState("");
  const [foto, setFoto] = useState<File>();
  const [previa, setPrevia] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!foto) { setPrevia(""); return; }
    const url = URL.createObjectURL(foto);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const escolherFoto = async (arquivo?: File) => {
    if (!arquivo) return;
    const erro = validarImagem(arquivo);
    if (erro) { setAviso(erro); return; }
    setOcupado(true);
    setAviso("");
    try { setFoto(await prepararImagem(arquivo)); }
    catch (erro) { setAviso(erro instanceof Error ? erro.message : "Não foi possível abrir a foto."); }
    finally { setOcupado(false); }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ocupado) return;
    if (titulo.trim().length < 3 || texto.trim().length < 10) {
      setAviso("Escreva um título e conte sua ideia com pelo menos 10 caracteres.");
      return;
    }
    setOcupado(true);
    setAviso("");
    try {
      await publicar(profile.name, titulo.trim(), texto.trim(), foto);
      setTitulo("");
      setTexto("");
      setFoto(undefined);
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível publicar. Tente novamente.");
    } finally { setOcupado(false); }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-5 py-12">
        <header className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-leaf text-leaf-foreground">
            <Users className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-primary">Comunidade</h1>
            <p className="text-sm text-muted-foreground">
              Poste sua ideia de dieta e comente na do pessoal.
            </p>
          </div>
        </header>

        <form onSubmit={enviar} className="surface-card mt-8 p-5">
          <div className="flex items-center gap-3">
            <img
              src={profile.photo}
              alt={`Foto de ${profile.name}`}
              className="size-10 rounded-full border border-border object-cover"
            />
            <span className="text-sm font-semibold text-primary">{profile.name}</span>
          </div>

          <input
            className="field mt-4"
            placeholder="Título da sua ideia"
            value={titulo}
            maxLength={80}
            disabled={ocupado}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <textarea
            className="field mt-3 min-h-28 resize-y"
            placeholder="Conta como você faz: refeições, horários, receitas..."
            value={texto}
            maxLength={800}
            disabled={ocupado}
            onChange={(e) => setTexto(e.target.value)}
          />

          <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Escolher foto do post" onChange={(e) => { void escolherFoto(e.target.files?.[0]); e.target.value = ""; }} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" disabled={ocupado} onClick={() => inputFoto.current?.click()}>
              <ImagePlus /> {foto ? "Trocar foto" : "Adicionar foto"}
            </Button>
            <span className="text-xs text-muted-foreground">JPG, PNG ou WebP · até 5 MB</span>
          </div>
          {previa && (
            <div className="relative mt-3 w-36">
              <img src={previa} alt="Prévia da foto selecionada" className="aspect-[4/3] w-full rounded-lg border border-border bg-muted object-contain" />
              <Button type="button" variant="outline" size="icon" aria-label="Remover foto" title="Remover foto" disabled={ocupado} onClick={() => setFoto(undefined)} className="absolute right-1 top-1 size-7 bg-card"><X /></Button>
            </div>
          )}
          {aviso && <p role="alert" className="mt-3 text-sm text-destructive">{aviso}</p>}

          <Button type="submit" disabled={ocupado} className="btn-leaf mt-4 h-auto">
            <Send className="size-4" /> {ocupado ? "Preparando..." : "Publicar"}
          </Button>
        </form>

        <div className="mt-8 flex flex-col gap-5">
          {posts.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Ninguém postou ainda. Seja o primeiro!
            </p>
          )}

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              eusou={profile.name}
              onCurtir={() => curtir(post.id)}
              onComentar={(t) => comentar(post.id, profile.name, t)}
              onApagar={() => apagar(post.id)}
            />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

function PostCard({
  post,
  eusou,
  onCurtir,
  onComentar,
  onApagar,
}: {
  post: Post;
  eusou: string;
  onCurtir: () => void;
  onComentar: (texto: string) => void;
  onApagar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [comentario, setComentario] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (comentario.trim().length < 2) return;
    onComentar(comentario.trim());
    setComentario("");
    setAberto(true);
  };

  return (
    <article className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <Link
          to="/usuario/$nome"
          params={{ nome: post.autor }}
          className="flex items-center gap-3"
        >
          <img
            src={avatarDe(post.autor)}
            alt={`Foto de ${post.autor}`}
            className="size-10 rounded-full border border-border object-cover"
          />
          <span>
            <span className="block text-sm font-semibold text-primary">{post.autor}</span>
            <span className="block text-xs text-muted-foreground">
              {formatarData(post.data)}
            </span>
          </span>
        </Link>

        {post.autor === eusou && (
          <button
            type="button"
            aria-label="Apagar publicação"
            onClick={onApagar}
            className="rounded-lg p-2 text-muted-foreground transition-smooth hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <h2 className="mt-4 text-lg font-semibold text-primary">{post.titulo}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {post.texto}
      </p>
      {post.imagem_url && <PostImage src={post.imagem_url} titulo={post.titulo} />}

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onCurtir}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-accent hover:text-leaf"
        >
          <Heart className="size-4" /> {post.curtidas}
        </button>
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-accent hover:text-primary"
        >
          <MessageSquare className="size-4" /> {post.comentarios.length} comentários
        </button>
      </div>

      {aberto && (
        <div className="mt-3 flex flex-col gap-3">
          {post.comentarios.map((c) => (
            <div key={c.id} className="rounded-xl bg-muted p-3">
              <div className="flex items-center gap-2">
                <Link
                  to="/usuario/$nome"
                  params={{ nome: c.autor }}
                  className="text-xs font-semibold text-primary"
                >
                  {c.autor}
                </Link>
                <span className="text-[11px] text-muted-foreground">
                  {formatarData(c.data)}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground">{c.texto}</p>
            </div>
          ))}

          <form onSubmit={enviar} className="flex gap-2">
            <input
              className="field"
              placeholder="Escreva um comentário..."
              value={comentario}
              maxLength={300}
              onChange={(e) => setComentario(e.target.value)}
            />
            <button type="submit" className="btn-leaf px-4" aria-label="Enviar comentário">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
