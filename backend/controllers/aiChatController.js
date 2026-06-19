const OpenAI = require('openai');

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'A non-empty message is required' });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant embedded in a multi-tenant task management system. ' +
            'You help users with questions about tasks, system usage, workflow guidance, and general assistance. ' +
            'Keep answers concise and practical.',
        },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.json({ success: true, reply });
  } catch (err) {
    console.error('AI Chat error:', err.message);
    return res.status(500).json({ success: false, message: 'AI service error: ' + err.message });
  }
};
