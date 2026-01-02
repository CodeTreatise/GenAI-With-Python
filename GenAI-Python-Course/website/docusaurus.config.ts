import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'GenAI Python Course',
  tagline: 'Master Generative AI Development with Python - From Fundamentals to Production',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://CodeTreatise.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/GenAI-With-Python/',

  // GitHub pages deployment config.
  organizationName: 'CodeTreatise', // Your GitHub username
  projectName: 'GenAI-With-Python', // Your repo name
  trailingSlash: false,

  // Markdown processing
  // Many course lessons are plain `.md` and may contain text that is invalid MDX/JSX.
  // Use `detect` so `.md` is parsed as Markdown and `.mdx` (if present) as MDX.
  markdown: {
    format: 'detect',
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  onBrokenLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/CodeTreatise/GenAI-With-Python/tree/main/website/',
          showLastUpdateTime: false,
          breadcrumbs: true,
        },
        blog: false, // Disable blog for now
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Social card for sharing
    image: 'img/social-card.jpg',
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    // Announcement bar
    announcementBar: {
      id: 'course_launch',
      content: '🚀 <strong>New!</strong> Complete GenAI Python Course - Learn LLMs, RAG, LangGraph & Production Deployment',
      backgroundColor: '#4f46e5',
      textColor: '#ffffff',
      isCloseable: true,
    },
    navbar: {
      title: 'GenAI Python',
      logo: {
        alt: 'GenAI Python Course Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'courseSidebar',
          position: 'left',
          label: '📚 Course',
        },
        {
          to: '/docs/overview',
          label: '🎯 Overview',
          position: 'left',
        },
        {
          href: 'https://github.com/CodeTreatise/GenAI-With-Python',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Course',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Prerequisites',
              to: '/docs/prerequisites',
            },
            {
              label: 'Modules',
              to: '/docs/modules',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Glossary',
              to: '/docs/glossary',
            },
            {
              label: 'FAQ',
              to: '/docs/faq',
            },
          ],
        },
        {
          title: 'Connect',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/CodeTreatise/GenAI-With-Python',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} GenAI Python Course. Built with ❤️ and Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash', 'json', 'yaml', 'docker', 'sql'],
    },
    // Mermaid configuration for diagrams
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
