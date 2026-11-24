import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { MAX_IMAGE_BYTES, salvarPostsLocais, validarImagem } from "./community-image";

describe("fotos opcionais de posts", () => {
  test("aceita JPG, PNG e WebP até 5 MB", () => {
    assert.equal(MAX_IMAGE_BYTES, 5 * 1024 * 1024);
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      assert.equal(validarImagem({ type, size: 5 * 1024 * 1024 }), null);
    }
  });
  test("rejeita fotos acima de 5 MB", () => {
    assert.equal(validarImagem({ type: "image/png", size: 5 * 1024 * 1024 + 1 }), "A foto deve ter no máximo 5 MB.");
  });
  test("não aceita GIF, SVG, arquivos de texto ou imagem vazia", () => {
    for (const type of ["image/gif", "image/svg+xml", "text/plain", ""]) {
      assert.equal(validarImagem({ type, size: 100 }), "Escolha uma foto JPG, PNG ou WebP.");
    }
    assert.equal(validarImagem({ type: "image/png", size: 0 }), "Essa imagem está vazia. Escolha outra foto.");
  });
  test("posts sem foto continuam sendo salvos sem exigir imagem", () => {
    let saved = "";
    const posts = [{ id: "test", autor: "Marina Alves", titulo: "Minha ideia", texto: "Uma ideia sem foto", comentarios: [], curtidas: 0 }];
    salvarPostsLocais({ setItem: (_key, value) => { saved = value; } }, "posts", posts);
    assert.deepEqual(JSON.parse(saved), posts);
  });
  test("falta de espaço não sobrescreve posts e produz erro recuperável", () => {
    const previous = "posts existentes";
    let stored = previous;
    assert.throws(() => salvarPostsLocais({ setItem: () => { throw new Error("QuotaExceededError"); } }, "posts", []), /não tem espaço/);
    assert.equal(stored, previous);
  });
});