import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Icon */}
          <div
            style={{
              display: 'flex',
              fontSize: '120px',
              marginBottom: '20px',
            }}
          >
            🤖
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            AI Chatbots
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              fontSize: '40px',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
            }}
          >
            Smart Document Q&A
          </div>

          {/* Description */}
          <div
            style={{
              display: 'flex',
              fontSize: '28px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '30px',
              textAlign: 'center',
              maxWidth: '900px',
            }}
          >
            Upload documents and chat with AI powered by GPT-4
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    console.error('Error generating OG image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
