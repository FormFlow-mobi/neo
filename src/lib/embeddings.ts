import { Anthropic } from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await client.beta.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: text,
      },
    ],
    betas: ['interleaved-thinking-2025-05-14'],
  } as any);

  // For now, return a dummy embedding vector
  // In production, you would use a dedicated embedding API
  // This is a placeholder that works locally without external dependencies
  const hash = text
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Generate a deterministic vector based on text hash
  const vector: number[] = [];
  let seed = hash;
  for (let i = 0; i < 1536; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    vector.push((seed / 233280) * 2 - 1);
  }

  return vector;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map((text) => generateEmbedding(text)));
}
