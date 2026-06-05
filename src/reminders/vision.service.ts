import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedReminder {
  summary: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(this.configService.get<string>('GEMINI_API_KEY')!);
  }

  async extractReminderFromImage(image: string, mediaType: string): Promise<ExtractedReminder> {
    this.logger.log(`Extracting reminder from image (mediaType=${mediaType})`);

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: { data: image, mimeType: mediaType },
      },
      `Analise esta imagem e extraia informações de evento ou lembrete.
Retorne APENAS um JSON com:
- summary: título do evento
- description: detalhes adicionais (opcional)
- date: data no formato DD/MM/YYYY
- startTime: horário de início HH:MM
- endTime: horário de fim HH:MM (se não houver, some 1h ao início)
Omita campos ausentes. Retorne só o JSON, sem texto adicional.`,
    ]);

    const text = result.response.text();
    this.logger.log(`Gemini raw response: ${text}`);

    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    try {
      const parsed = JSON.parse(clean) as ExtractedReminder;
      if (!parsed.summary) {
        throw new BadRequestException('Não foi possível identificar um título para o lembrete nesta imagem.');
      }
      return parsed;
    } catch {
      throw new BadRequestException('Não foi possível extrair informações de lembrete desta imagem.');
    }
  }
}
