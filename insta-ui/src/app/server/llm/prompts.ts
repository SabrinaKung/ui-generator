// app/server/llm/prompts.ts
import { Message } from './types';

export function generateMessages(textInput: string, imageInput?: string, previousCode?: string): Message[] {
    const messages: Message[] = [
        {
            role: 'system',
            content: `You are a React component generator. Generate only valid, compilable React code. 
      Follow these requirements:
      - Use only React and standard packages
      - Component must be compilable
      - Include 'import React' at the start
      - Use 'export default' for the component
      - Ensure proper JSX syntax`
        },
        {
            role: 'user',
            content: `Create a React component based on this description: ${textInput}`
        }
    ];

    if (imageInput) {
        messages.push({
            role: 'user',
            content: `Include visual elements similar to this image: ${imageInput}`
        });
    }

    if (previousCode) {
        messages.push({
            role: 'user',
            content: `Modify this previous code: ${previousCode}`
        });
    }

    return messages;
};

export function generateReviseMessages(code: string): Message[] {
    const messages: Message[] = [
        {
            role: 'system',
            content: `You are a React component code debugger. Keep the original structure and style of the code as much as possible, detect any errors, and change it into valid, compilable React code.  
      Follow these requirements:
      - Use only React and standard packages
      - Component must be compilable
      - Include 'import React' at the start
      - Use 'export default' for the component
      - Ensure proper JSX syntax`
        },
        {
            role: 'user',
            content: `Revise the provided code: ${code}`
        }
    ];

    return messages;
};
