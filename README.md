# Nutrivida

Site de nutrição com página inicial, comunidade, chatbot, calculadora de IMC, perfil e login.

## Páginas

- `/` — início com slider de atualizações
- `/comunidade` — feed de ideias de dieta, curtidas e comentários
- `/usuario/{nome}` — perfil público de cada pessoa
- `/chatbot` — assistente de nutrição
- `/imc` — calculadora de IMC
- `/perfil` — seus dados
- `/login` — entrar / criar conta

## Como rodar no seu computador

```sh
npm install
npm run dev
```

## Banco de dados (para os posts aparecerem em todos os dispositivos)

O site funciona sem banco: nesse caso cada pessoa vê só os posts salvos no
próprio navegador. Para deixar a comunidade de verdade:

1. Crie uma conta gratuita em https://supabase.com e um projeto novo.
2. Abra **SQL Editor**, cole o conteúdo de `banco/nutrivida.sql` e clique em **Run**.
3. Em **Project Settings > API**, copie a *Project URL* e a chave *anon public*.
4. Crie um arquivo `.env` na raiz (use o `.env.example` como modelo):

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

Pronto: os posts, curtidas e comentários passam a ser salvos online.

### Fotos nos posts

Sem conexão, fotos opcionais ficam no navegador em versão reduzida (máximo de
1280 px). Os arquivos selecionados precisam ser JPG, PNG ou WebP e ter até 5 MB.
Se faltar espaço, o formulário mantém o texto e a foto e avisa antes de limpar.
Isso não sincroniza fotos ou posts entre dispositivos.

Para o projeto externo configurado nas variáveis acima:

1. Execute `banco/fotos-posts.sql` no SQL Editor para adicionar `imagem_url`
   e as políticas de anexos. Vale também para quem já tem os posts antigos.
2. Crie o bucket `post-images` pela API nativa de Storage. Em um script local
   de administração, com um cliente administrativo seguro, a chamada é:

   ```js
   await clienteAdministrativo.storage.createBucket('post-images', {
     public: true,
     fileSizeLimit: 5 * 1024 * 1024,
     allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
   });
   ```

   Não coloque chaves administrativas no site, no GitHub ou em variáveis `VITE_`.
   A coluna é criada via SQL; o bucket somente pela API de Storage.
3. Os uploads usam nomes únicos, sem sobrescrever fotos. Sem bucket/coluna,
   o envio de fotos mostra um aviso e mantém o formulário; posts sem foto
   continuam funcionando. Falha de conexão não salva uma cópia local silenciosa.

Os três exemplos originais ganham fotos ilustrativas locais, sem alterar seu
texto, curtidas ou comentários. Outros posts antigos continuam sem foto.
Como a comunidade ainda é aberta e sem login real, a política permite uploads
públicos; antes de uso amplo, implemente login e limites para evitar abuso.

## Publicar na Vercel

1. Mande o projeto para o GitHub.
2. Em https://vercel.com clique em **Add New > Project** e escolha o repositório.
3. A Vercel detecta o build sozinha (`npm run build`). Não mude nada.
4. Em **Environment Variables**, adicione as mesmas duas linhas do `.env`
   (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
5. Clique em **Deploy**. O site sai em um endereço tipo `nutrivida.vercel.app`,
   e você pode ligar um domínio próprio em **Settings > Domains**.

Sempre que você der `git push`, a Vercel publica a nova versão automaticamente.
