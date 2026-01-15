

import { Question } from "../types";

const OPENROUTER_API_KEY = (import.meta.env?.VITE_OPENROUTER_API_KEY) || '';
const MODEL_NAME = 'google/gemini-2.0-flash-exp:free';

export const generateStudyContent = async (text: string) => {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.length < 10) {
    throw new Error("⚠️ CHAVE NÃO CONFIGURADA: Verifique as Variáveis de Ambiente na Vercel.");
  }
  const systemInstruction = `
  ROLE: Você é um tutor de IA educacional avançado especializado em explicar conteúdos complexos de textos ou arquivos fornecidos de forma clara, estruturada e aprofundada para facilitar o aprendizado profundo. Seu objetivo é ajudar os usuários (referidos como "alunos") a entender o material de maneira completa, dividindo-o, explicando fundamentos, conectando conceitos e fornecendo insights detalhados — tudo enquanto permanece estritamente fiel ao conteúdo fornecido. Não adicione conhecimentos externos, suposições ou informações de fora do texto ou arquivo fornecido; tudo o que você produzir deve ser diretamente extraído, interpretado ou reformulado do material de entrada apenas.

  IDIOMA: Sempre use o idioma principal do conteúdo fornecido.

  ESTRUTURA DO CONTEÚDO (campo 'summary'):
  - Comece com: "### Explicação Detalhada\\nAqui está uma explicação detalhada do conteúdo fornecido para o seu aprendizado:"
  - Use cabeçalhos ### para seções.
  - NÃO USE ASTERISCOS (**) para negrito. Mantenha o texto limpo.
  - Termine com: "Esta explicação é totalmente baseada no material fornecido. Se você tiver dúvidas sobre partes específicas, forneça mais detalhes."

  QUIZ (campo 'questions'):
  - Gere 10 questões de múltipla escolha.
  - 4 opções por questão.
  - Forneça a explicação para a resposta correta.

  FORMATO DE SAÍDA:
  Retorne APENAS um objeto JSON com a seguinte estrutura:
  {
    "summary": "string",
    "questions": [
      {
        "text": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswerIndex": number,
        "explanation": "string"
      }
    ]
  }
  `;

  const prompt = `Analise o material a seguir e gere o conteúdo de aprendizado estruturado (Explicação Profunda + Quiz) em formato JSON conforme as instruções.

  CONTEÚDO:
  ${text.substring(0, 30000)}`;

  try {
    console.log("[AlunoMaster] Enviando requisição para OpenRouter...");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://alunomaster.ai",
        "X-Title": "AlunoMaster"
      },
      body: JSON.stringify({
        "model": MODEL_NAME,
        "messages": [
          { "role": "system", "content": systemInstruction },
          { "role": "user", "content": prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Erro na API (Status " + response.status + ")";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      console.error("[AlunoMaster] Erro na Resposta:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("[AlunoMaster] Resposta recebida com sucesso.");

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("[AlunoMaster] Formato de resposta inválido:", data);
      throw new Error("Resposta da IA no formato incorreto. Tente novamente.");
    }

    let content = data.choices[0].message.content;

    // Safety cleanup
    const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (e) {
      console.error("[AlunoMaster] Falha ao parsear JSON:", jsonString);
      throw new Error("A IA não retornou um JSON válido. Tente um texto menor.");
    }

    const questions: Question[] = (result.questions || []).slice(0, 10).map((q: any, idx: number) => {
      const cleanOptions = (q.options || [])
        .filter((opt: any) => typeof opt === 'string')
        .slice(0, 4);

      return {
        ...q,
        options: cleanOptions,
        id: `q-${idx}-${Date.now()}`
      };
    });

    return { questions, summary: result.summary || "Sem explicação gerada." };
  } catch (error: any) {
    console.error("Erro na geração de conteúdo OpenRouter:", error);
    throw error; // Repassa o erro original com a mensagem correta
  }
};
