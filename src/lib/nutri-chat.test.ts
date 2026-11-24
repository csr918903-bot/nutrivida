import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { responder } from "./nutri-chat";

describe("pedidos específicos de dieta", () => {
  test("quero uma dieta recebe uma sugestão, não a resposta da palavra dieta", () => {
    assert.match(responder("quero uma dieta"), /^Claro! Faço sim uma sugestão simples de dieta/);
    assert.match(responder("quero dieta"), /^Claro! Faço sim uma sugestão simples de dieta/);
  });

  test("pergunta sobre o significado de dieta recebe a definição", () => {
    assert.match(responder("o que é dieta"), /^Dieta é o conjunto de alimentos e bebidas/);
  });

  test("rotina de dieta recebe horários", () => {
    assert.ok(responder("rotina de dieta").includes("- 06h: Café da manhã"));
  });

  test("objetivos específicos continuam tendo prioridade", () => {
    assert.match(responder("quero uma dieta para emagrecer"), /^Dieta para emagrecer:/);
    assert.match(responder("quero uma dieta para ganhar massa"), /^Dieta para hipertrofia:/);
  });

  test("a palavra dieta sozinha mantém a resposta geral", () => {
    assert.equal(responder("dieta"), "Uma dieta equilibrada possui proteínas, carboidratos, gorduras boas, vitaminas e minerais.");
  });
});