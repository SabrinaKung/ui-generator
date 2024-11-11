// app/api/generate/route.ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { generateMessages } from '@/app/server/llm/prompts';
import { GenerateRequest } from '@/app/server/llm/types';
import * as babelParser from '@babel/parser';

import { ESLint, Linter } from "eslint";

// 創建 ESLint 實例，並應用配置
function createESLintInstance(overrideConfig: Linter.Config): ESLint {
  return new ESLint();
}

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
        const maxRetries = 1; // 設定最大嘗試次數

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
                // const code = codeMatch ? codeMatch[1].trim() : result.text;

                const code = `import React, { useState } from 'react';

                export default function HoverButton() {
                const [loading, setLoading] = useState(false);

                const handleClick = () => {
                    setLoading(true);
                    // Simulate a network request or some processing
                    setTimeout(() => {
                    setLoading(false);
                    }, 2000);
                };

                const buttonStyle = {
                    backgroundColor: loading ? '#ccc' : '#007BFF',
                    color: '#fff',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    outline: 'none',
                };

                return (
                    <button
                    style={buttonStyle}
                    onClick={handleClick}
                    onMouseOver={() => (buttonStyle.backgroundColor = '#0056b3')}
                    onMouseOut={() => (buttonStyle.backgroundColor = loading ? '#ccc' : '#007BFF')}
                    >
                    {loading ? <span>Loading...</span> : <span>Click Me</span>}
                    </button>
                );
                }`


                // Parsing the code using Babel to check for syntax errors
                babelParser.parse(code, {
                    sourceType: 'module',
                    plugins: ['jsx']  // Enable JSX parsing for React code
                });

                const overrideConfig: Linter.Config = {
                    languageOptions: {
                      ecmaVersion: 2018,
                      sourceType: "commonjs",
                    },
                    rules: {
                      "no-console": "error",
                      "no-unused-vars": "warn",
                    },
                };
                
                // console.log(code)
                const eslint = createESLintInstance(overrideConfig);
                const results = await eslint.lintText(code);
                const hasErrors = results.some(result => result.errorCount > 0);

                if (hasErrors) {
                    console.log(results.map(result => result.messages.map(msg => msg.message)).flat());
                    throw new Error('Eslint not pass.');
                }

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
                console.error(`Syntax validation error (attempt ${attempts}): `, error);
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