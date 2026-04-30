import { marked, Tokens } from 'marked';

export interface AdfMark {
  type: 'strong' | 'em' | 'code' | 'strike' | 'link';
  attrs?: { href: string };
}

export interface AdfTextNode {
  type: 'text';
  text: string;
  marks?: AdfMark[];
}

export interface AdfBlockNode {
  type: string;
  attrs?: Record<string, string | number>;
  content?: AdfNode[];
}

export type AdfNode = AdfTextNode | AdfBlockNode;

export interface AdfDoc {
  type: 'doc';
  version: 1;
  content: AdfBlockNode[];
}

type InlineToken =
  | Tokens.Text
  | Tokens.Strong
  | Tokens.Em
  | Tokens.Codespan
  | Tokens.Del
  | Tokens.Link
  | Tokens.Br
  | Tokens.Escape
  | Tokens.HTML
  | Tokens.Generic;
type AnyToken = Tokens.Generic;

const lexerOptions = { gfm: true } as const;

function lex(md: string): AnyToken[] {
  return marked.lexer(md, lexerOptions) as AnyToken[];
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function inlineToAdf(tokens: InlineToken[] | undefined, marks: AdfMark[] = []): AdfTextNode[] {
  if (!tokens) return [];
  const result: AdfTextNode[] = [];

  for (const tok of tokens) {
    switch (tok.type) {
      case 'text': {
        const text = decodeEntities((tok as Tokens.Text).text);
        if (text === '') break;
        // If the text token has nested tokens (e.g., inside list items), recurse.
        const nested = (tok as Tokens.Text).tokens as InlineToken[] | undefined;
        if (nested && nested.length > 0) {
          result.push(...inlineToAdf(nested, marks));
        } else {
          result.push(makeTextNode(text, marks));
        }
        break;
      }
      case 'strong':
        result.push(
          ...inlineToAdf((tok as Tokens.Strong).tokens as InlineToken[], [
            ...marks,
            { type: 'strong' },
          ])
        );
        break;
      case 'em':
        result.push(
          ...inlineToAdf((tok as Tokens.Em).tokens as InlineToken[], [...marks, { type: 'em' }])
        );
        break;
      case 'codespan':
        result.push(
          makeTextNode(decodeEntities((tok as Tokens.Codespan).text), [...marks, { type: 'code' }])
        );
        break;
      case 'del':
        result.push(
          ...inlineToAdf((tok as Tokens.Del).tokens as InlineToken[], [
            ...marks,
            { type: 'strike' },
          ])
        );
        break;
      case 'link': {
        const link = tok as Tokens.Link;
        result.push(
          ...inlineToAdf(link.tokens as InlineToken[], [
            ...marks,
            { type: 'link', attrs: { href: link.href } },
          ])
        );
        break;
      }
      case 'br':
        result.push({ type: 'hardBreak' } as unknown as AdfTextNode);
        break;
      case 'escape':
        result.push(makeTextNode((tok as Tokens.Escape).text, marks));
        break;
      case 'html':
        result.push(makeTextNode((tok as Tokens.HTML).text, marks));
        break;
      default: {
        const generic = tok as Tokens.Generic;
        if (typeof generic.text === 'string') {
          result.push(makeTextNode(decodeEntities(generic.text), marks));
        }
        break;
      }
    }
  }

  return result;
}

function makeTextNode(text: string, marks: AdfMark[]): AdfTextNode {
  const node: AdfTextNode = { type: 'text', text };
  if (marks.length > 0) {
    node.marks = marks.map((m) => ({ ...m }));
  }
  return node;
}

function listItemToAdf(item: Tokens.ListItem): AdfBlockNode {
  const content: AdfBlockNode[] = [];
  let inlineBuffer: InlineToken[] = [];

  const flushInline = (): void => {
    if (inlineBuffer.length === 0) return;
    const textNodes = inlineToAdf(inlineBuffer);
    content.push({ type: 'paragraph', content: textNodes.length > 0 ? textNodes : [] });
    inlineBuffer = [];
  };

  for (const child of item.tokens as AnyToken[]) {
    if (child.type === 'text') {
      inlineBuffer.push(child as InlineToken);
    } else if (child.type === 'paragraph') {
      flushInline();
      const para = child as Tokens.Paragraph;
      content.push({
        type: 'paragraph',
        content: inlineToAdf(para.tokens as InlineToken[]),
      });
    } else if (child.type === 'list') {
      flushInline();
      content.push(listToAdf(child as Tokens.List));
    } else if (child.type === 'space') {
      continue;
    } else {
      flushInline();
      const block = blockToAdf(child);
      if (block) content.push(block);
    }
  }
  flushInline();

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [] });
  }

  return { type: 'listItem', content };
}

function listToAdf(list: Tokens.List): AdfBlockNode {
  const items = list.items.map(listItemToAdf);
  if (list.ordered) {
    const start = typeof list.start === 'number' ? list.start : 1;
    const node: AdfBlockNode = { type: 'orderedList', content: items };
    if (start !== 1) {
      node.attrs = { order: start };
    }
    return node;
  }
  return { type: 'bulletList', content: items };
}

function tableCellToAdf(cell: Tokens.TableCell, isHeader: boolean): AdfBlockNode {
  return {
    type: isHeader ? 'tableHeader' : 'tableCell',
    content: [
      {
        type: 'paragraph',
        content: inlineToAdf(cell.tokens as InlineToken[]),
      },
    ],
  };
}

function tableToAdf(table: Tokens.Table): AdfBlockNode {
  const rows: AdfBlockNode[] = [];

  rows.push({
    type: 'tableRow',
    content: table.header.map((cell) => tableCellToAdf(cell, true)),
  });

  for (const row of table.rows) {
    rows.push({
      type: 'tableRow',
      content: row.map((cell) => tableCellToAdf(cell, false)),
    });
  }

  return { type: 'table', content: rows };
}

function blockquoteToAdf(bq: Tokens.Blockquote): AdfBlockNode {
  const content: AdfBlockNode[] = [];
  for (const child of bq.tokens as AnyToken[]) {
    if (child.type === 'space') continue;
    const node = blockToAdf(child);
    if (node) content.push(node);
  }
  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [] });
  }
  return { type: 'blockquote', content };
}

function blockToAdf(token: AnyToken): AdfBlockNode | null {
  switch (token.type) {
    case 'heading': {
      const h = token as Tokens.Heading;
      const level = Math.min(Math.max(h.depth, 1), 6);
      return {
        type: 'heading',
        attrs: { level },
        content: inlineToAdf(h.tokens as InlineToken[]),
      };
    }
    case 'paragraph': {
      const p = token as Tokens.Paragraph;
      return { type: 'paragraph', content: inlineToAdf(p.tokens as InlineToken[]) };
    }
    case 'text': {
      // Top-level stray text token — treat as paragraph
      const t = token as Tokens.Text;
      const nested = t.tokens as InlineToken[] | undefined;
      const inline =
        nested && nested.length > 0
          ? inlineToAdf(nested)
          : [makeTextNode(decodeEntities(t.text), [])];
      return { type: 'paragraph', content: inline };
    }
    case 'list':
      return listToAdf(token as Tokens.List);
    case 'code': {
      const c = token as Tokens.Code;
      const node: AdfBlockNode = {
        type: 'codeBlock',
        content: c.text === '' ? [] : [{ type: 'text', text: c.text }],
      };
      if (c.lang) {
        node.attrs = { language: c.lang };
      }
      return node;
    }
    case 'blockquote':
      return blockquoteToAdf(token as Tokens.Blockquote);
    case 'hr':
      return { type: 'rule' };
    case 'table':
      return tableToAdf(token as Tokens.Table);
    case 'space':
      return null;
    case 'html': {
      const h = token as Tokens.HTML;
      return { type: 'paragraph', content: [makeTextNode(h.text, [])] };
    }
    default:
      return null;
  }
}

export function markdownToAdf(md: string): AdfDoc {
  const tokens = lex(md);
  const content: AdfBlockNode[] = [];
  for (const tok of tokens) {
    const node = blockToAdf(tok);
    if (node) content.push(node);
  }
  return { type: 'doc', version: 1, content };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCdataPayload(text: string): string {
  return text.replace(/]]>/g, ']]]]><![CDATA[>');
}

function selfCloseVoidElements(html: string): string {
  return html
    .replace(/<br>/g, '<br/>')
    .replace(/<hr>/g, '<hr/>')
    .replace(/<img([^>]*?)>/g, (match, attrs: string) => {
      if (match.endsWith('/>')) return match;
      return `<img${attrs}/>`;
    });
}

function replaceCodeBlocksWithMacro(html: string): string {
  const codeBlockPattern = /<pre><code(?:\s+class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g;
  return html.replace(codeBlockPattern, (_match, lang: string | undefined, body: string) => {
    const decoded = decodeEntities(body).replace(/\n$/, '');
    const cdata = escapeCdataPayload(decoded);
    const langParam = lang
      ? `<ac:parameter ac:name="language">${escapeXml(lang)}</ac:parameter>`
      : '';
    return `<ac:structured-macro ac:name="code">${langParam}<ac:plain-text-body><![CDATA[${cdata}]]></ac:plain-text-body></ac:structured-macro>`;
  });
}

export function markdownToConfluenceStorage(md: string): string {
  const html = marked.parse(md, { async: false, gfm: true }) as string;
  const withMacros = replaceCodeBlocksWithMacro(html);
  return selfCloseVoidElements(withMacros).trim();
}
