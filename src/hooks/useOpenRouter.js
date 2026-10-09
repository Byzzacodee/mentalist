import { useCallback, useRef, useState } from 'react';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

function headers(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.href,
    'X-Title': 'Mentalist Tactical Command',
  };
}

/**
 * OpenRouter streaming + completion hook.
 * `stream` yields deltas via onDelta / onReasoning (DeepSeek R1 reasoning_content).
 * `complete` returns the full text in one shot (used for simulator feedback).
 */
export function useOpenRouter() {
  const abortRef = useRef(null);
  const [streaming, setStreaming] = useState(false);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const stream = useCallback(
    async ({ apiKey, model, system, messages, userContent, temperature = 0.35, onDelta, onReasoning, onDone, onError }) => {
      if (!apiKey) {
        onError?.(new Error('API key not configured — open SETTINGS'));
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      const payload = {
        model,
        stream: true,
        temperature,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages,
          { role: 'user', content: userContent },
        ],
      };

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: headers(apiKey),
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`OpenRouter HTTP ${res.status}: ${text.slice(0, 300)}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            let j;
            try {
              j = JSON.parse(data);
            } catch {
              continue;
            }
            const delta = j?.choices?.[0]?.delta;
            if (delta?.content) onDelta?.(delta.content);
            if (delta?.reasoning_content) onReasoning?.(delta.reasoning_content);
          }
        }
        onDone?.();
      } catch (e) {
        if (e.name !== 'AbortError') onError?.(e);
      } finally {
        setStreaming(false);
      }
    },
    []
  );

  const complete = useCallback(
    async ({ apiKey, model, system, messages, userContent, temperature = 0.2 }) => {
      if (!apiKey) throw new Error('API key not configured');
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify({
          model,
          temperature,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            ...messages,
            { role: 'user', content: userContent },
          ],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenRouter HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      const j = await res.json();
      return j?.choices?.[0]?.message?.content || '';
    },
    []
  );

  /**
   * Parallel multi-agent: send the same prompt to multiple models simultaneously.
   * Returns array of { modelId, label, content, error }.
   */
  const parallel = useCallback(
    async ({ apiKeys, models, system, messages, userContent, temperature = 0.35 }) => {
      const tasks = models.map(async (m, i) => {
        const key = apiKeys[i % apiKeys.length];
        try {
          const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: headers(key),
            body: JSON.stringify({
              model: m.modelId,
              stream: true,
              temperature,
              messages: [
                ...(system ? [{ role: 'system', content: system }] : []),
                ...messages,
                { role: 'user', content: userContent },
              ],
            }),
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status}`);
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let full = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const raw of lines) {
              const line = raw.trim();
              if (!line.startsWith('data:')) continue;
              const data = line.slice(5).trim();
              if (!data || data === '[DONE]') continue;
              try {
                const j = JSON.parse(data);
                const delta = j?.choices?.[0]?.delta?.content;
                if (delta) full += delta;
              } catch {}
            }
          }
          return { modelId: m.modelId, label: m.label, content: full, error: null };
        } catch (e) {
          return { modelId: m.modelId, label: m.label, content: '', error: e.message };
        }
      });
      return Promise.all(tasks);
    },
    []
  );

  return { stream, complete, parallel, streaming, abort };
}
