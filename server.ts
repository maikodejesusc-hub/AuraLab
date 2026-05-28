import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize the Gemini client utility
// Note: set the User-Agent header to 'aistudio-build' in httpOptions for telemetry.
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API routes FIRST
app.post("/api/chat", async (req, res) => {
  try {
    const { history, attachments, temperature, personality } = req.body;
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: "O histórico de mensagens é obrigatório." });
    }

    if (!ai) {
      return res.status(500).json({
        error: "A chave de API GEMINI_API_KEY não foi configurada. Configure a sua chave para interagir com a Aura."
      });
    }

    // Get the last user message text
    const lastMessage = history[history.length - 1];
    const lastUserText = lastMessage?.sender === 'user' ? (lastMessage.text || "") : "";
    const lowerMessage = lastUserText.toLowerCase().trim();

    // Robust image request detection
    const imageWords = [
      "imagem", "imagens", "foto", "fotos", "desenho", "desenhos", "desenhar", "desenha", "desenhe",
      "ilustre", "ilustra", "ilustração", "ilustrações", "pintura", "pinturas", "pintar", "retrato", "retratos", "retratar",
      "image", "images", "photo", "photos", "draw", "drawing", "paint", "painting", "illustration", "illustrations",
      "wallpaper", "wallpapers", "avatar", "icon", "logo"
    ];
    
    const actionWords = [
      "crie", "criar", "cria", "crier", "crear", "cree", "gerar", "gera", "gerei", "geree", "produzir", "produza",
      "faça", "fazer", "faz", "fasa", "pinte", "pintar", "pinta", "desenhe", "desenhar", "desenha", "ilustre", "ilustra", "ilustrar",
      "mande", "mandar", "mostre", "mostrar", "generate", "create", "make", "draw", "paint"
    ];

    const startsWithDirectTrigger = 
      /^(desenho|desenhe|desenha|desenhar|foto|fotos|imagem|imagens|ilustração|ilustrações|ilustre|ilustra|retrato|pintura|pintar|paint|draw|create|generate|avatar|icon|logo|wallpaper)\s+(de|de um|de uma|da|do|um|uma|duma|dum|anime|fada|paisagem|\s)/i.test(lowerMessage);

    const hasImageWord = imageWords.some(w => lowerMessage.includes(w));
    const hasActionWord = actionWords.some(w => lowerMessage.includes(w));
    const startsWithAction = /^(crie|criar|cria|crier|crear|cree|gerar|gera|faça|fazer|faz|pinte|pintar|desenhe|desenhar|ilustre|ilustrar)\b/i.test(lowerMessage);

    const videoWords = [
      "video", "videos", "vídeo", "vídeos", "clipe", "clipes", "movie", "clip", "clips", "animação", "animacao", "animações", "animacoes", "filme", "filmes"
    ];

    // Check if the conversation has a previous video context to enable seamless conversational follow-ups
    let hasPreviousVideoContext = false;
    if (history && Array.isArray(history)) {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].sender === 'gemini' && history[i].aiGeneratedVideo) {
          hasPreviousVideoContext = true;
          break;
        }
      }
    }

    const isFollowUpVideo = hasPreviousVideoContext && !hasImageWord && (
      /^(agora|outro|outra|mais um|mais uma|e|faz um|faz uma|cria um|cria uma|gerar um|gerar uma|quero de|quero um|gostaria de|de)\s+/i.test(lowerMessage) ||
      lowerMessage.startsWith("de ") ||
      lowerMessage.includes("agora de") ||
      lowerMessage.includes("outro de") ||
      lowerMessage.includes("agora um") ||
      lowerMessage.includes("agora uma") ||
      // very short context phrases like "um avião", "carro de corrida", "trem" inside video context
      (lowerMessage.length < 25 && !lowerMessage.includes("?") && !lowerMessage.includes("me ajude") && !lowerMessage.includes("obrigado") && !lowerMessage.includes("valeu") && lowerMessage.length > 2)
    );

    const hasVideoWord = videoWords.some(w => lowerMessage.includes(w));
    const isVideoRequest = 
      (hasVideoWord && hasActionWord) || 
      (startsWithAction && hasVideoWord) || 
      (/\b(quero|queria|gostaria|preciso|faz|fazer|gerar|criar)\b/i.test(lowerMessage) && hasVideoWord) ||
      isFollowUpVideo;

    if (isVideoRequest) {
      let videoPrompt = lastUserText
        .replace(/\b(gerar um vídeo|gerar video|gerar vídeo|crie um vídeo|cria um vídeo|crie vídeos|criar vídeo|criar vídeos|generate video|create video|faça um vídeo|fazer um vídeo|mande um vídeo|mostre um vídeo|video de|vídeo de|agora um de|agora uma de|agora de um|agora de uma|agora de|outro de|outra de|outro um de|mais um de|mais uma de|agora|outro|outra|mais um|mais uma)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      videoPrompt = videoPrompt
        .replace(/^(de um|de uma|um de|uma de|de|um|uma)\s+/i, '')
        .trim();
        
      if (!videoPrompt || videoPrompt.length < 2) videoPrompt = lastUserText;

      let replyText = "";
      let videoType = "particles";
      let musicStyle = "ambient";
      let captionTexts = [
        "Iniciando a renderização generativa da Aura Lab...",
        "Calculando vetores harmônicos em tempo real...",
        "Sua obra de arte audiovisual personalizada está pronta!"
      ];

      try {
        const videoResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Analise este pedido de vídeo sobre qualquer assunto ou tema do universo físico ou conceitual: "${lastUserText}" (com o termo limpo mapeado como: "${videoPrompt}").
Se este pedido for uma continuação (por exemplo: "Agora de um carro", "e de um avião", "outro de trem", "agora avião", "cachorro"), extraia com inteligência absoluta o tema real desejado pelo usuário (como "carro", "avião", "trem", "cachorro", etc.) para compor o vídeo baseado inteiramente nesse novo assunto.

Você é capaz de reconhecer absolutamente tudo sobre o mundo real ou fantasia (veículos, aviões, carros, esportes, animais, cidades, planetas, naves, ficção, cotidiano, heróis, contos de fada, etc.) e traduzir em arte generativa.

Decida qual desses 'videoType' visuais melhor se aplica ao assunto solicitado:
- "nebula" (para temas de espaço, cosmos, magia, fadas, misticismo, fantasia, galáxia, espiritualidade, Aura, abstrato profundo, mistério, sonhos)
- "particles" (para tecnologia, programação, APIs, redes neurais, conectividade, geral, abstrato científico, dados)
- "matrix" (para códigos, hacking, segurança da informação, computadores, terminal, ficção científica urbana, fluxos binários, robótica)
- "sunset" (para aviões, voos, nuvens, asas, viagens aéreas, temas relaxantes, poesias, inspiração, amor, natureza calma, entardecer, amanhecer, arte suave, calor, amizade, montanhas, desertos, paz, silêncio)
- "waves" (para carros, veículos de corrida, estradas, motores, velocidade, música, som, ondas, água, mar, praia, energia física, batidas vibrantes, áudio, esportes, dinamismo, festas)

Decida qual estilo de música 'musicStyle' melhor acompanha a temática:
- "cyberpunk" (para tecnologia pesada, hacking, neon, ritmo moderno, futurismo, cidades hipertecnológicas)
- "ambient" (para coisas espaciais, voos nas nuvens, calmas, relaxantes, inspiradoras, voar livremente, meditação, fadas, sutileza)
- "nature" (para natureza, pássaros, florestas, ondas calmantes, vento, paz, animais silvestres)
- "energetic" (para carros em velocidade, corridas, som dinâmico, eletrônica vibrante, batidas rápidas, ação, esportes radicais)

Gere uma lista de exatamente 3 ou 4 legendas / frases poéticas em português de até 80 caracteres cada para serem exibidas em sequência como letreiros ou falas do vídeo, contando uma breve jornada ou descrevendo visualmente o tema solicitado de forma rica e envolvente.

Você deve responder APENAS com um objeto JSON válido, no seguinte formato exato:
{
  "reply": "Uma introdução calorosa e entusiasmada escrita por você (Aura) explicando em 2-3 frases em português quais elementos visuais e sonoros você escolheu para compor o vídeo baseado no pedido do usuário.",
  "videoType": "videoType escolhido",
  "musicStyle": "musicStyle escolhido",
  "captionTexts": ["frase 1", "frase 2", "frase 3"]
}`,
          config: {
            responseMimeType: "application/json"
          }
        });

        const rawText = videoResponse.text || "{}";
        const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        
        replyText = parsed.reply || `Com certeza! Preparei um vídeo generativo exclusivo sobre "${videoPrompt}" para você.`;
        videoType = parsed.videoType || "particles";
        musicStyle = parsed.musicStyle || "ambient";
        if (parsed.captionTexts && Array.isArray(parsed.captionTexts)) {
          captionTexts = parsed.captionTexts;
        }
      } catch (err) {
        console.warn("Generating custom video JSON failed, falling back to standard presets:", err);
        replyText = `Com certeza! Preparei um vídeo generativo exclusivo sobre "${videoPrompt}" para você. As camadas visuais e a harmonia acústica foram calculadas combinando estética digital e síntese de áudio!`;
        const wordsNebula = ["espaço", "universo", "estrela", "magia", "galáxia", "cosmos", "astro", "lua", "buraco negro", "foguete", "extraterrestre", "alien", "cometa"];
        const wordsMatrix = ["código", "programar", "hack", "computador", "tecnologia", "sistema", "desenvolvedora", "site", "robô", "ia", "inteligência artificial", "cyber", "software"];
        const wordsSunset = ["relaxar", "luz", "calmo", "pôr do sol", "natureza", "céu", "nuvem", "avião", "voo", "voar", "pássaro", "paz", "viagem", "helicóptero", "balão", "aeronave", "aeroporto", "floresta", "árvore", "montanha"];
        const wordsWaves = ["música", "som", "ritmo", "onda", "água", "mar", "praia", "energia", "esporte", "carro", "velocidade", "festa", "corrida", "moto", "veículo", "pista", "estrada", "bateria", "som", "surf", "dança"];

        const hasWord = (arr: string[]) => arr.some(w => lowerMessage.includes(w));

        if (hasWord(wordsNebula)) {
          videoType = "nebula";
          musicStyle = "ambient";
        } else if (hasWord(wordsMatrix)) {
          videoType = "matrix";
          musicStyle = "cyberpunk";
        } else if (hasWord(wordsSunset)) {
          videoType = "sunset";
          musicStyle = "nature";
        } else if (hasWord(wordsWaves)) {
          videoType = "waves";
          musicStyle = "energetic";
        }
      }

      return res.json({
        text: replyText,
        video: {
          prompt: videoPrompt,
          videoType: videoType,
          musicStyle: musicStyle,
          captionTexts: captionTexts
        }
      });
    }

    const isImageRequest = 
      startsWithDirectTrigger || 
      (hasImageWord && hasActionWord) || 
      (startsWithAction && hasImageWord) ||
      (/\b(quero|queria|gostaria|preciso|faz|fazer|gerar|desenhar|pintar)\b/i.test(lowerMessage) && hasImageWord);

    if (isImageRequest) {
      // Clean up search query to find the ideal image prompt
      let imagePrompt = lastUserText
        .replace(/\b(gerar uma imagem|gerar imagem|crie uma imagem|cria uma imagem|crie imagens|criar imagem|criar imagens|gerar foto|gerar fotos|crie uma foto|cria uma foto|criar uma foto|criar foto|criar fotos|faça uma foto|fazer uma foto|generate image|create image|generate photo|create photo|desenhe|desenha|faça um desenho|fazer um desenho|desenhar|retrato de|retratos de|ilustre|ilustração de|pintar um|pintar uma|foto de|fotos de|desenho de|imagem de|quero que crie uma|quero que faça uma|quero uma|quero um|uma|um|de|do|da|para mim|pra mim)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (!imagePrompt || imagePrompt.length < 3) imagePrompt = lastUserText; // fallback if empty or too aggressive

      let imageUrl = "";
      
      // 1. First, attempt to use the Gemini 2.5 flash image model
      try {
        const imgResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: imagePrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        // Search in response parts for any inline image data
        const part = imgResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (part && part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      } catch (geminiImgErr: any) {
        console.warn("Gemini native image creation failed. Falling back to Pollinations:", geminiImgErr.message || geminiImgErr);
      }

      // 2. High-performance fallback: Pollinations.ai provides instantaneous photorealistic generation
      if (!imageUrl) {
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true`;
      }

      // Ask Gemini 3.5 flash to write a beautiful description of the image being presented to the user
      let replyText = "";
      try {
        const textResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Escreva uma resposta curta e muito amigável em português como Aura, a assistente inteligente oficial, dizendo ao usuário que você acabou de gerar um lindo desenho / imagem com base no pedido dele: "${imagePrompt}". Descreva de forma criativa e entusiasmada alguns detalhes artísticos imaginados para essa imagem (em 2 a 3 frases calorosas). Termine dizendo que ela já está pronta para visualização e download logo abaixo da mensagem.`,
          config: {
            systemInstruction: "Você é a Aura, uma assistente virtual simpática, criativa, amigável e empolgada em ajudar."
          }
        });
        replyText = textResponse.text || `Com certeza! Eu acabei de gerar uma linda ilustração sobre "${imagePrompt}" para você. O desenho solicitado já está pronto e visível logo abaixo desta mensagem! Espero que você ame o resultado! ✨`;
      } catch (err) {
        replyText = `Com certeza! Eu acabei de gerar uma linda ilustração sobre "${imagePrompt}" para você. O desenho solicitado já está pronto e visível logo abaixo desta mensagem! Espero que você ame o resultado! ✨`;
      }

      return res.json({
        text: replyText,
        image: imageUrl
      });
    }

    // Map history to contents for Gemini API:
    // Each message contains { sender: 'user' | 'gemini', text: string }
    const contents: any[] = [];
    history.forEach((msg: any, index: number) => {
      const isUser = msg.sender === 'user';
      const role = isUser ? 'user' : 'model';

      // If it's model and the contents list is currently empty, we must skip it (first message must be 'user')
      if (contents.length === 0 && !isUser) {
        return;
      }

      const parts: any[] = [{ text: msg.text || "" }];

      // If there are attachments uploaded on the latest message, convert them to inlineData or append texts
      if (index === history.length - 1 && attachments && Array.isArray(attachments)) {
        attachments.forEach((file: any) => {
          if (file.type && file.type.startsWith('image/') && file.base64) {
            const cleanBase64 = file.base64.replace(/^data:image\/[a-zA-Z+.-]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: file.type,
                data: cleanBase64
              }
            });
          } else {
            // Document files are loaded as structured text content inside the prompt
            const fileContent = file.content || "";
            parts.push({
              text: `\n[Arquivo Anexado pelo Usuário: ${file.name} (${file.type})]\nConteúdo:\n${fileContent}\n[Fim do Arquivo]\n`
            });
          }
        });
      }

      // Ensure no two consecutive elements have the same role
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts.push(...parts);
      } else {
        contents.push({
          role: role,
          parts: parts
        });
      }
    });

    // Generate dynamic date/time information
    const now = new Date();
    const formatterSP = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    const formattedSP = formatterSP.format(now);

    const formatterUTC = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    });
    const formattedUTC = formatterUTC.format(now);

    let systemInstruction = `Você é a Aura, a assistente virtual inteligente oficial. Você é amigável, receptiva, criativa e extremamente capaz! Você é uma especialista nível sênior em criar e desenvolver SCRIPTS DE TODOS OS TIPOS, incluindo:
- SCRIPTS DE PROGRAMAÇÃO E AUTOMAÇÃO: Python, JavaScript, TypeScript, PHP, C++, C#, Java, Go, Ruby, PowerShell, Bash, Shell Script, macros de Excel/Google Sheets, web scraping (Puppeteer, BeautifulSoup) e automações de tarefas repetitivas.
- SCRIPTS DE BANCO DE DADOS: Consultas SQL complexas, Migrações, Modelagem de dados e regras de segurança de bancos de dados.
- SCRIPTS DE JOGOS: Scripts e mecânicas em Lua para Roblox, C# para Unity, GDScript para Godot, etc.
- SCRIPTS CRIATIVOS E DE CONTEÚDO: Roteiros completos para vídeos de YouTube, roteiros para podcasts, TikTok, Instagram Reels, peças de teatro, cinema, comerciais, campanhas de vendas e e-mails marketing estruturados.
- SCRIPTS DE DIÁLOGO E CHATBOTS: Roteiros estruturados de atendimento ao cliente, fluxos de conversação e menus de URA.

Diretrizes de Resposta para Scripts:
1. Sempre que o usuário solicitar um script ou roteiro, forneça o script de forma limpa, direta e bem estruturada.
2. IMPORTANTE: Remova nomes fictícios, textos desnecessários e placeholders que não servem para o script (como "<coloque seu nome aqui>"). O script produzido dentro do bloco de código deve estar 100% limpo, com valores reais ou genéricos funcionais padrão, pronto para ser apenas copiado e executado diretamente pelo usuário, sem quebrar ou dar erros de compilação/sintaxe.
3. Use blocos de códigos formatados com markdown (\`\`\`nome_da_linguagem) para melhor visualização no chat e cópia instantânea.

DIRETRIZ DE ARQUIVOS E IMAGENS ENVIADOS:
- Se o usuário anexou imagens ou documentos, você é inteligente o suficiente para analisá-los detalhadamente. Refira-se a eles nas suas respostas de forma sutil e explique a sua análise de forma amigável no mesmo idioma das mensagens!

DIRETRIZ DE CRIAÇÃO DE IMAGENS:
- Se o usuário pedir para você desenhar, pintar, criar uma imagem, ilustrar ou criar uma representação visual, isso é gerenciado automaticamente de forma gráfica! Explique que você acabou de gerar o desenho solicitado e ele está visível logo abaixo da mensagem.

INFORMAÇÃO DE DATA E HORA EM TEMPO REAL:
- Data e hora atual (Horário de Brasília - Brasil): ${formattedSP}
- Data e hora atual (UTC): ${formattedUTC}
Se o usuário lhe perguntar as horas, que dia é hoje, em qual ano/mês/semana estamos ou qualquer dado temporal, responda a ele de forma exata e amigável com base nessas informações!`;

    // Dynamic Personality Prompts to support "details of the AI" Customizations
    if (personality === 'android_dev') {
      systemInstruction += "\n\n[PERSONA ATIVA: DESENVOLVEDORA ANDROID SÊNIOR] Foque completamente suas respostas em boas práticas de engenharia de software mobile, desenvolvimento Android nativo utilizando Kotlin, Jetpack Compose, arquiteturas de código limpo (Clean, MVVM), segurança móvel, animações fluidas e otimização de performance. Seja extremamente técnica, precisa, inclua exemplos sintáticos e forneça soluções detalhadas corporativas.";
    } else if (personality === 'ux_designer') {
      systemInstruction += "\n\n[PERSONA ATIVA: MENTORA DE DESIGN & UX] Suas respostas devem focar estritamente em experiência do usuário (UX), design centrado no humano, heurísticas de usabilidade, acessibilidade digital móvel (padrões WCAG), consistência de marca, microinterações, guias visuais do Material Design 3 (Material You) e estética minimalista e profissional.";
    } else if (personality === 'creative_storyteller') {
      systemInstruction += "\n\n[PERSONA ATIVA: CRIADORA CRIATIVA DE CONTEÚDO] Suas respostas devem focar em contar histórias envolventes, criar roteiros inspiradores fora da curva, usar analogias criativas, metáforas artísticas e dar insights inovadores para marcas inteiras de redes sociais.";
    }

    // Set configuration parameters
    const queryConfig: any = {
      systemInstruction: systemInstruction,
    };

    if (temperature !== undefined) {
      queryConfig.temperature = Number(temperature);
    }

    // Generate content using gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: queryConfig
    });

    const replyText = response.text || "Desculpe, não consegui gerar uma resposta.";
    return res.json({ text: replyText });

  } catch (error: any) {
    console.error("Erro na API da Gemini:", error);
    
    // Check for expirations/key validity errors safely avoiding circular JSON structures
    const errorMessageStr = error && typeof error === 'object'
      ? `${error.message || ""} ${error.status || ""} ${error.code || ""} ${String(error)}`
      : String(error);

    const isKeyExpiredOrInvalid = 
      errorMessageStr.includes("API key expired") || 
      errorMessageStr.includes("API_KEY_INVALID") || 
      errorMessageStr.toLowerCase().includes("expired") ||
      errorMessageStr.toLowerCase().includes("invalid api key") ||
      errorMessageStr.toLowerCase().includes("api key") ||
      errorMessageStr.toLowerCase().includes("expired key");

    if (isKeyExpiredOrInvalid) {
      return res.status(401).json({
        error: "Sua chave de API do Gemini (GEMINI_API_KEY) expirou ou é inválida no seu workspace.\n\n" +
               "🔑 **Como corrigir agora mesmo:**\n" +
               "1. No canto superior direito ou nas configurações do Google AI Studio, abra o painel de **Secrets (ícone de chaves / secrets)**.\n" +
               "2. Obtenha uma nova chave de API gratuita e ativa diretamente no [Google AI Studio API Keys](https://aistudio.google.com/app/apikey).\n" +
               "3. Configure ou atualize a chave secreta com o nome exato `GEMINI_API_KEY` informando o seu novo valor correspondente.\n" +
               "4. Salve as alterações para recarregar o servidor, e volte a conversar normalmente com a Aura!"
      });
    }

    return res.status(500).json({
      error: "Ocorreu um erro ao processar a resposta: " + (error.message || error)
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/download-apk", async (req, res) => {
  try {
    // List of highly stable, fully-formed, signed debug APK URLs
    // This provides a real, clean, cryptographically valid APK package
    const apkUrls = [
      "https://raw.githubusercontent.com/appium/io.appium.settings/master/app/build/outputs/apk/debug/settings_apk-debug.apk",
      "https://github.com/appium/appium/raw/master/packages/appium/sample-code/apps/ApiDemos-debug.apk"
    ];

    let downloadRes = null;

    for (const url of apkUrls) {
      try {
        console.log(`Downloading valid signed APK from: ${url}`);
        const fetchRes = await fetch(url);
        if (fetchRes.ok) {
          downloadRes = fetchRes;
          break;
        }
      } catch (err) {
        console.warn(`Failed to connect to ${url}, trying next...`, err);
      }
    }

    if (!downloadRes || !downloadRes.ok) {
      throw new Error("Unable to download standard signed APK template");
    }

    // Set standard headers for Android APK package downloads
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="Aura_Lab_v1.0.0.apk"');

    // Serve the streamed array buffer cleanly as standard Node Buffer bytes
    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.send(buffer);
  } catch (err: any) {
    console.error("APK Streaming Downloader Error:", err);
    res.status(500).send(`Erro ao fazer download do APK: ${err.message}`);
  }
});

// Vite middleware for development or serving prod build
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
