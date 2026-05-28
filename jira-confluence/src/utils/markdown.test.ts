import { describe, it, expect } from 'vitest';
import { markdownToAdf, markdownToConfluenceStorage } from './markdown.js';

describe('markdownToAdf', () => {
  describe('headings', () => {
    it('converts h1 through h6', () => {
      for (let depth = 1; depth <= 6; depth++) {
        const md = `${'#'.repeat(depth)} Title`;
        const doc = markdownToAdf(md);
        expect(doc.content).toEqual([
          {
            type: 'heading',
            attrs: { level: depth },
            content: [{ type: 'text', text: 'Title' }],
          },
        ]);
      }
    });

    it('preserves inline marks within headings', () => {
      const doc = markdownToAdf('# **Bold** and *em*');
      expect(doc.content[0]).toEqual({
        type: 'heading',
        attrs: { level: 1 },
        content: [
          { type: 'text', text: 'Bold', marks: [{ type: 'strong' }] },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'em', marks: [{ type: 'em' }] },
        ],
      });
    });
  });

  describe('paragraphs', () => {
    it('wraps a single line in a paragraph', () => {
      const doc = markdownToAdf('hello world');
      expect(doc.content).toEqual([
        { type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] },
      ]);
    });

    it('splits blank-line-separated text into multiple paragraphs', () => {
      const doc = markdownToAdf('first\n\nsecond');
      expect(doc.content).toHaveLength(2);
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'first' }],
      });
      expect(doc.content[1]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'second' }],
      });
    });
  });

  describe('inline marks', () => {
    it('renders bold', () => {
      const doc = markdownToAdf('**bold**');
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'bold', marks: [{ type: 'strong' }] }],
      });
    });

    it('renders italic', () => {
      const doc = markdownToAdf('*italic*');
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'italic', marks: [{ type: 'em' }] }],
      });
    });

    it('renders inline code', () => {
      const doc = markdownToAdf('`code`');
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'code', marks: [{ type: 'code' }] }],
      });
    });

    it('renders strikethrough (GFM)', () => {
      const doc = markdownToAdf('~~strike~~');
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'strike', marks: [{ type: 'strike' }] }],
      });
    });

    it('renders links', () => {
      const doc = markdownToAdf('[Atlassian](https://atlassian.com)');
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Atlassian',
            marks: [{ type: 'link', attrs: { href: 'https://atlassian.com' } }],
          },
        ],
      });
    });

    it('combines nested marks (bold link)', () => {
      const doc = markdownToAdf('**[link](https://x.test)**');
      const para = doc.content[0];
      expect(para.type).toBe('paragraph');
      expect(para.content).toEqual([
        {
          type: 'text',
          text: 'link',
          marks: [{ type: 'strong' }, { type: 'link', attrs: { href: 'https://x.test' } }],
        },
      ]);
    });

    it('handles adjacent marks separated by plain text', () => {
      const doc = markdownToAdf('**a** b *c*');
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'a', marks: [{ type: 'strong' }] },
          { type: 'text', text: ' b ' },
          { type: 'text', text: 'c', marks: [{ type: 'em' }] },
        ],
      });
    });
  });

  describe('lists', () => {
    it('renders bullet list', () => {
      const doc = markdownToAdf('- one\n- two');
      expect(doc.content[0]).toEqual({
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }],
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }],
          },
        ],
      });
    });

    it('renders ordered list starting at 1 without order attr', () => {
      const doc = markdownToAdf('1. first\n2. second');
      const list = doc.content[0];
      expect(list.type).toBe('orderedList');
      expect(list.attrs).toBeUndefined();
      expect(list.content).toHaveLength(2);
    });

    it('renders ordered list with non-1 start', () => {
      const doc = markdownToAdf('5. fifth\n6. sixth');
      const list = doc.content[0];
      expect(list.type).toBe('orderedList');
      expect(list.attrs).toEqual({ order: 5 });
    });

    it('renders nested bullet list (2 deep)', () => {
      const doc = markdownToAdf('- a\n  - nested\n- b');
      const list = doc.content[0];
      expect(list.type).toBe('bulletList');
      const firstItem = list.content?.[0];
      // First item should contain a paragraph and a nested bulletList
      expect(firstItem).toEqual({
        type: 'listItem',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'nested' }] }],
              },
            ],
          },
        ],
      });
    });

    it('renders bulletList nested inside orderedList', () => {
      const doc = markdownToAdf('1. first\n   - inner\n2. second');
      const list = doc.content[0];
      expect(list.type).toBe('orderedList');
      const firstItem = list.content?.[0];
      expect(firstItem?.type).toBe('listItem');
      const innerNodes = (firstItem as { content: unknown[] }).content;
      const inner = innerNodes[1] as { type: string };
      expect(inner.type).toBe('bulletList');
    });
  });

  describe('code blocks', () => {
    it('renders code block with language', () => {
      const doc = markdownToAdf('```python\nprint("hi")\n```');
      expect(doc.content[0]).toEqual({
        type: 'codeBlock',
        attrs: { language: 'python' },
        content: [{ type: 'text', text: 'print("hi")' }],
      });
    });

    it('renders code block without language', () => {
      const doc = markdownToAdf('```\nplain code\n```');
      expect(doc.content[0]).toEqual({
        type: 'codeBlock',
        content: [{ type: 'text', text: 'plain code' }],
      });
    });

    it('preserves HTML special characters as raw text', () => {
      const doc = markdownToAdf('```\n<script>&\n```');
      expect(doc.content[0]).toEqual({
        type: 'codeBlock',
        content: [{ type: 'text', text: '<script>&' }],
      });
    });
  });

  describe('tables (GFM)', () => {
    it('renders 2x2 table with header row', () => {
      const doc = markdownToAdf('| a | b |\n|---|---|\n| 1 | 2 |');
      expect(doc.content[0]).toEqual({
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
              },
              {
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '1' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '2' }] }],
              },
            ],
          },
        ],
      });
    });

    it('handles empty cells', () => {
      const doc = markdownToAdf('| a | b |\n|---|---|\n|   | 2 |');
      const dataRow = (doc.content[0] as { content: { content: unknown[] }[] }).content[1];
      const firstCell = dataRow.content[0] as { content: { content: unknown[] }[] };
      expect(firstCell.content[0].content).toEqual([]);
    });

    it('preserves inline marks inside cells', () => {
      const doc = markdownToAdf('| **bold** |\n|---|\n| `code`   |');
      const headerCell = (doc.content[0] as { content: { content: { content: unknown[] }[] }[] })
        .content[0].content[0] as { content: unknown[] };
      const headerPara = headerCell.content[0] as { content: unknown[] };
      expect(headerPara.content).toEqual([
        { type: 'text', text: 'bold', marks: [{ type: 'strong' }] },
      ]);
    });
  });

  describe('blockquote', () => {
    it('renders single-paragraph blockquote', () => {
      const doc = markdownToAdf('> hello');
      expect(doc.content[0]).toEqual({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }],
      });
    });

    it('renders multi-paragraph blockquote', () => {
      const doc = markdownToAdf('> first\n>\n> second');
      const bq = doc.content[0];
      expect(bq.type).toBe('blockquote');
      expect(bq.content).toHaveLength(2);
    });
  });

  describe('horizontal rule', () => {
    it('renders standalone hr as rule', () => {
      const doc = markdownToAdf('---');
      expect(doc.content[0]).toEqual({ type: 'rule' });
    });
  });

  describe('edge cases', () => {
    it('returns empty doc for empty string', () => {
      expect(markdownToAdf('')).toEqual({ type: 'doc', version: 1, content: [] });
    });

    it('returns empty doc for whitespace-only input', () => {
      const doc = markdownToAdf('   \n\n   ');
      expect(doc.content).toEqual([]);
    });

    it('treats plain text without markdown as a single paragraph (backward compat)', () => {
      const doc = markdownToAdf('just a sentence with no markdown');
      expect(doc.content).toEqual([
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'just a sentence with no markdown' }],
        },
      ]);
    });

    it('handles CRLF line endings', () => {
      const doc = markdownToAdf('line1\r\nline2\r\n\r\nnew para');
      expect(doc.content).toHaveLength(2);
      expect(doc.content[0].type).toBe('paragraph');
      expect(doc.content[1].type).toBe('paragraph');
    });

    it('keeps HTML special characters as literal text in ADF', () => {
      const doc = markdownToAdf('a < b & c > d');
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'a < b & c > d' }],
      });
    });
  });
});

describe('markdownToConfluenceStorage', () => {
  describe('headings', () => {
    it('converts headings to <h1>..<h6>', () => {
      expect(markdownToConfluenceStorage('# H1')).toContain('<h1>H1</h1>');
      expect(markdownToConfluenceStorage('### H3')).toContain('<h3>H3</h3>');
      expect(markdownToConfluenceStorage('###### H6')).toContain('<h6>H6</h6>');
    });
  });

  describe('inline marks', () => {
    it('renders bold/italic/inline code/strike/link', () => {
      const out = markdownToConfluenceStorage('**b** *i* `c` ~~s~~ [a](https://x.test)');
      expect(out).toContain('<strong>b</strong>');
      expect(out).toContain('<em>i</em>');
      expect(out).toContain('<code>c</code>');
      expect(out).toContain('<del>s</del>');
      expect(out).toContain('<a href="https://x.test">a</a>');
    });
  });

  describe('lists', () => {
    it('renders bullet and ordered lists', () => {
      const bullet = markdownToConfluenceStorage('- a\n- b');
      expect(bullet).toContain('<ul>');
      expect(bullet).toContain('<li>a</li>');

      const ordered = markdownToConfluenceStorage('1. a\n2. b');
      expect(ordered).toContain('<ol>');
    });
  });

  describe('code blocks', () => {
    it('wraps code blocks in Confluence code macro with language', () => {
      const out = markdownToConfluenceStorage('```python\nprint("hi")\n```');
      expect(out).toContain('<ac:structured-macro ac:name="code">');
      expect(out).toContain('<ac:parameter ac:name="language">python</ac:parameter>');
      expect(out).toContain('<![CDATA[print("hi")]]>');
      expect(out).not.toContain('<pre>');
    });

    it('wraps code block without language in macro (no language param)', () => {
      const out = markdownToConfluenceStorage('```\nplain\n```');
      expect(out).toContain('<ac:structured-macro ac:name="code">');
      expect(out).not.toContain('ac:parameter');
      expect(out).toContain('<![CDATA[plain]]>');
    });

    it('decodes HTML entities and preserves raw chars inside CDATA', () => {
      const out = markdownToConfluenceStorage('```\n<x> & "y"\n```');
      expect(out).toContain('<![CDATA[<x> & "y"]]>');
    });

    it('escapes the CDATA terminator inside code body', () => {
      const out = markdownToConfluenceStorage('```\nfoo]]>bar\n```');
      expect(out).toContain('<![CDATA[foo]]]]><![CDATA[>bar]]>');
    });
  });

  describe('tables', () => {
    it('preserves GFM tables as <table>', () => {
      const out = markdownToConfluenceStorage('| a | b |\n|---|---|\n| 1 | 2 |');
      expect(out).toContain('<table>');
      expect(out).toContain('<th>a</th>');
      expect(out).toContain('<td>1</td>');
    });
  });

  describe('blockquote and rules', () => {
    it('renders blockquote', () => {
      expect(markdownToConfluenceStorage('> hi')).toContain('<blockquote>');
    });

    it('self-closes <hr/> for XHTML compliance', () => {
      const out = markdownToConfluenceStorage('a\n\n---\n\nb');
      expect(out).toContain('<hr/>');
      expect(out).not.toMatch(/<hr>/);
    });

    it('self-closes <br/> for line breaks', () => {
      // Two trailing spaces + newline produces a <br>
      const out = markdownToConfluenceStorage('line1  \nline2');
      expect(out).toContain('<br/>');
      expect(out).not.toMatch(/<br>/);
    });
  });

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(markdownToConfluenceStorage('')).toBe('');
    });

    it('returns plain text wrapped in <p> for non-markdown input', () => {
      expect(markdownToConfluenceStorage('hello world')).toBe('<p>hello world</p>');
    });
  });
});
