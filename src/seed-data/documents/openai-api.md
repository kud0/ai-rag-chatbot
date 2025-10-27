# OpenAI API: Complete Developer Guide

## Introduction

The OpenAI API provides access to powerful language models like GPT-4, GPT-3.5, and specialized models for embeddings, image generation, and text-to-speech. This guide covers everything you need to build AI-powered applications using OpenAI's API.

## Getting Started

### Installation

```bash
npm install openai
# or
yarn add openai
# or
pnpm add openai
```

### Authentication

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Never hardcode API keys!
})
```

**Best practice**: Store API keys in environment variables, never commit them to version control.

## Chat Completions

The Chat Completions API is the primary interface for conversational AI.

### Basic Usage

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is machine learning?" }
  ],
})

console.log(completion.choices[0].message.content)
```

### Message Roles

**System**: Sets the behavior and personality of the assistant
```typescript
{ role: "system", content: "You are a Python expert who explains concepts simply." }
```

**User**: The user's input/question
```typescript
{ role: "user", content: "How do I read a file in Python?" }
```

**Assistant**: The AI's response (used in conversation history)
```typescript
{ role: "assistant", content: "You can use the open() function..." }
```

### Multi-Turn Conversations

Maintain conversation context by including message history:

```typescript
const messages = [
  { role: "system", content: "You are a helpful coding assistant." },
  { role: "user", content: "Write a function to reverse a string" },
  { role: "assistant", content: "Here's a function:\n```python\ndef reverse_string(s):\n    return s[::-1]\n```" },
  { role: "user", content: "Now make it work for lists too" }
]

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: messages,
})

// Add response to history for next turn
messages.push(completion.choices[0].message)
```

### Streaming Responses

Stream responses token-by-token for better UX:

```typescript
const stream = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Tell me a story" }],
  stream: true,
})

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || ""
  process.stdout.write(content)
}
```

### Advanced Parameters

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: messages,

  // Temperature: 0 = deterministic, 2 = creative
  temperature: 0.7,

  // Max tokens in response
  max_tokens: 500,

  // Top-p sampling (0.1 = only top 10% probable tokens)
  top_p: 0.9,

  // Frequency penalty: reduce repetition (-2.0 to 2.0)
  frequency_penalty: 0.3,

  // Presence penalty: encourage new topics (-2.0 to 2.0)
  presence_penalty: 0.6,

  // Stop sequences
  stop: ["\n\n", "END"],

  // Number of completions to generate
  n: 1,

  // Return log probabilities
  logprobs: true,
  top_logprobs: 3,
})
```

## Model Selection

### GPT-4 Models

**gpt-4-turbo** (Recommended for most use cases)
- Context: 128K tokens
- Training: Up to December 2023
- Best for: Complex tasks, reasoning, coding
- Cost: Higher

**gpt-4**
- Context: 8K tokens
- Training: Up to September 2021
- Best for: Complex tasks requiring high accuracy
- Cost: Highest

### GPT-3.5 Models

**gpt-3.5-turbo** (Best for simple tasks)
- Context: 16K tokens
- Training: Up to September 2021
- Best for: Simple tasks, chatbots, quick responses
- Cost: Lower

## Embeddings

Convert text into numerical vectors for semantic search and similarity.

### Creating Embeddings

```typescript
const response = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: "Machine learning is transforming technology",
})

const embedding = response.data[0].embedding
// Returns: Float array with 1536 dimensions
// [0.0234, -0.0891, 0.0445, ..., 0.0102]
```

### Embedding Models

**text-embedding-3-small** (Recommended)
- Dimensions: 1536
- Cost: Lower
- Performance: Good
- Best for: Most use cases

**text-embedding-3-large**
- Dimensions: 3072
- Cost: Higher
- Performance: Best
- Best for: Maximum accuracy needed

**text-embedding-ada-002** (Legacy)
- Dimensions: 1536
- Cost: Lower
- Performance: Good
- Status: Deprecated, use v3 models

### Batch Embeddings

Process multiple texts efficiently:

```typescript
const texts = [
  "First document",
  "Second document",
  "Third document"
]

const response = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: texts, // Array of strings
})

const embeddings = response.data.map(item => item.embedding)
```

### Similarity Calculation

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

const similarity = cosineSimilarity(embedding1, embedding2)
// Returns: 0 to 1 (1 = identical, 0 = unrelated)
```

## Function Calling

Enable models to call external functions/APIs.

### Defining Functions

```typescript
const tools = [{
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather in a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g., San Francisco, CA"
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"]
        }
      },
      required: ["location"]
    }
  }
}]

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "What's the weather in Boston?" }],
  tools: tools,
  tool_choice: "auto", // Let model decide when to call
})
```

### Handling Function Calls

```typescript
const message = completion.choices[0].message

if (message.tool_calls) {
  for (const toolCall of message.tool_calls) {
    if (toolCall.function.name === "get_weather") {
      const args = JSON.parse(toolCall.function.arguments)

      // Call your actual function
      const weather = await getWeather(args.location, args.unit)

      // Send result back to model
      const secondCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          ...messages,
          message,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(weather)
          }
        ]
      })
    }
  }
}
```

## Vision (GPT-4 Vision)

Analyze images with GPT-4 Vision:

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        {
          type: "image_url",
          image_url: {
            url: "https://example.com/image.jpg",
            // or use base64: "data:image/jpeg;base64,..."
            detail: "high" // "low", "high", or "auto"
          }
        }
      ]
    }
  ],
  max_tokens: 300,
})
```

## Text-to-Speech (TTS)

Convert text to spoken audio:

```typescript
import fs from 'fs'

const mp3 = await openai.audio.speech.create({
  model: "tts-1",
  voice: "alloy", // alloy, echo, fable, onyx, nova, shimmer
  input: "Hello! This is a text-to-speech demo.",
})

const buffer = Buffer.from(await mp3.arrayBuffer())
await fs.promises.writeFile("speech.mp3", buffer)
```

### TTS Models

**tts-1** (Recommended for real-time)
- Optimized for speed
- Lower latency
- Good quality

**tts-1-hd**
- Optimized for quality
- Higher latency
- Best audio quality

## Speech-to-Text (Whisper)

Transcribe or translate audio:

```typescript
import fs from 'fs'

// Transcription
const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream("audio.mp3"),
  model: "whisper-1",
  language: "en", // Optional: ISO-639-1 code
  response_format: "json", // json, text, srt, vtt
  timestamp_granularities: ["segment"], // "segment" or "word"
})

console.log(transcription.text)

// Translation (to English)
const translation = await openai.audio.translations.create({
  file: fs.createReadStream("audio.mp3"),
  model: "whisper-1",
})
```

## Image Generation (DALL-E)

Generate images from text:

```typescript
const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: "A serene mountain landscape at sunset",
  n: 1,
  size: "1024x1024", // "1024x1024", "1792x1024", "1024x1792"
  quality: "standard", // "standard" or "hd"
  style: "vivid", // "vivid" or "natural"
})

const imageUrl = response.data[0].url
```

## Error Handling

```typescript
import { OpenAI } from 'openai'

try {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: messages,
  })
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    console.error('Status:', error.status)
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Type:', error.type)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

### Common Error Codes

- **401**: Invalid API key
- **429**: Rate limit exceeded
- **500**: Server error
- **503**: Service unavailable

## Rate Limits and Optimization

### Rate Limits

OpenAI enforces rate limits based on your usage tier:
- Requests per minute (RPM)
- Tokens per minute (TPM)
- Tokens per day (TPD)

### Optimization Strategies

**1. Batch Requests**
```typescript
// Instead of multiple calls
const embeddings = await Promise.all(
  texts.map(text => openai.embeddings.create({ input: text }))
)

// Batch in single call
const embeddings = await openai.embeddings.create({ input: texts })
```

**2. Caching**
```typescript
const cache = new Map<string, string>()

async function cachedCompletion(prompt: string) {
  if (cache.has(prompt)) {
    return cache.get(prompt)
  }

  const result = await openai.chat.completions.create({...})
  cache.set(prompt, result.choices[0].message.content)
  return result
}
```

**3. Token Management**
```typescript
import { encoding_for_model } from 'tiktoken'

const encoding = encoding_for_model('gpt-4')
const tokens = encoding.encode(text)
const tokenCount = tokens.length

// Truncate if too long
if (tokenCount > 8000) {
  const truncated = tokens.slice(0, 8000)
  text = encoding.decode(truncated)
}

encoding.free() // Free memory
```

## Best Practices

1. **Always Stream**: Use streaming for better UX
2. **Handle Errors**: Implement retry logic with exponential backoff
3. **Manage Tokens**: Track and limit token usage
4. **System Messages**: Use clear, specific system prompts
5. **Temperature**: Lower (0.2-0.5) for factual, higher (0.7-1.0) for creative
6. **Security**: Never expose API keys, use environment variables
7. **Context Management**: Trim old messages to stay under limits
8. **Prompt Engineering**: Iterate and test prompts for best results

## Cost Optimization

- Use gpt-3.5-turbo for simple tasks
- Implement caching for repeated requests
- Trim unnecessary context from conversations
- Use function calling instead of prompt engineering
- Batch embedding requests
- Monitor usage with OpenAI dashboard

## Conclusion

The OpenAI API provides powerful tools for building AI applications. Start with chat completions for conversational AI, use embeddings for semantic search, and explore specialized models like Whisper and DALL-E for multimodal applications. Always follow best practices for security, error handling, and cost optimization.
