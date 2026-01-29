import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, source } = body as { text: string; source: string };

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Use OpenAI to extract brief elements from the pasted text
    const extractionPrompt = `Analyze this text and extract any research brief elements you can find. The user pasted this from ${source}. Return a JSON object with these fields (use empty string if not found):

- businessProblem: The business challenge or question driving the research
- businessObjective: The measurable business outcome desired
- researchObjective: What the research specifically needs to deliver
- knowledgeGap: What is currently unknown that the research needs to answer
- targetAudience: Who the research should focus on

Text:
${text.slice(0, 8000)}

Return ONLY valid JSON, no markdown or explanation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a research brief parser. Extract brief elements from text and return JSON.' },
        { role: 'user', content: extractionPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Parse the JSON response
    let brief = {};
    try {
      // Remove any markdown code blocks if present
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      brief = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse extraction response:', responseText);
    }

    return NextResponse.json({
      brief,
      source,
    });
  } catch (error) {
    console.error('Parse brief API error:', error);
    return NextResponse.json(
      { error: 'Failed to parse text' },
      { status: 500 }
    );
  }
}
