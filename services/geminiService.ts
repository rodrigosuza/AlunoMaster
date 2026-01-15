

import { Question } from "../types";

const API_KEY = (import.meta.env?.VITE_OPENROUTER_API_KEY) || (import.meta.env?.VITE_OPENAI_API_KEY) || '';

// Determine if it's an OpenRouter key or standard OpenAI key
const isOpenRouter = API_KEY.startsWith('sk-or-');
const BASE_URL = isOpenRouter
  ? "https://openrouter.ai/api/v1/chat/completions"
  : "https://api.openai.com/v1/chat/completions";

// Use GPT-4o-mini as it's the best balance of speed/cost/quality for this
// If OpenRouter, we need the prefix. If OpenAI, just the model name.
const MODEL_NAME = isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini';

export const generateStudyContent = async (text: string) => {
  if (!API_KEY || API_KEY.length < 10) {
    throw new Error("⚠️ CHAVE NÃO CONFIGURADA: Verifique se a variável VITE_OPENROUTER_API_KEY ou VITE_OPENAI_API_KEY está no arquivo .env");
  }

  const systemInstruction = `
  ROLE: Você é um tutor de IA educacional avançado especializado em explicar conteúdos complexos de textos ou arquivos fornecidos de forma clara, estruturada e aprofundada para facilitar o aprendizado profundo. Seu objetivo é ajudar os usuários (referidos como "alunos") a entender o material de maneira completa, dividindo-o, explicando fundamentos, conectando conceitos e fornecendo insights detalhados — tudo enquanto permanece estritamente fiel ao conteúdo fornecido. Não adicione conhecimentos externos, suposições ou informações de fora do texto ou arquivo fornecido; tudo o que você produzir deve ser diretamente extraído, interpretado ou reformulado do material de entrada apenas.

  IDIOMA: Sempre use o idioma principal do conteúdo fornecido (Geralmente Português do Brasil).

  ESTRUTURA DO CONTEÚDO (campo 'summary'):
  - Comece com: "### Explicação Detalhada\\nAqui está uma explicação detalhada do conteúdo fornecido para o seu aprendizado:"
  - Use cabeçalhos ### para seções.
  - NÃO USE ASTERISCOS (**) para negrito. Mantenha o texto limpo ou use tags HTML simples se necessário, mas markdown padrão é preferido.
  - Termine com: "Esta explicação é totalmente baseada no material fornecido."

  QUIZ (campo 'questions'):
  - Gere 10 questões de múltipla escolha.
  - 4 opções por questão (ex: A, B, C, D).
  - Forneça a explicação para a resposta correta.

  FORMATO DE SAÍDA:
  Retorne APENAS um objeto JSON com a seguinte estrutura, sem blocos de código markdown:
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
    console.log(`[AlunoMaster] Enviando requisição para ${isOpenRouter ? 'OpenRouter' : 'OpenAI'}...`);

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        ...(isOpenRouter && {
          "HTTP-Referer": "https://alunomaster.ai",
          "X-Title": "AlunoMaster"
        })
      },
      body: JSON.stringify({
        "model": MODEL_NAME,
        "messages": [
          { "role": "system", "content": systemInstruction },
          { "role": "user", "content": prompt }
        ],
        "temperature": 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AlunoMaster] Erro Bruto da API:", errorText);

      let errorMessage = `Erro na API (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        // Handle OpenRouter / OpenAI specific error structures
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;

        // Tratamento específico para "Provider returned error" que é comum no OpenRouter
        if (errorMessage.includes("Provider returned error")) {
          errorMessage = "O provedor da IA (OpenAI/Google) retornou um erro temporário. Tente novamente em alguns instantes.";
        }
      } catch (e) {
        errorMessage = errorText.substring(0, 100) + "...";
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("[AlunoMaster] Resposta recebida com sucesso.");

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("[AlunoMaster] Formato de resposta inválido:", data);
      throw new Error("Resposta da IA fora do formato esperado.");
    }

    let content = data.choices[0].message.content;

    // Safety cleanup for JSON
    const jsonString = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (e) {
      console.error("[AlunoMaster] Falha ao parsear JSON:", jsonString);
      throw new Error("Falha ao processar a resposta da IA. Tente com um texto menor ou mais claro.");
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

    return {
      questions,
      summary: result.summary || "Sem explicação gerada."
    };

  } catch (error: any) {
    console.error("Erro na geração de conteúdo:", error);
    throw error;
  }
};
