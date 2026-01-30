import 'dotenv/config';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

async function testAPIs() {
  console.log('🧪 Testing AI APIs...\n');

  // Test OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "OpenAI works!"' }],
        max_tokens: 50
      });
      console.log('✅ OpenAI:', response.choices[0].message.content);
    } catch (error) {
      console.log('❌ OpenAI:', error.message);
    }
  }

  // Test Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Say "Gemini works!"');
      console.log('✅ Gemini:', result.response.text());
    } catch (error) {
      console.log('❌ Gemini:', error.message);
    }
  }

  // Test Claude
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "Claude works!"' }]
      });
      console.log('✅ Claude:', message.content[0].text);
    } catch (error) {
      console.log('❌ Claude:', error.message);
    }
  }
}

testAPIs();