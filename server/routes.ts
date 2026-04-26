// ─── API routes ─────────────────────────────────────────────────────────────
// Wave 23.35 (single backend = Nova8 cloud only)
//
// ALL auth and domain-data routes have been removed from this Express backend.
// The app uses @nova8/backend for everything:
//   - Auth: @nova8/backend/auth (signInWithEmail, signInWithApple, etc.)
//   - Data: @nova8/backend/db (db.list, db.create, db.update, db.remove, db.query)
//
// This sandbox backend ONLY handles stateless proxy/compute routes that don't
// own user data — specifically `/vision/analyze` which shells out to OpenAI
// vision. The endpoint is kept here because it requires OPENAI_API_KEY in
// process.env (server-scope secret) and can't run from the client bundle.

import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();

// ── Health ────────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Vision (OpenAI GPT-4o image analysis) ─────────────────────────────────
router.post('/vision/analyze', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mode } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 required' });
    }

    // Log image received
    const sizeKb = Math.round(imageBase64.length / 1024);
    console.log(`[vision] image received, size: ${sizeKb}KB`);

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn('[vision] OPENAI_API_KEY not set — returning fallback data with low confidence');
      // Fallback to safe defaults when no API key
      if (mode === 'label') {
        return res.json({
          servingSize: '1 serving (100g)',
          caloriesPerServing: 200,
          proteinG: 8,
          carbsG: 30,
          fatG: 5,
          sodiumMg: 300,
          aiConfidence: 'low',
        });
      }
      return res.json({
        meal: {
          name: 'Unknown Meal',
          totalCalories: 500,
          proteinG: 25,
          carbsG: 50,
          fatG: 15,
          items: [],
        },
        aiConfidence: 'low',
      });
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    if (mode === 'label') {
      // Analyze nutrition label
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert analyzing food labels. Return only valid JSON. Provide your best educated estimate even when uncertain — never return null for any field, and default unknown macros to reasonable population averages.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract nutrition facts from this food label image. Return only a JSON object with the shape: { "servingSize": "serving size text", "caloriesPerServing": number, "proteinG": number, "carbsG": number, "fatG": number, "sodiumMg": number }. Never return null — provide your best estimate for all fields.`,
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      console.log('[vision] OpenAI response received (label mode)');
      const content = completion.choices[0]?.message?.content?.trim() || '{}';
      const parsed = JSON.parse(content);
      return res.json({ ...parsed, aiConfidence: 'high' });
    }

    // Default: analyze food meal
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert. Analyze the food in this image and return only a JSON object with the shape { "name", "totalCalories", "proteinG", "carbsG", "fatG", "items": [{ "name", "calories", "proteinG", "carbsG", "fatG", "quantity", "unit" }] }. Provide your best educated estimate even when uncertain — never return null for any field, and default unknown macros to reasonable population averages.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this food image and identify all food items with their nutritional content. Return only a JSON object with the exact structure: { "meal": { "name": "brief meal name", "totalCalories": number, "proteinG": number, "carbsG": number, "fatG": number, "items": [{ "name": "food item name", "calories": number, "proteinG": number, "carbsG": number, "fatG": number, "quantity": number, "unit": "g or ml or serving" }] } }. Never return null — provide your best estimate for all fields.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    console.log('[vision] OpenAI response received (food mode)');
    const content = completion.choices[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(content);
    return res.json({ ...parsed, aiConfidence: 'high' });
  } catch (err: any) {
    console.error('[vision] error:', err?.message || err);
    // Return HTTP 200 with safe fallback so the client never crashes
    return res.json({
      meal: {
        name: 'Unknown Meal',
        totalCalories: 500,
        proteinG: 25,
        carbsG: 50,
        fatG: 15,
        items: [],
      },
      aiConfidence: 'low',
    });
  }
});

export default router;
