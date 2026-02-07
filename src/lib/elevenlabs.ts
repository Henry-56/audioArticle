
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export async function generateAudio(text: string, apiKey: string) {
    const client = new ElevenLabsClient({
        apiKey: apiKey,
    });
    // convert returns a ReadableStream or Buffer in Node, but in browser it might be different.
    // The SDK documentation suggests using the `play` helper for simplest usage,
    // but if we want to control the player, we need the blob.

    try {
        const audio = await client.textToSpeech.convert(
            'JBFqnCBsd6RMkjVDRZzb', // voice_id
            {
                text,
                modelId: 'eleven_turbo_v2_5',
                output_format: 'mp3_44100_128',
            }
        );

        // If we are in the browser, `audio` might be a Blob or a ReadableStream.
        // If it's a ReadableStream (which implementation usually returns), we need to read it into a Blob.

        // Check if it's a valid stream we can consume
        // @ts-ignore
        const chunks = [];
        // @ts-ignore
        for await (const chunk of audio) {
            chunks.push(chunk);
        }

        const blob = new Blob(chunks, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);

        // We can also play it immediately if we want
        const audioEl = new Audio(url);
        audioEl.play();

        return url;
    } catch (error) {
        console.error("Error generating audio:", error);
        throw error;
    }
}

export async function playAudio(url: string) {
    const audio = new Audio(url);
    await audio.play();
}
