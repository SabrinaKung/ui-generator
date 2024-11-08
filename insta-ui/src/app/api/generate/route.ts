// app/api/generate/route.ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { generateMessages } from '@/app/server/llm/prompts';
import { GenerateRequest } from '@/app/server/llm/types';
import * as babelParser from '@babel/parser';
import { error } from 'console';

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

        let attempts = 0; // 紀錄嘗試次數
        const maxRetries = 3; // 設定最大嘗試次數

        while (attempts < maxRetries) {
            try {
                attempts++;
                const result = await generateText({
                    model: openai('gpt-4-turbo'),
                    messages,
                });
                // console.log("result", result.text)
                // return Response.json(result.text);
                const codeMatch = result.text.match(/```(?:javascript|jsx)?\n([\s\S]*?)```/);
                const code = codeMatch ? codeMatch[1].trim() : result.text;

                // fake data for babel check
                // const code = `
                //     function testComponent() {
                //         return (
                //             <div>
                //                 <h1>Hello, world!</h1>
                //                 <p>This is a test component with a syntax error!</p>
                //             </div
                //         );
                //     }
                // `;

                // Parsing the code using Babel to check for syntax errors
                babelParser.parse(code, {
                    sourceType: 'module',
                    plugins: ['jsx']  // Enable JSX parsing for React code
                });

                return new Response(
                    JSON.stringify({ code }),
                    {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } catch (error) {
                console.error(`Syntax validation error (attempt ${attempts}) :`, error);
            }
        }
        throw new Error('Model generation exceed maximum attempts.')
    } catch (error) {
        console.error('Generation Error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to generate component' }),
            { status: 500 }
        );
    }
}