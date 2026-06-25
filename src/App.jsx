import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { checkpointMarkdown } from './checkpointWriteup.js';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Bug,
  ClipboardList,
  Code2,
  FileText,
  Flag,
  GitBranch,
  Mail,
  Radar,
  Search,
  Tag,
  TerminalSquare,
} from 'lucide-react';

const files = {
  'aboutme.txt': [
    'ILoveCandy',
    '',
    'CTF player, bug bounty hunter, and software developer.',
    'I like taking messy systems apart, finding the weird edge cases,',
    'and turning that knowledge into useful tools, writeups, and fixes.',
  ].join('\n'),
  'stack.txt': [
    'Frontend: React, Vite, interface systems',
    'Game/dev: C, C++, Go, 3D modeling, gameplay systems',
    'Security: web exploitation, recon, auth bugs, reports',
    'Workflow: Linux, Git, automation, notes that survive 3am debugging',
  ].join('\n'),
  'contact.txt': [
    'github: https://github.com/joksdz',
    'email: boutineryad69@gmail.com',
    'status: open to security research, dev work, and CTF collabs',
  ].join('\n'),
};

const baseUrl = import.meta.env.BASE_URL;
const basePath = baseUrl.replace(/\/$/, '');

const routes = {
  home: `${baseUrl}#/`,
  work: `${baseUrl}#/#work`,
  blogs: `${baseUrl}#/blogs`,
  terminal: `${baseUrl}#/terminal`,
  pastDiary: `${baseUrl}#/blogs/past_diaries`,
  checkpoint: `${baseUrl}#/blogs/checkpoint_htb`,
};

const posts = [
  {
    slug: 'checkpoint_htb',
    path: routes.checkpoint,
    title: 'Hack The Box Checkpoint: Full AD Chain',
    category: 'ctf',
    tags: ['htb', 'active-directory', 'windows', 'kerberos', 'dmsa', 'forensics'],
    date: 'June 2026',
    read: '35 min',
    summary:
      'A full Hack The Box Checkpoint writeup covering the Alex Turner foothold, Mark Davies restore and Kerberoast, DevDrop VSIX execution, Ryan Brooks user flag, dMSA / BadSuccessor escalation, VMBackups access, Volatility hash extraction, and Administrator pass-the-hash.',
    excerpt:
      'Checkpoint is chained through Active Directory object abuse rather than a simple local privesc: restore Mark Davies, roast the account, upload a VSIX into DevDrop, pivot as Ryan Brooks, abuse dMSA / BadSuccessor into svc_deploy, pull a VMware memory snapshot, and extract the local Administrator hash.',
  },
  {
    slug: 'past_diaries',
    path: routes.pastDiary,
    title: 'Past Diary: FSOP From Heap Leaks To Flag',
    category: 'ctf',
    tags: ['ctf', 'pwn', 'heap', 'fsop', 'glibc'],
    date: 'June 2026',
    read: '22 min',
    summary:
      'A detailed THEM?!CTF pwn writeup covering the diary-page primitives, House of Orange-style top-chunk corruption, unsorted-bin libc disclosure, smallbin/tcache heap disclosure, safe-linking aware tcache poisoning, FSOP through _IO_list_all, and the final setcontext-to-ROP chain.',
    excerpt:
      'Past Diary is solved by turning the edit/view bug into two primitives: an unbounded raw heap overread and a constrained byte-wise overflow. Those primitives corrupt the wilderness twice for leaks, poison a stashed tcache entry into _IO_list_all, and make exit() walk a forged _IO_FILE_plus object.',
  },
];

const blogCategories = ['all', ...new Set(posts.map((post) => post.category))];

function getRouteFromLocation() {
  const hash = window.location.hash;

  if (hash && hash !== '#' && !hash.startsWith('#/')) {
    return { path: '/', section: hash.slice(1) };
  }

  if (hash?.startsWith('#/')) {
    const route = hash.slice(1);
    const [path, section = ''] = route.split('#');

    return { path: path || '/', section };
  }

  if (basePath && window.location.pathname.startsWith(`${basePath}/`)) {
    return { path: window.location.pathname.slice(basePath.length) || '/', section: '' };
  }

  return { path: '/', section: '' };
}

const focusNotes = [
  ['CTF', 'writeups, payload notes, and challenge debriefs'],
  ['Bounty', 'recon trails, impact notes, and clean reproduction steps'],
  ['Dev', 'small tools, React interfaces, and game dev experiments'],
  ['Blog', 'field notes with tags instead of throwaway posts'],
];

const skills = [
  'Web exploitation',
  'Recon automation',
  'Secure React apps',
  'C / C++ / Go',
  '3D modeling',
  'Game dev',
  'Linux internals',
  'Writeups',
];

const fileSystem = {
  '/home/ilovecandy': [
    { name: 'aboutme.txt', type: 'file', mode: '-rw-r--r--', size: '512B' },
    { name: 'stack.txt', type: 'file', mode: '-rw-r--r--', size: '348B' },
    { name: 'contact.txt', type: 'file', mode: '-rw-r--r--', size: '156B' },
    { name: 'blogs', type: 'dir', mode: 'drwxr-xr-x', size: '4.0K' },
    { name: 'tools', type: 'dir', mode: 'drwxr-xr-x', size: '4.0K' },
    { name: 'flags', type: 'dir', mode: 'drwxr-xr-x', size: '4.0K' },
    { name: '.cache', type: 'dir', mode: 'drwx------', size: '4.0K', hidden: true },
    { name: '.secrets', type: 'dir', mode: 'drwx------', size: '4.0K', hidden: true },
    { name: '.ilovecandy', type: 'file', mode: '-rw-------', size: '73B', hidden: true },
  ],
  '/home/ilovecandy/blogs': posts.map((post, index) => ({
    name: `${String(index + 1).padStart(2, '0')}-${post.slug}.md`,
    type: 'file',
    mode: '-rw-r--r--',
    size: `${post.excerpt.length + 80}B`,
  })),
  '/home/ilovecandy/tools': [
    { name: 'recon-notes.sh', type: 'file', mode: '-rwxr-xr-x', size: '1.2K' },
    { name: 'payload-bank.json', type: 'file', mode: '-rw-r--r--', size: '6.7K' },
    { name: 'report-template.md', type: 'file', mode: '-rw-r--r--', size: '2.1K' },
    { name: '.old-wordlists', type: 'dir', mode: 'drwx------', size: '4.0K', hidden: true },
  ],
  '/home/ilovecandy/flags': [
    { name: 'practice.ctf', type: 'file', mode: '-rw-r--r--', size: '128B' },
    { name: 'web-notes.flag', type: 'file', mode: '-rw-r--r--', size: '96B' },
    { name: '.almost', type: 'file', mode: '-rw-------', size: '32B', hidden: true },
  ],
  '/home/ilovecandy/.cache': [
    { name: 'last-target', type: 'file', mode: '-rw-------', size: '44B' },
  ],
  '/home/ilovecandy/.secrets': [
    { name: 'candy.link', type: 'file', mode: '-rw-------', size: '29B' },
    { name: '.note', type: 'file', mode: '-rw-------', size: '81B', hidden: true },
  ],
};

const terminalFileContents = {
  '/home/ilovecandy/.ilovecandy': 'ilovecandy hides many things. try: cd .secrets && ls -la',
  '/home/ilovecandy/.cache/last-target': `last seen: ${routes.pastDiary}`,
  '/home/ilovecandy/.secrets/candy.link': 'https://github.com/joksdz',
  '/home/ilovecandy/.secrets/.note': 'not every useful thing belongs on the first ls.',
  '/home/ilovecandy/tools/recon-notes.sh': '#!/bin/sh\nprintf "enumerate, verify, report\\n"',
  '/home/ilovecandy/tools/payload-bank.json': '{ "xss": ["<script>alert(1)</script>"], "sqli": ["\\u0027 OR 1=1--"] }',
  '/home/ilovecandy/tools/report-template.md': '# Report\n\nImpact:\nSteps:\nEvidence:\nFix:',
  '/home/ilovecandy/flags/practice.ctf': 'flag{practice_notes_are_not_real_flags}',
  '/home/ilovecandy/flags/web-notes.flag': 'remember: check assumptions before payloads',
  '/home/ilovecandy/flags/.almost': 'almost.',
};

const attackStages = [
  ['Primitive', 'The edit/view path gives a raw heap overread plus a byte-wise overflow after page content. Bad bytes come from scanf(\" %c\") and the special \"0\" terminator.'],
  ['House of Orange #1', 'Overwrite the top chunk size with 0xfd1, exhaust the fake wilderness, and read the old top chunk after sysmalloc links it into the unsorted bin.'],
  ['House of Orange #2', 'Repeat the wilderness corruption with 0xf11 to shape a smallbin/tcache-stashing layout and recover a heap-derived pointer.'],
  ['Fake FILE runtime', 'Place _IO_FILE_plus, _IO_wide_data, ucontext fragments, strings, a shadow trampoline, and the ROP chain across pages 35 through 40.'],
  ['Safe-linking poison', 'Edit the stashed 0x60 tcache fd to target ^ (stashed_user >> 12), then allocate onto _IO_list_all and write the fake FILE pointer.'],
  ['FSOP to ROP', 'exit() triggers _IO_cleanup, _IO_wfile_overflow reaches wide_vtable->__doallocate, setcontext pivots, and ROP performs the chroot escape.'],
];

const ropSteps = [
  ['pop rdi; ret', 'rdi = /bin'],
  ['chroot', 'chroot(\"/bin\")'],
  ['pop rdi; ret', 'rdi = ../../'],
  ['chroot', 'chroot(\"../../\")'],
  ['pop rdi; ret', 'rdi = A=;cat /flag.txt'],
  ['system', 'sh -c command prints flag'],
];


const checkpointStages = [
  ['Initial foothold', 'Use alex.turner to restore mark.davies, add an SPN, Kerberoast, and recover Checkpoint2024!.'],
  ['DevDrop execution', 'Upload a VS Code VSIX package to the writable DevDrop share and receive execution as ryan.brooks on DC01.'],
  ['AD object abuse', 'Create rbdmsa$ and set the BadSuccessor attributes that link it to the deployment service account svc_deploy.'],
  ['Kerberos pivot', 'Convert Ryan\'s delegated TGT to ccache, request the dMSA ticket with Impacket, then request CIFS for DC01.'],
  ['Backup extraction', 'Access VMBackups and download the VMware memory snapshot instead of pulling the unnecessary 10+ GB VMDK.'],
  ['Administrator shell', 'Run Volatility hashdump, recover the local Administrator NTLM hash, and pass-the-hash over WinRM.'],
];

const checkpointFlowNodes = [
  ['alex.turner', 44, 80],
  ['mark.davies', 238, 80],
  ['DevDrop VSIX', 458, 80],
  ['ryan.brooks', 714, 80],
  ['rbdmsa$', 96, 306],
  ['svc_deploy', 322, 306],
  ['VMBackups', 548, 306],
  ['Administrator', 786, 306],
];

function slugifyHeading(text) {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function parseInlineMarkdown(text) {
  const parts = String(text).split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

function isTableSeparator(line = '') {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line = '') {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseMarkdownBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const fence = trimmed.match(/^```\s*([^`]*)$/);
    if (fence) {
      const lang = fence[1]?.trim() || '';
      const codeLines = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) index += 1;
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') });
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      index += 1;
      continue;
    }

    if (trimmed === '---') {
      blocks.push({ type: 'hr' });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('|') && isTableSeparator(lines[index + 1] || '')) {
      const header = splitTableRow(lines[index]);
      index += 2;
      const rows = [];

      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push({ type: 'table', header, rows });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    const paragraph = [trimmed];
    index += 1;

    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next ||
        /^```/.test(next) ||
        /^(#{1,6})\s+/.test(next) ||
        next === '---' ||
        (next.startsWith('|') && isTableSeparator(lines[index + 1] || '')) ||
        /^[-*]\s+/.test(next) ||
        /^>\s?/.test(next)
      ) {
        break;
      }
      paragraph.push(next);
      index += 1;
    }

    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

function buildMarkdownSections(markdown) {
  const blocks = parseMarkdownBlocks(markdown);
  const sections = [];
  let current = null;

  blocks.forEach((block) => {
    if (block.type === 'heading' && block.level === 1) return;

    if (block.type === 'heading' && block.level === 2) {
      current = {
        id: slugifyHeading(block.text),
        title: block.text,
        blocks: [],
      };
      sections.push(current);
      return;
    }

    if (!current) {
      current = {
        id: 'overview',
        title: 'Overview',
        blocks: [],
      };
      sections.push(current);
    }

    current.blocks.push(block);
  });

  return sections;
}

function MarkdownBlock({ block }) {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level <= 3 ? 'h3' : 'h4';
      return <Tag className={`markdown-heading level-${block.level}`}>{parseInlineMarkdown(block.text)}</Tag>;
    }
    case 'paragraph':
      return <p>{parseInlineMarkdown(block.text)}</p>;
    case 'quote':
      return <blockquote className="writeup-quote">{parseInlineMarkdown(block.text)}</blockquote>;
    case 'list':
      return (
        <ul className="writeup-list">
          {block.items.map((item) => (
            <li key={item}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div className="writeup-table-wrap">
          <table className="writeup-table">
            <thead>
              <tr>
                {block.header.map((cell) => (
                  <th key={cell}>{parseInlineMarkdown(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`}>{parseInlineMarkdown(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'code':
      return (
        <pre className="code-panel"><code>{block.text}</code></pre>
      );
    case 'hr':
      return <hr className="writeup-divider" />;
    default:
      return null;
  }
}

function CheckpointChainDiagram() {
  const lanes = [
    ['identity', 'alex.turner', 'restore + roast', 'mark.davies'],
    ['execution', 'DevDrop', 'VSIX callback', 'ryan.brooks'],
    ['domain pivot', 'rbdmsa$', 'BadSuccessor link', 'svc_deploy'],
    ['forensics', 'VMBackups', 'Volatility hashdump', 'Administrator'],
  ];

  return (
    <motion.div
      className="diagram-card checkpoint-diagram checkpoint-chain-map"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="diagram-title">
        <span>diagram 01</span>
        <h3>Attack chain from recovered identity to Administrator shell</h3>
      </div>

      <div className="checkpoint-lane-map" aria-label="Checkpoint attack chain diagram">
        {lanes.map(([lane, from, action, to], index) => (
          <motion.div
            className="checkpoint-lane"
            key={lane}
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.075, duration: 0.38, ease: 'easeOut' }}
          >
            <div className="checkpoint-lane-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="checkpoint-lane-label">{lane}</div>
            <div className="checkpoint-node-pill">{from}</div>
            <div className="checkpoint-connector">
              <span>{action}</span>
            </div>
            <div className="checkpoint-node-pill checkpoint-node-destination">{to}</div>
          </motion.div>
        ))}
      </div>

      <p className="checkpoint-diagram-note">
        The chain is split by control boundary: identity recovery, code execution, domain-object abuse,
        then offline memory forensics for the final Administrator hash.
      </p>
    </motion.div>
  );
}

function CheckpointBlogPage() {
  const sections = useMemo(() => buildMarkdownSections(checkpointMarkdown), []);

  return (
    <main className="checkpoint-shell past-diary-shell">
      <SiteNav />

      <section className="writeup-hero">
        <motion.a
          className="back-link"
          href={routes.blogs}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <ArrowLeft size={18} />
          Blog index
        </motion.a>

        <motion.div
          className="writeup-hero-grid"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="writeup-title-block">
            <span className="eyebrow writeup-eyebrow">
              <Flag size={16} />
              Hack The Box / Windows AD / dMSA + forensics
            </span>
            <h1>Checkpoint</h1>
            <p>
              A complete Hack The Box Checkpoint report presented as a long-form writeup. The page
              keeps the full technical notes, readable code panels, a sticky table of contents, and
              a custom attack-chain diagram placed after the initial report context.
            </p>
          </div>

          <aside className="writeup-card">
            <span>route</span>
            <code>/blogs/checkpoint_htb</code>
            <p>
              Focus: Windows Active Directory, Kerberos ticket abuse, delegated Managed Service
              Accounts, VMware memory snapshots, Volatility, and pass-the-hash over WinRM.
            </p>
          </aside>
        </motion.div>
      </section>

      <article className="writeup-layout">
        <aside className="writeup-toc">
          <span>contents</span>
          {sections.map((section) => (
            <a href={`${routes.checkpoint}#${section.id}`} key={section.id}>{section.title}</a>
          ))}
        </aside>

        <div className="writeup-body writeup-markdown">
          {sections.map((section, index) => (
            <div className="checkpoint-section-group" key={section.id}>
              <motion.section
                id={section.id}
                className="writeup-section markdown-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: Math.min(index * 0.025, 0.12), duration: 0.5, ease: 'easeOut' }}
              >
                <span>{String(index + 1).padStart(2, '0')} · writeup section</span>
                <h2>{parseInlineMarkdown(section.title)}</h2>
                {section.blocks.map((block, blockIndex) => (
                  <MarkdownBlock block={block} key={`${section.id}-${blockIndex}`} />
                ))}
              </motion.section>

              {index === 1 ? <CheckpointChainDiagram /> : null}
            </div>
          ))}
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}

function listDirectory(cwd, args) {
  const entries = fileSystem[cwd] || [];
  const flags = args.join('');
  const showHidden = flags.includes('a');
  const longFormat = flags.includes('l');
  const visibleEntries = entries.filter((entry) => showHidden || !entry.hidden);

  if (longFormat) {
    const rows = [
      `${cwd}`,
      'type  permissions  size   name',
      ...(showHidden
        ? [
            'dir   drwxr-xr-x   4.0K  ./',
            'dir   drwxr-xr-x   4.0K  ../',
          ]
        : []),
      ...visibleEntries.map((entry) => {
        const type = entry.type === 'dir' ? 'dir ' : 'file';
        const name = entry.type === 'dir' ? `${entry.name}/` : entry.name;
        return `${type}  ${entry.mode}  ${entry.size.padStart(5)}  ${name}`;
      }),
    ];

    return rows.join('\n');
  }

  return visibleEntries
    .map((entry) => (entry.type === 'dir' ? `${entry.name}/` : entry.name))
    .join('  ') || 'empty directory';
}

function findEntry(cwd, name) {
  return fileSystem[cwd]?.find((entry) => entry.name === name || `${entry.name}/` === name);
}

function resolveDirectory(cwd, target = '') {
  const clean = target.replace(/\/+$/, '');

  if (!clean || clean === '~') return '/home/ilovecandy';
  if (clean === '.') return cwd;
  if (clean === 'blog' || clean === 'blogs') return '/home/ilovecandy/blogs';
  if (clean === '..') {
    return cwd === '/home/ilovecandy'
      ? cwd
      : cwd.split('/').slice(0, -1).join('/') || '/home/ilovecandy';
  }
  if (clean.startsWith('/')) return clean === '/blogs' ? '/home/ilovecandy/blogs' : clean;

  return `${cwd}/${clean}`.replace('/home/ilovecandy/blog/', '/home/ilovecandy/blogs/');
}

function makeOutput(command, cwd) {
  const input = command.trim();
  const [base, ...args] = input.split(/\s+/);

  if (!input) return '';

  switch (base.toLowerCase()) {
    case 'help':
      return {
        output: 'commands: help, ls, ls -la, cd <dir>, cat <file>, whoami, skills, blog, contact, ilovecandy, clear',
      };
    case 'ls':
      return { output: listDirectory(cwd, args) };
    case 'cd': {
      const nextPath = resolveDirectory(cwd, args[0]);
      if (!fileSystem[nextPath]) {
        return { output: `cd: ${args[0] || ''}: No such directory` };
      }

      return { output: `moved to ${nextPath}`, cwd: nextPath };
    }
    case 'cat': {
      const file = args[0];
      const entry = findEntry(cwd, file);

      if (entry?.type === 'dir') {
        return { output: `cat: ${file}: Is a directory` };
      }

      if (files[file]) {
        return { output: files[file] };
      }

      if (entry) {
        return {
          output:
            terminalFileContents[`${cwd}/${entry.name}`] ||
            `${posts[0].title}\n\n${posts[0].excerpt}\n\nOpen: ${routes.pastDiary}`,
        };
      }

      if (cwd === '/home/ilovecandy/blogs') {
        const index = Number.parseInt(file, 10) - 1;
        const post = posts[index];
        return {
          output: post
            ? `${post.title}\n\n${post.excerpt}\n\nTags: ${post.tags.join(', ')}\nPath: ${post.path}`
            : `cat: ${file || ''}: No blog file. Try cat 01-past_diaries.md`,
        };
      }
      return { output: `cat: ${file || ''}: No such file. Try cat aboutme.txt` };
    }
    case 'whoami':
      return { output: 'ILoveCandy - CTF player | bug bounty hunter | software developer' };
    case 'skills':
      return { output: skills.map((skill) => `- ${skill}`).join('\n') };
    case 'blog':
    case 'blogs':
      return {
        output: posts.map((post, index) => `${index + 1}. [${post.category}] ${post.title} -> ${post.path}`).join('\n'),
      };
    case 'contact':
      return { output: files['contact.txt'] };
    case 'ilovecandy':
      return {
        output: [
          'easter egg unlocked:',
          'https://github.com/joksdz',
          '',
          'hint: ilovecandy hides many things. try ls -la',
        ].join('\n'),
      };
    case 'clear':
      return { clear: true };
    default:
      return { output: `${base}: command not found. Type help` };
  }
}

function Terminal() {
  const [history, setHistory] = useState([
    { type: 'output', text: 'ILoveCandy shell. Type help to explore.' },
  ]);
  const [cwd, setCwd] = useState('/home/ilovecandy');
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const submit = (event) => {
    event.preventDefault();
    const command = value;
    const result = makeOutput(command, cwd);

    if (result.clear) {
      setHistory([]);
    } else {
      setHistory((current) => [
        ...current,
        { type: 'command', cwd, text: command || ' ' },
        { type: 'output', text: result.output },
      ]);
    }

    if (result.cwd) setCwd(result.cwd);
    setValue('');
  };

  return (
    <section className="terminal-panel" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-topbar">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="terminal-title">{cwd}</span>
        <TerminalSquare size={18} />
      </div>

      <div className="terminal-screen" aria-label="Interactive portfolio terminal">
        {history.map((entry, index) => (
          <div className={entry.type === 'command' ? 'terminal-line command' : 'terminal-line'} key={`${entry.type}-${index}`}>
            {entry.type === 'command' ? <span className="prompt">{entry.cwd.split('/').pop()} $</span> : null}
            <pre>{entry.text}</pre>
          </div>
        ))}

        <form className="terminal-input-row" onSubmit={submit}>
          <span className="prompt">{cwd.split('/').pop()} $</span>
          <input
            id="terminal-command"
            name="terminal-command"
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            aria-label="Terminal command"
          />
        </form>
      </div>
    </section>
  );
}

function SiteNav() {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const updateStuckState = () => setIsStuck(window.scrollY > 12);
    updateStuckState();
    window.addEventListener('scroll', updateStuckState, { passive: true });
    return () => window.removeEventListener('scroll', updateStuckState);
  }, []);

  return (
    <nav className={isStuck ? 'site-nav is-stuck' : 'site-nav'} aria-label="Primary navigation">
      <a className="brand" href={routes.home}>
        <span className="brand-mark">IC</span>
        <span>ILoveCandy</span>
      </a>
      <div className="nav-links">
        <a href={routes.work}>Work</a>
        <a href={routes.blogs}>Blog</a>
        <a href={routes.terminal}>Terminal</a>
      </div>
    </nav>
  );
}

function SiteFooter() {
  return (
    <footer>
      <a href="https://github.com/joksdz">
        <GitBranch size={18} />
        GitHub
      </a>
      <a href="mailto:boutineryad69@gmail.com">
        <Mail size={18} />
        Email
      </a>
      <a href={routes.home}>
        <FileText size={18} />
        Resume soon
      </a>
    </footer>
  );
}

function HomePage() {
  return (
    <main className="home-shell">
      <SiteNav />

      <section className="hero-section" id="home">
        <div className="hero-grid">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="hero-copy"
          >
            <div className="eyebrow">
              <Radar size={16} />
              CTF player / bug bounty hunter / software dev
            </div>
            <h1>ILoveCandy</h1>
            <p>
              I build software, break assumptions, and document the path from
              suspicious behavior to clean proof. This is my workspace for
              writeups, tools, research notes, and shipped projects.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href={routes.terminal}>
                Open terminal
                <TerminalSquare size={18} />
              </a>
              <a className="secondary-action" href={routes.pastDiary}>
                Read Past Diary
                <ArrowUpRight size={18} />
              </a>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.55, ease: 'easeOut' }}
            className="field-desk"
            aria-label="ILoveCandy field desk"
          >
            <div className="desk-top">
              <span>field desk</span>
              <ClipboardList size={18} />
            </div>
            <div className="desk-card primary-note">
              <span className="note-kicker">current writeup</span>
              <h2>Past Diary FSOP chain.</h2>
              <p>
                A heap exploitation walkthrough from page metadata primitives to
                _IO_list_all overwrite, setcontext pivot, and final ROP.
              </p>
            </div>
            <div className="desk-grid">
              <div className="desk-card mini-note">
                <span>open file</span>
                <strong>aboutme.txt</strong>
              </div>
              <div className="desk-card mini-note accent">
                <span>next read</span>
                <strong>/blogs/past_diaries</strong>
              </div>
            </div>
            <div className="command-stack" aria-label="Suggested terminal commands">
              <code>$ cd blogs</code>
              <code>$ ls</code>
              <code>$ cat 01-past_diaries.md</code>
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="focus-strip" aria-label="Portfolio focus areas">
        {focusNotes.map(([title, label]) => (
          <div className="focus-item" key={title}>
            <strong>{title}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="work-section" id="work">
        <div className="section-heading">
          <span>focus</span>
          <h2>Security research with software discipline.</h2>
        </div>
        <div className="work-grid">
          <article className="work-card">
            <Flag size={24} />
            <h3>CTF Player</h3>
            <p>
              Web, crypto, reversing, and forensic challenges documented with
              reusable solve paths and clean notes.
            </p>
          </article>
          <article className="work-card">
            <Bug size={24} />
            <h3>Bug Bounty</h3>
            <p>
              Recon, reproduction, impact framing, and reports designed to be
              easy for triage teams to validate.
            </p>
          </article>
          <article className="work-card">
            <Code2 size={24} />
            <h3>Software Dev</h3>
            <p>
              Frontend tools, C/C++/Go experiments, 3D modeling workflows, and
              game-dev prototypes that make technical work more hands-on.
            </p>
          </article>
        </div>
      </section>

      <section className="skills-section">
        <div className="skills-copy">
          <span>toolkit</span>
          <h2>Enough design to ship, enough security to question it.</h2>
        </div>
        <div className="skill-list">
          {skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </section>

      <section className="blog-section" id="blog">
        <div className="section-heading">
          <span>blog</span>
          <h2>Writeups, notes, and field reports.</h2>
        </div>
        <div className="blog-grid single-blog-grid">
          {posts.map((post) => (
            <article className="blog-card featured-home-blog" key={post.title}>
              <div className="blog-meta">
                <span>{post.category}</span>
                <span>{post.date}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.summary}</p>
              <a href={post.path}>
                <BookOpen size={17} />
                {post.read} read
              </a>
            </article>
          ))}
        </div>
        <a className="blog-index-link" href={routes.blogs}>
          Open blog index
          <ArrowUpRight size={18} />
        </a>
      </section>

      <SiteFooter />
    </main>
  );
}

function TerminalPage() {
  return (
    <main className="terminal-only-page">
      <SiteNav />
      <div className="terminal-stage">
        <Terminal />
      </div>
    </main>
  );
}

function HeapLeakDiagram() {
  return (
    <motion.div
      className="diagram-card heap-diagram"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="diagram-title">
        <span>diagram 01</span>
        <h3>House of Orange-style top-chunk corruption and libc disclosure</h3>
      </div>
      <svg viewBox="0 0 1040 500" role="img" aria-label="House of Orange heap layout showing top chunk corruption and an unsorted-bin libc leak">
        <defs>
          <marker id="heap-arrow-red" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 z" />
          </marker>
          <marker id="heap-arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 z" />
          </marker>
        </defs>

        <text className="annotation" x="52" y="44">1) byte edit after page 1 overwrites the wilderness size field</text>
        <g className="heap-row">
          <rect x="60" y="76" width="165" height="82" />
          <text x="142" y="110" textAnchor="middle">page 1</text>
          <text x="142" y="136" textAnchor="middle">content 0x10</text>
        </g>
        <g className="heap-row danger">
          <rect x="250" y="76" width="170" height="82" />
          <text x="335" y="110" textAnchor="middle">top chunk</text>
          <text x="335" y="136" textAnchor="middle">size = 0xfd1</text>
        </g>
        <g className="heap-row muted-row">
          <rect x="470" y="76" width="235" height="82" />
          <text x="588" y="110" textAnchor="middle">pages 2..16</text>
          <text x="588" y="136" textAnchor="middle">0xe0 each</text>
        </g>
        <g className="heap-row libc-row">
          <rect x="760" y="76" width="220" height="82" />
          <text x="870" y="110" textAnchor="middle">sysmalloc</text>
          <text x="870" y="136" textAnchor="middle">old top → bins</text>
        </g>

        <path className="diagram-arrow red" d="M225 117 H250" markerEnd="url(#heap-arrow-red)" />
        <path className="diagram-arrow red" d="M420 117 H470" markerEnd="url(#heap-arrow-red)" />
        <path className="diagram-arrow blue" d="M705 117 H760" markerEnd="url(#heap-arrow-blue)" />

        <text className="annotation" x="52" y="242">2) the old top chunk contains unsorted-bin fd/bk pointers into main_arena</text>
        <g className="heap-row">
          <rect x="60" y="282" width="205" height="92" />
          <text x="162" y="318" textAnchor="middle">page 17</text>
          <text x="162" y="345" textAnchor="middle">A*0x30 + B*8</text>
        </g>
        <g className="heap-row leak-row">
          <rect x="320" y="282" width="250" height="92" />
          <text x="445" y="318" textAnchor="middle">edit_view overread</text>
          <text x="445" y="345" textAnchor="middle">continues past page</text>
        </g>
        <g className="heap-row libc-row">
          <rect x="630" y="282" width="280" height="92" />
          <text x="770" y="318" textAnchor="middle">unsorted-bin chunk</text>
          <text x="770" y="345" textAnchor="middle">fd/bk → main_arena</text>
        </g>

        <path className="diagram-arrow blue" d="M265 328 H320" markerEnd="url(#heap-arrow-blue)" />
        <path className="diagram-arrow red" d="M570 328 H630" markerEnd="url(#heap-arrow-red)" />
        <text className="annotation strong-note" x="635" y="430">leak - 0x212b18 = libc base</text>
      </svg>
    </motion.div>
  );
}

function TcachePoisonDiagram() {
  return (
    <motion.div
      className="diagram-card tcache-diagram"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="diagram-title">
        <span>diagram 02</span>
        <h3>Safe-linking aware tcache poison into _IO_list_all</h3>
      </div>
      <svg viewBox="0 0 1040 500" role="img" aria-label="Tcache poisoning diagram redirecting a malloc allocation to IO list all">
        <defs>
          <marker id="tc-arrow-green" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 z" />
          </marker>
          <marker id="tc-arrow-amber" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 z" />
          </marker>
        </defs>

        <text className="annotation" x="52" y="46">page 33 physically overlaps the stashed tcache chunk metadata</text>
        <g className="heap-row muted-row">
          <rect x="70" y="88" width="220" height="94" />
          <text x="180" y="124" textAnchor="middle">page 33</text>
          <text x="180" y="151" textAnchor="middle">edit offset 0x78</text>
        </g>
        <g className="heap-row danger">
          <rect x="390" y="88" width="250" height="94" />
          <text x="515" y="124" textAnchor="middle">stashed 0x60 chunk</text>
          <text x="515" y="151" textAnchor="middle">fd field is encoded</text>
        </g>
        <g className="heap-row libc-row">
          <rect x="740" y="88" width="230" height="94" />
          <text x="855" y="124" textAnchor="middle">target</text>
          <text x="855" y="151" textAnchor="middle">_IO_list_all - 0x20</text>
        </g>

        <path className="diagram-arrow green" d="M290 135 H390" markerEnd="url(#tc-arrow-green)" />
        <path className="diagram-arrow amber" d="M640 135 H740" markerEnd="url(#tc-arrow-amber)" />
        <text className="annotation strong-note" x="330" y="224">stored fd = target ^ (stashed_user &gt;&gt; 12)</text>

        <g className="heap-row">
          <rect x="120" y="318" width="250" height="94" />
          <text x="245" y="354" textAnchor="middle">adjust(42, 0x40)</text>
          <text x="245" y="381" textAnchor="middle">drain first tcache entry</text>
        </g>
        <g className="heap-row leak-row">
          <rect x="440" y="318" width="250" height="94" />
          <text x="565" y="354" textAnchor="middle">adjust(43, 0x40)</text>
          <text x="565" y="381" textAnchor="middle">allocation hits target</text>
        </g>
        <g className="heap-row libc-row">
          <rect x="760" y="318" width="220" height="94" />
          <text x="870" y="354" textAnchor="middle">writep(43)</text>
          <text x="870" y="381" textAnchor="middle">_IO_list_all = fake</text>
        </g>

        <path className="diagram-arrow green" d="M515 182 C430 240 310 264 245 318" markerEnd="url(#tc-arrow-green)" />
        <path className="diagram-arrow amber" d="M370 365 H440" markerEnd="url(#tc-arrow-amber)" />
        <path className="diagram-arrow amber" d="M690 365 H760" markerEnd="url(#tc-arrow-amber)" />
      </svg>
    </motion.div>
  );
}

function FsopFlowDiagram() {
  const nodes = [
    ['exit()', 54, 88],
    ['_IO_cleanup', 244, 88],
    ['_IO_flush_all_lockp', 472, 88],
    ['fake FILE', 760, 88],
    ['_IO_wfile_overflow', 72, 310],
    ['_IO_wdoallocbuf', 330, 310],
    ['setcontext(fake)', 590, 310],
    ['ROP chain', 808, 310],
  ];

  return (
    <motion.div
      className="diagram-card fsop-diagram"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="diagram-title">
        <span>diagram 03</span>
        <h3>FSOP call path from exit() to the ROP chain</h3>
      </div>
      <svg viewBox="0 0 1040 470" role="img" aria-label="FSOP flow from exit cleanup to setcontext and ROP">
        <defs>
          <marker id="fsop-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 z" />
          </marker>
        </defs>
        <text className="annotation" x="52" y="46">_IO_list_all points at the forged stream before the process exits</text>
        {nodes.map(([label, x, y]) => (
          <g className="flow-node" key={label}>
            <rect x={x} y={y} width="170" height="78" />
            <text x={x + 85} y={y + 46} textAnchor="middle">{label}</text>
          </g>
        ))}
        <path className="diagram-arrow flow" d="M224 127 H244" markerEnd="url(#fsop-arrow)" />
        <path className="diagram-arrow flow" d="M414 127 H472" markerEnd="url(#fsop-arrow)" />
        <path className="diagram-arrow flow" d="M642 127 H760" markerEnd="url(#fsop-arrow)" />
        <path className="diagram-arrow flow" d="M845 166 C845 235 170 236 157 310" markerEnd="url(#fsop-arrow)" />
        <path className="diagram-arrow flow" d="M242 349 H330" markerEnd="url(#fsop-arrow)" />
        <path className="diagram-arrow flow" d="M500 349 H590" markerEnd="url(#fsop-arrow)" />
        <path className="diagram-arrow flow" d="M760 349 H808" markerEnd="url(#fsop-arrow)" />
        <text className="annotation strong-note" x="52" y="430">write_ptr &gt; write_base selects overflow; wide_vtable-&gt;__doallocate is setcontext.</text>
      </svg>
    </motion.div>
  );
}

function PastDiaryBlogPage() {
  return (
    <main className="past-diary-shell">
      <SiteNav />

      <section className="writeup-hero">
        <motion.a
          className="back-link"
          href={routes.blogs}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <ArrowLeft size={18} />
          Blog index
        </motion.a>

        <motion.div
          className="writeup-hero-grid"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="writeup-title-block">
            <span className="eyebrow writeup-eyebrow">
              <Flag size={16} />
              THEM?!CTF / pwn / glibc heap + FSOP
            </span>
            <h1>Past Diary</h1>
            <p>
              A detailed exploit writeup for the diary-page allocator bug. The chain starts with
              a raw heap overread and a constrained byte-wise overflow, uses two House of
              Orange-style top-chunk corruptions for libc and heap disclosure, poisons a stashed
              tcache entry into <code>_IO_list_all</code>, and finishes through a fake
              <code> _IO_FILE_plus</code> object that pivots into ROP with <code>setcontext</code>.
            </p>
          </div>

          <aside className="writeup-card">
            <span>route</span>
            <code>/blogs/past_diaries</code>
            <p>
              Wallpaper hook: place your preferred image at
              <strong> public/wallpapers/past-diary-wallpaper.jpg</strong>.
              The CSS already references this path and falls back to the normal blog wallpaper if the file is missing.
            </p>
          </aside>
        </motion.div>
      </section>

      <article className="writeup-layout">
        <aside className="writeup-toc">
          <span>contents</span>
          <a href={`${routes.pastDiary}#primitive`}>Primitive</a>
          <a href={`${routes.pastDiary}#house-orange`}>House of Orange</a>
          <a href={`${routes.pastDiary}#heap-leak`}>Heap leak</a>
          <a href={`${routes.pastDiary}#fake-file`}>Fake FILE</a>
          <a href={`${routes.pastDiary}#poison`}>Tcache poison</a>
          <a href={`${routes.pastDiary}#fsop`}>FSOP pivot</a>
          <a href={`${routes.pastDiary}#rop`}>ROP chain</a>
        </aside>

        <div className="writeup-body">
          <motion.section
            id="primitive"
            className="writeup-section lead-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span>primitives and core bug</span>
            <h2>The diary object gives both a leak primitive and a constrained corruption primitive.</h2>
            <p>
              Each page is laid out as metadata followed by inline content. In the exploit model,
              the content starts at <code>chunk_user_ptr + 0x18</code>. The normal write operation
              only targets content bytes, but the edit path can address positions past the declared
              page length. The view path is the other half of the bug: before asking for an edit
              position, it prints raw heap bytes without stopping at the page length.
            </p>
            <p>
              That means the exploit does not need an immediate arbitrary write. It first builds
              allocator layouts where adjacent chunk metadata contains useful pointers, then uses
              <code>edit_view</code> to read them. For corruption, <code>edit_byte</code> writes one
              byte at a time, but the input is filtered by behavior rather than by an explicit
              sanitizer: <code>{'scanf(" %c")'}</code> skips whitespace and the character
              <code> '0'</code> is treated as a NUL terminator. The exploit therefore retries when
              a safe-linking payload contains one of those bad bytes.
            </p>

            <div className="primitive-grid">
              {[
                ['adjust', 'allocates a page, sets length, and stores timestamp fields in the metadata area'],
                ['writep', 'writes controlled bytes into the content area at user_ptr + 0x18'],
                ['edit_view', 'prints raw bytes past the declared length, giving adjacent heap disclosure'],
                ['edit_byte', 'single-byte overflow past content, with whitespace / 0x30 bad-byte constraints'],
              ].map(([name, text]) => (
                <motion.div className="primitive-card" key={name} whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                  <strong>{name}</strong>
                  <p>{text}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <HeapLeakDiagram />

          <motion.section
            id="house-orange"
            className="writeup-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span>stage 1 · libc leak</span>
            <h2>House of Orange-style top-chunk corruption creates an unsorted-bin libc leak.</h2>
            <p>
              The first controlled overflow is aimed at the wilderness chunk immediately after page 1.
              Page 1 has a <code>0x10</code>-byte content region, so writing at content offset
              <code>0x10</code> reaches the top chunk size field. The exploit replaces that size with
              <code>0xfd1</code>. This is the House of Orange idea: do not free a chunk directly;
              instead, lie about the top chunk and force malloc to retire the old wilderness through
              <code>sysmalloc</code>.
            </p>
            <div className="mini-step-list">
              {[
                ['01', 'allocate page 1 with length 0x10'],
                ['02', 'byte-edit page 1 at offset 0x10 and write p64(0xfd1) over the top size'],
                ['03', 'allocate pages 2..16 with size 0xe0 until the fake wilderness is exhausted'],
                ['04', 'sysmalloc moves the old top chunk into the unsorted bin'],
                ['05', 'page 17 is placed so its overread reaches the old top chunk fd/bk pointers'],
              ].map(([idx, text]) => (
                <div className="mini-step" key={idx}>
                  <strong>{idx}</strong>
                  <p>{text}</p>
                </div>
              ))}
            </div>
            <p>
              Unsorted-bin chunks contain <code>fd</code> and <code>bk</code> pointers into
              <code>main_arena</code>. The exploit fills page 17 with <code>A * 0x30</code>, appends
              <code>B * 8</code> past the page boundary, and then calls the edit view. After the marker,
              the next leaked bytes are interpreted as a libc pointer. The base is calculated as
              <code>leak - 0x212b18</code>, and page alignment is used as a sanity check.
            </p>
            <pre className="code-panel"><code>{`adjust(t, 1, 0x10)
set_bytes(t, 1, 0x10, p64(0xfd1))
for i in range(2, 17): adjust(t, i, 0xe0)
adjust(t, 17, 0x30)
writep(t, 17, b'A' * 0x30)
set_bytes(t, 17, 0x30, b'B' * 8)
leak = u64(leak_after(t, 17, b'A' * 0x30 + b'B' * 8)[:6])
libc = leak - 0x212b18`}</code></pre>
          </motion.section>

          <motion.section
            id="heap-leak"
            className="writeup-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span>stage 2 · heap leak</span>
            <h2>The second top-chunk corruption shapes a smallbin / tcache-stashing leak.</h2>
            <p>
              After the libc leak, the exploit repeats the same top-chunk corruption pattern from
              page 18, this time writing <code>0xf11</code>. Pages 19 through 32 consume the fake top
              chunk. The resulting allocator state makes glibc place chunks in a smallbin and then
              move entries into tcache through the stashing path.
            </p>
            <p>
              The important detail is the tcache safe-linking encoding. A free tcache chunk stores
              its next pointer as <code>(chunk_user_ptr &gt;&gt; 12) ^ next</code>. If the next pointer is
              effectively NULL for the remaining list entry, the stored value is still heap-derived.
              Page 33 is positioned so its overread reaches that metadata. The exploit subtracts
              <code>0xf80</code> from the observed value to recover the heap base for this deterministic
              allocation sequence.
            </p>
            <div className="formula-strip">
              <span>safe-linking</span>
              <code>stored_fd = next ^ (chunk_user_ptr &gt;&gt; 12)</code>
              <code>heap = heap_leak - 0xf80</code>
            </div>
          </motion.section>

          <motion.section className="attack-chain" aria-label="Exploit stage summary">
            {attackStages.map(([title, text], index) => (
              <motion.div
                className="attack-stage"
                key={title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ delay: index * 0.05, duration: 0.42, ease: 'easeOut' }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.div>
            ))}
          </motion.section>

          <motion.section
            id="fake-file"
            className="writeup-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span>stage 3 · fake FILE / wide-data setup</span>
            <h2>Pages 35 through 40 become the fake glibc runtime used by FSOP.</h2>
            <p>
              With libc and heap bases known, the exploit can use absolute addresses. It creates a
              deterministic block of heap pages: <code>fake</code>, <code>wide</code>,
              <code>chain</code>, <code>ctx_hi</code>, <code>strings</code>, and
              <code>shadow_page</code>. The fake stream uses the real
              <code>_IO_wfile_jumps</code> table so glibc's vtable validation accepts it; control is
              moved into attacker-controlled data later through the fake wide vtable.
            </p>
            <div className="layout-table" role="table" aria-label="Fake object layout">
              {[
                ['page 35', 'fake _IO_FILE_plus', '_IO_write_base=0, _IO_write_ptr=1, _wide_data=wide, _lock=fake+0x90, vtable=_IO_wfile_jumps'],
                ['page 36', 'fake _IO_wide_data', 'MXCSR 0x1f80, wide_vtable=wide+0x88, __doallocate=setcontext'],
                ['page 37', 'ROP chain', 'pop rdi / chroot / system sequence starts at chain+0x20'],
                ['page 38', 'ucontext high half', 'setcontext-readable fields point the pivot toward the shadow trampoline'],
                ['page 39', 'strings', '/bin, ../../, and A=;cat /flag.txt are placed at stable offsets'],
                ['page 40', 'shadow trampoline', 'small bootstrap used between setcontext, pop rsp, and the main chain'],
              ].map(([page, name, detail]) => (
                <div className="layout-row" key={page}>
                  <strong>{page}</strong>
                  <span>{name}</span>
                  <p>{detail}</p>
                </div>
              ))}
            </div>
            <p>
              One subtle trick is <code>adjust_raw(t, 36, 0xe0, p64(chain_start))</code>. Since
              <code>writep</code> only writes from <code>+0x18</code>, the exploit uses the timestamp
              fields written by <code>adjust</code> to place controlled bytes in the metadata area.
              This puts <code>chain_start</code> where the later <code>pop rsp</code> pivot expects it.
            </p>
          </motion.section>

          <TcachePoisonDiagram />

          <motion.section
            id="poison"
            className="writeup-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span>stage 4 · tcache poison</span>
            <h2>The stashed 0x60 entry is poisoned so malloc returns an _IO_list_all overlap.</h2>
            <p>
              The heap leak stage leaves two <code>0x60</code>-size chunks in tcache. The second
              stashed chunk, at <code>heap + 0x21f90</code> in this run layout, has an encoded
              <code>fd</code> field that can be reached through the page-33 overlap. The target is
              <code>_IO_list_all - 0x20</code>, because the returned user pointer is shifted relative
              to the chunk header.
            </p>
            <pre className="code-panel"><code>{`stashed_user = heap + 0x21f90
target = io_list_all - 0x20
encb = p64(target ^ (stashed_user >> 12))
if any(b in BAD_EDIT for b in encb):
    retry_with_new_aslr()
set_bytes(t, 33, 0x78, encb)
adjust(t, 42, 0x40)  # pop harmless first entry
adjust(t, 43, 0x40)  # allocation overlaps _IO_list_all
writep(t, 43, (b'\\0' * 8 + p64(fake)).ljust(0x40, b'\\0'))`}</code></pre>
            <p>
              The bad-byte retry is expected behavior, not exploit instability. If the encoded
              pointer contains whitespace or <code>0x30</code>, the single-byte edit input cannot
              place it reliably, so the exploit restarts and waits for a friendlier ASLR roll.
            </p>
          </motion.section>

          <FsopFlowDiagram />

          <motion.section
            id="fsop"
            className="writeup-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span>stage 5 · FSOP to setcontext</span>
            <h2>exit() walks _IO_list_all and the fake wfile stream becomes a control-flow primitive.</h2>
            <p>
              The final menu option calls <code>exit()</code>. During cleanup, glibc runs
              <code>_IO_cleanup()</code> and then <code>_IO_flush_all_lockp()</code>, which iterates
              <code>_IO_list_all</code>. Because the exploit has overwritten that global list pointer,
              the iterator sees the forged <code>_IO_FILE_plus</code> object.
            </p>
            <p>
              The stream is built so <code>_IO_write_ptr &gt; _IO_write_base</code>, selecting the
              overflow path. With the real <code>_IO_wfile_jumps</code> table, the path reaches
              <code>_IO_wfile_overflow(fake)</code>, then <code>_IO_wdoallocbuf(fake)</code>. The fake
              wide-data object redirects <code>wide_vtable-&gt;__doallocate</code> to
              <code>setcontext</code>, with <code>rdi = fake</code>.
            </p>
            <div className="formula-strip">
              <span>control transfer</span>
              <code>rsp ← [fake + 0xa0] = wide</code>
              <code>rip ← [fake + 0xa8] = pop_rsp</code>
              <code>pop rsp; ret → rsp = [wide + 0x00] = chain_start</code>
            </div>
          </motion.section>

          <motion.section
            id="rop"
            className="writeup-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span>stage 6 · ROP and chroot escape</span>
            <h2>The ROP chain abuses double chroot, then runs cat on the real flag path.</h2>
            <p>
              The ROP chain is intentionally small. It first calls <code>chroot("/bin")</code>.
              Since <code>chroot</code> does not also perform <code>chdir</code>, the current working
              directory remains outside the new root. Then <code>chroot("../../")</code> is resolved
              from that still-useful cwd and moves the process root back to the real filesystem root.
              At that point, <code>system("A=;cat /flag.txt")</code> can read the flag.
            </p>
            <div className="rop-rail">
              {ropSteps.map(([op, arg], index) => (
                <motion.div
                  className="rop-node"
                  key={`${op}-${arg}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                >
                  <span>{op}</span>
                  <strong>{arg}</strong>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}

function BlogPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = category === 'all' || post.category === category;
      const searchableText = [
        post.title,
        post.summary,
        post.excerpt,
        post.category,
        ...post.tags,
      ]
        .join(' ')
        .toLowerCase();

      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, query]);

  return (
    <main className="blogs-shell">
      <SiteNav />

      <section className="blogs-hero">
        <a className="back-link" href={routes.home}>
          <ArrowLeft size={18} />
          Home
        </a>
        <div className="blogs-heading">
          <span>field notes</span>
          <h1>Blogs</h1>
          <p>
            Published writeups live here as full pages, including the Past Diary pwn chain and the HTB Checkpoint Active Directory chain.
          </p>
        </div>
      </section>

      <section className="blog-console" aria-label="Blog search and filters">
        <div className="search-box">
          <Search size={19} />
          <input
            id="blog-search"
            name="blog-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search writeups, tags, or topics"
            aria-label="Search blog posts"
          />
        </div>
        <div className="category-filters" aria-label="Filter blog posts by category">
          {blogCategories.map((item) => (
            <button
              className={item === category ? 'active' : ''}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              <Tag size={15} />
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="blogs-list" aria-live="polite">
        <div className="blog-count">
          <strong>{filteredPosts.length}</strong>
          <span>{filteredPosts.length === 1 ? 'post found' : 'posts found'}</span>
        </div>

        {filteredPosts.map((post, index) => (
          <motion.article
            className="blog-row"
            key={post.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.45, ease: 'easeOut' }}
          >
            <div className="blog-row-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="blog-row-body">
              <div className="blog-meta">
                <span>{post.category}</span>
                <span>{post.date} / {post.read}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <div className="tag-row">
                {post.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <a className="row-read-link" href={post.path}>
                Read writeup
                <ArrowUpRight size={17} />
              </a>
            </div>
          </motion.article>
        ))}

        {filteredPosts.length === 0 ? (
          <div className="empty-state">
            <Search size={24} />
            <p>No posts match that search.</p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}

function App() {
  const [{ path, section }, setRoute] = useState(getRouteFromLocation);

  useEffect(() => {
    const syncRoute = () => setRoute(getRouteFromLocation());
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  useEffect(() => {
    if (!section) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(section)?.scrollIntoView();
    });
  }, [path, section]);

  if (path === '/blogs') return <BlogPage />;
  if (path === '/blogs/checkpoint_htb') return <CheckpointBlogPage />;
  if (path === '/blogs/past_diaries' || path === '/blogs/past_diraies') return <PastDiaryBlogPage />;
  if (path === '/terminal') return <TerminalPage />;

  return <HomePage />;
}

export default App;
