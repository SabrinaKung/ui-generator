// app/api/generate/route.ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { generateMessages, generateReviseMessages } from '@/app/server/llm/prompts';
import { GenerateRequest } from '@/app/server/llm/types';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const input: GenerateRequest = await req.json();

        if (!input.textInput) {
            return new Response(
                JSON.stringify({ error: 'Text input is required' }),
                { status: 400 }
            );
        }

        const messages = generateMessages(
            input.textInput,
            input.imageInput,
            input.previousCode
        );

        const result = await generateText({
            model: openai('gpt-4-turbo'),
            messages,
        });
        // console.log("result", result.text)
        // return Response.json(result.text);
        const codeMatch = result.text.match(/```(?:javascript|jsx)?\n([\s\S]*?)```/);
        const code = codeMatch ? codeMatch[1].trim() : result.text;
        // console.log(code);

        const reviseMessages = generateReviseMessages(code)

        const revisedResult = await generateText({
            model: openai('gpt-4-turbo'),
            messages: reviseMessages,
        });

        const revisedCodeMatch = revisedResult.text.match(/```(?:javascript|jsx)?\n([\s\S]*?)```/);
        const revisedCode = revisedCodeMatch ? revisedCodeMatch[1].trim() : revisedResult.text;

        return new Response(
            JSON.stringify({ code: revisedCode }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

    } catch (error) {
        console.error('Generation Error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to generate component' }),
            { status: 500 }
        );
    }
}