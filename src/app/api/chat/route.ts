import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildPrompt } from '@/lib/prompts';
import { Message, Brief, Phase } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, phase, brief } = body as {
      messages: Message[];
      phase: Phase;
      brief: Brief;
    };

    // Build the system prompt with current context
    const systemPrompt = buildPrompt(phase, brief as unknown as Record<string, string>);

    // Convert to OpenAI format
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || 'I encountered an error. Please try again.';

    return NextResponse.json({
      message: responseText,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
