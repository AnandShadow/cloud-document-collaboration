const express = require('express');
const axios = require('axios');
const router = express.Router();

// ============================================
// ADVANCED AI ENDPOINT
// Handles complex tasks: rewriting, document generation, suggestions, etc.
// ============================================

router.post('/api/ai/advanced', async (req, res) => {
    try {
        const { 
            text, 
            task, // 'rewrite', 'generate', 'suggest_alternatives', 'expand', 'summarize', 'improve', 'tone_change'
            prompt, // For 'generate' task - what user wants to create
            toneTarget = 'professional', // professional, casual, academic, creative, persuasive
            length = 'medium', // short, medium, long
            context = '' // Additional context/instructions
        } = req.body;

        console.log('🤖 Advanced AI request:', { task, toneTarget, length, textLength: text?.length || 0 });

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        if (!GROQ_API_KEY && !OPENAI_API_KEY) {
            return res.status(500).json({ 
                success: false, 
                error: 'AI service not configured. Please add GROQ_API_KEY or OPENAI_API_KEY to environment.' 
            });
        }

        let systemPrompt = '';
        let userMessage = '';

        // Build prompts based on task
        switch (task) {
            case 'generate':
                systemPrompt = `You are a professional content writer. Generate well-structured, engaging documents based on user prompts. 
                Include proper headings, paragraphs, and formatting. Be creative but accurate.
                Tone: ${toneTarget}. Length: ${length}.`;
                userMessage = `Create a complete document about: ${prompt}\n\nAdditional context: ${context}\n\nGenerate a well-structured document with headings, subheadings, and detailed content.`;
                break;

            case 'rewrite':
                systemPrompt = `You are an expert editor. Rewrite the given text to improve clarity, flow, and impact while preserving the core message.
                Tone: ${toneTarget}. Make it ${length === 'short' ? 'concise' : length === 'long' ? 'detailed and comprehensive' : 'balanced'}.`;
                userMessage = `Rewrite this text:\n\n${text}\n\nAdditional instructions: ${context}`;
                break;

            case 'suggest_alternatives':
                systemPrompt = `You are a creative writing assistant. Provide 3-5 alternative ways to express the same idea, each with a different style or approach.
                Return a JSON array of alternatives with: { version: "Alternative 1", text: "...", style: "formal/casual/creative/etc", explanation: "why this works" }`;
                userMessage = `Suggest alternative ways to write this:\n\n${text}\n\nTarget tone: ${toneTarget}`;
                break;

            case 'expand':
                systemPrompt = `You are a content expansion specialist. Take the given text and expand it with more details, examples, explanations, and context.
                Add depth without losing focus. Tone: ${toneTarget}.`;
                userMessage = `Expand this text with more details and examples:\n\n${text}\n\nContext: ${context}`;
                break;

            case 'summarize':
                systemPrompt = `You are a summarization expert. Create a clear, concise summary that captures the key points.
                Length: ${length === 'short' ? '1-2 sentences' : length === 'long' ? 'detailed paragraph' : '2-3 sentences'}.`;
                userMessage = `Summarize this text:\n\n${text}`;
                break;

            case 'improve':
                systemPrompt = `You are a professional editor. Improve the given text by:
                - Fixing grammar and spelling
                - Enhancing clarity and flow
                - Strengthening word choice
                - Improving sentence structure
                - Making it more engaging
                Maintain the original tone: ${toneTarget}.`;
                userMessage = `Improve this text:\n\n${text}\n\nFocus on: ${context || 'overall quality'}`;
                break;

            case 'tone_change':
                systemPrompt = `You are a tone transformation expert. Rewrite the text to match the target tone while keeping the same information.
                Target tone: ${toneTarget}.`;
                userMessage = `Change the tone of this text to ${toneTarget}:\n\n${text}`;
                break;

            case 'complete':
                systemPrompt = `You are a smart writing assistant. Complete the given text naturally, maintaining the style, tone, and context.
                Add ${length === 'short' ? '1-2 sentences' : length === 'long' ? 'several paragraphs' : '2-3 sentences'}.`;
                userMessage = `Complete this text:\n\n${text}\n\nContext: ${context}`;
                break;

            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid task. Use: generate, rewrite, suggest_alternatives, expand, summarize, improve, tone_change, or complete' 
                });
        }

        // Try Groq first (faster and free)
        let result = null;
        let provider = 'groq';

        if (GROQ_API_KEY) {
            try {
                const groqResponse = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.1-70b-versatile', // Large model for complex tasks
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userMessage }
                        ],
                        max_tokens: length === 'short' ? 500 : length === 'long' ? 2000 : 1000,
                        temperature: task === 'suggest_alternatives' || task === 'generate' ? 0.7 : 0.3 // Higher for creative tasks
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${GROQ_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000
                    }
                );

                result = groqResponse.data?.choices?.[0]?.message?.content || '';
                console.log('✅ Groq advanced AI response received');
            } catch (groqError) {
                console.error('❌ Groq advanced AI error:', groqError.message);
                
                // Fallback to OpenAI if Groq fails
                if (OPENAI_API_KEY) {
                    provider = 'openai';
                    const openaiResponse = await axios.post(
                        'https://api.openai.com/v1/chat/completions',
                        {
                            model: 'gpt-4',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userMessage }
                            ],
                            max_tokens: length === 'short' ? 500 : length === 'long' ? 2000 : 1000,
                            temperature: task === 'suggest_alternatives' || task === 'generate' ? 0.7 : 0.3
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 60000
                        }
                    );

                    result = openaiResponse.data?.choices?.[0]?.message?.content || '';
                    console.log('✅ OpenAI advanced AI response received (fallback)');
                }
            }
        } else if (OPENAI_API_KEY) {
            provider = 'openai';
            const openaiResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    max_tokens: length === 'short' ? 500 : length === 'long' ? 2000 : 1000,
                    temperature: task === 'suggest_alternatives' || task === 'generate' ? 0.7 : 0.3
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000
                }
            );

            result = openaiResponse.data?.choices?.[0]?.message?.content || '';
            console.log('✅ OpenAI advanced AI response received');
        }

        if (!result) {
            throw new Error('No AI response received');
        }

        // Try to parse JSON if task expects it
        let parsedResult = result;
        if (task === 'suggest_alternatives') {
            try {
                // Extract JSON from markdown code blocks if present
                const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    parsedResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                }
            } catch (e) {
                console.log('Could not parse JSON, returning raw text');
            }
        }

        res.json({
            success: true,
            provider,
            task,
            result: parsedResult,
            metadata: {
                tone: toneTarget,
                length,
                originalLength: text?.length || 0,
                resultLength: typeof result === 'string' ? result.length : JSON.stringify(result).length
            }
        });

    } catch (error) {
        console.error('❌ Advanced AI error:', error.message);
        res.status(500).json({
            success: false,
            error: 'AI processing failed: ' + error.message
        });
    }
});

// ============================================
// SMART DOCUMENT ASSISTANT
// Analyzes document and provides intelligent suggestions
// ============================================

router.post('/api/ai/analyze', async (req, res) => {
    try {
        const { text, docTitle = 'Untitled Document' } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'No text provided' });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            return res.status(500).json({ success: false, error: 'AI service not configured' });
        }

        console.log('🔍 Analyzing document:', docTitle);

        const systemPrompt = `You are a document analysis expert. Analyze the given document and provide a comprehensive JSON response with:
        {
            "readability_score": 0-100,
            "tone": "professional/casual/academic/etc",
            "word_count": number,
            "estimated_reading_time": "X minutes",
            "strengths": ["strength 1", "strength 2"],
            "improvements": [
                {
                    "type": "structure/clarity/grammar/style",
                    "issue": "description",
                    "suggestion": "how to fix",
                    "priority": "high/medium/low"
                }
            ],
            "keywords": ["keyword1", "keyword2"],
            "summary": "brief summary",
            "suggestions": {
                "title": "suggested better title",
                "opening": "suggested opening paragraph",
                "closing": "suggested closing paragraph"
            }
        }`;

        const userMessage = `Analyze this document titled "${docTitle}":\n\n${text}`;

        const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 1500,
                temperature: 0.2
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        let result = groqResponse.data?.choices?.[0]?.message?.content || '';
        
        // Parse JSON response
        try {
            const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
        } catch (e) {
            console.log('Could not parse JSON analysis, returning raw text');
        }

        res.json({
            success: true,
            analysis: result
        });

    } catch (error) {
        console.error('❌ Document analysis error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Analysis failed: ' + error.message
        });
    }
});

module.exports = router;
