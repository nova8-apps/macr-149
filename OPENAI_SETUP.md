# OpenAI Vision Setup

The app uses OpenAI's GPT-4o model to analyze food images and extract nutritional information.

## Setup Instructions

1. Get your OpenAI API key from https://platform.openai.com/api-keys
2. Add it to your environment variables:

### For local development:
Create a `.env` file in the project root:
```bash
OPENAI_API_KEY=sk-proj-your-key-here
```

### For production (Nova8 deployment):
Add the environment variable in the Nova8 dashboard under "Backend" scope.

## How it works

When you scan food:
1. The camera captures a photo with base64 encoding
2. The image is sent to `/api/vision/analyze` endpoint
3. The backend calls OpenAI GPT-4o with the image
4. OpenAI returns structured JSON with:
   - Meal name
   - Total calories
   - Protein, carbs, and fat breakdown
   - Individual food items with their nutritional values
5. The app displays the results for review before saving

## Fallback behavior

If `OPENAI_API_KEY` is not set, the backend will:
- Log a warning: `[vision] OPENAI_API_KEY not set — returning mock data`
- Return mock nutritional data so the app continues working
- You can still test the flow without an API key

## Cost

GPT-4o vision costs approximately:
- $0.01-0.02 per image analysis
- Most scans complete in 2-5 seconds

Monitor your usage at https://platform.openai.com/usage
