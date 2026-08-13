import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor(private readonly prisma: PrismaService) {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: 'gemini-embedding-2',
    });
  }

  async learnFromText(text: string, source: string, pageId?: string) {
    this.logger.log(`Learning from text for source: ${source}, pageId: ${pageId || 'global'}`);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
      separators: ['\\n==================================================\\n', '\\n# ', '\\n\\n', '\\n', ' '],
    });

    const docs = await splitter.createDocuments([text]);
    let chunksAdded = 0;

    for (let i = 0; i < docs.length; i++) {
      const chunk = docs[i];
      const vector = await this.embeddings.embedQuery(chunk.pageContent);
      const vectorString = `[${vector.join(',')}]`;
      const metadataObj: any = { source };
      if (pageId) metadataObj.pageId = pageId;
      const metadataString = JSON.stringify(metadataObj);

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO knowledge_documents (id, content, metadata, embedding) VALUES (gen_random_uuid(), $1, $2::jsonb, $3::vector)`,
        chunk.pageContent,
        metadataString,
        vectorString
      );
      chunksAdded++;
    }

    this.logger.log(`Learned ${chunksAdded} chunks for source: ${source}`);
    return { chunksAdded };
  }

  async getSources(pageId?: string) {
    let query = `SELECT DISTINCT metadata->>'source' AS source FROM knowledge_documents WHERE metadata->>'source' IS NOT NULL`;
    const params: any[] = [];
    if (pageId) {
      query += ` AND metadata->>'pageId' = $1`;
      params.push(pageId);
    }
    const result = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);
    return result.map(r => r.source);
  }

  async deleteBySource(source: string, pageId?: string) {
    let query = `DELETE FROM knowledge_documents WHERE metadata->>'source' = $1`;
    const params: any[] = [source];
    if (pageId) {
      query += ` AND metadata->>'pageId' = $2`;
      params.push(pageId);
    }
    const res = await this.prisma.$executeRawUnsafe(query, ...params);
    this.logger.log(`Deleted chunks for source: ${source}, pageId: ${pageId || 'global'}`);
    return res;
  }
}
