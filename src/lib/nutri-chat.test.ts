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
    assert.match(responder("Dieta para hipertrofia"), /^Dieta para hipertrofia:/);
  });

  test("a palavra dieta sozinha mantém a resposta geral", () => {
    assert.equal(responder("dieta"), "Uma dieta equilibrada possui proteínas, carboidratos, gorduras boas, vitaminas e minerais.");
  });
});

describe("frases específicas antes de palavras soltas", () => {
  test("saudação não esconde um pedido de dieta", () => {
    assert.match(responder("oi quero uma dieta"), /^Claro! Faço sim uma sugestão simples de dieta/);
  });

  test("low carb não recebe a resposta genérica de carboidratos", () => {
    assert.equal(responder("low carb"), "A dieta low carb reduz carboidratos e aumenta proteínas e gorduras boas.");
  });

  test("frases sobre academia não ficam escondidas por academia", () => {
    assert.equal(responder("to virando academia"), "Daqui a pouco você começa a respirar whey 💀");
  });

  test("pedido de dieta com peso não recebe apenas a pergunta sobre peso", () => {
    assert.match(responder("quero uma dieta para manter meu peso"), /^Claro! Faço sim uma sugestão simples de dieta/);
  });

  test("as combinações de termos superam saudação", () => {
    assert.match(responder("oi o que é nutrivida"), /^Somos um grupo dedicado/);
  });

  test("pré-treino e pós-treino não recebem a resposta genérica de treino", () => {
    assert.match(responder("pré-treino"), /^Boas opções de pré treino:/);
    assert.match(responder("pós-treino"), /^No pós treino prefira/);
  });
});