import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: true });

/**
 * Sanitized GitHub-flavored markdown renderer (tactical styles in index.css).
 */
export default function Markdown({ content, className = '' }) {
  const html = useMemo(() => {
    const raw = marked.parse(content || '');
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  }, [content]);
  return <div className={`markdown ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
