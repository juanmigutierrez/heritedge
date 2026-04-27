import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialize the client pointing to the GitHub Models endpoint
// It will automatically use the GITHUB_TOKEN from your .env file
const ai = new OpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: process.env.GITHUB_TOKEN 
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Calling Llama 3.3 70B via GitHub Models
    const response = await ai.chat.completions.create({
      model: 'Llama-3.3-70B-Instruct',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful historical assistant for the HeritEdge AR application, guiding users through Piazza Duomo in Milan.' 
        },
        { 
          role: 'user', 
          content: message 
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = response.choices[0].message.content;

    return res.status(200).json({ 
      success: true, 
      reply 
    });

  } catch (error) {
    console.error('Error generating chat response:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Llama 3 API' 
    });
  }
});

export { router as chatRouter };