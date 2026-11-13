import { config, fields, collection } from '@keystatic/core';

const isGitHub =
  process.env.KEYSTATIC_STORAGE_KIND === 'github' ||
  (Boolean(process.env.KEYSTATIC_GITHUB_CLIENT_ID) && process.env.NODE_ENV === 'production');

export default config({
  storage: isGitHub
    ? {
        kind: 'github',
        repo: {
          owner: 'bazzaroffice5-oss',
          name: 'Office-Bazzar-Website',
        },
      }
    : { kind: 'local' },
  ui: {
    brand: {
      name: 'OfficeBazzar Blog CMS',
    },
    navigation: {
      'Editorial & Blog': ['posts'],
    },
  },
  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'content/posts/*/',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({
          name: {
            label: 'Article Title',
            validation: { isRequired: true },
          },
          slug: {
            label: 'URL Slug',
            description: 'URL path: /blog/[slug]',
          },
        }),
        status: fields.select({
          label: 'Publication Status',
          description: 'Only published articles appear on the public website and sitemap.',
          options: [
            { label: 'Published (Live)', value: 'published' },
            { label: 'Draft (Internal Preview)', value: 'draft' },
          ],
          defaultValue: 'published',
        }),
        publishedDate: fields.date({
          label: 'Publication Date',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        author: fields.text({
          label: 'Author Name',
          defaultValue: 'Office Bazzar Team',
          validation: { isRequired: true },
        }),
        category: fields.select({
          label: 'Primary Category',
          options: [
            { label: 'Housekeeping & Hygiene', value: 'Housekeeping & Hygiene' },
            { label: 'Office Stationery', value: 'Office Stationery' },
            { label: 'Workplace Procurement', value: 'Workplace Procurement' },
            { label: 'Printers & Technology', value: 'Printers & Technology' },
            { label: 'Packaging Supplies', value: 'Packaging Supplies' },
            { label: 'Corporate Facility Management', value: 'Corporate Facility Management' },
            { label: 'Procurement Advisory', value: 'Procurement Advisory' },
          ],
          defaultValue: 'Housekeeping & Hygiene',
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          {
            label: 'Tags',
            itemLabel: (props) => props.value || 'New Tag',
          }
        ),
        featuredImage: fields.image({
          label: 'Featured Hero Image',
          directory: 'public/images/blog',
          publicPath: '/images/blog',
          validation: { isRequired: false },
        }),
        imageAlt: fields.text({
          label: 'Image Alt Text',
          description: 'Descriptive text for accessibility and search engines',
        }),
        excerpt: fields.text({
          label: 'Article Excerpt / Summary',
          multiline: true,
          description: 'Brief summary displayed on blog cards and Google snippets.',
          validation: { isRequired: true },
        }),
        seoTitle: fields.text({
          label: 'SEO Meta Title',
          description: 'Custom Google title (Recommended: 50-60 characters).',
        }),
        seoDescription: fields.text({
          label: 'SEO Meta Description',
          multiline: true,
          description: 'Custom Google description (Recommended: 120-155 characters).',
        }),
        focusKeyword: fields.text({
          label: 'Focus Keyword',
          description: 'Target search query for internal tracking.',
        }),
        canonicalUrl: fields.text({
          label: 'Canonical URL Override',
          description: 'Defaults to https://www.officebazzar.com/blog/[slug]',
        }),
        content: fields.document({
          label: 'Article Content',
          formatting: {
            alignment: true,
            blockTypes: {
              blockquote: true,
              code: true,
            },
            headingLevels: [2, 3, 4],
            inlineMarks: {
              bold: true,
              italic: true,
              underline: true,
              strikethrough: true,
              code: true,
            },
            listTypes: {
              ordered: true,
              unordered: true,
            },
          },
          dividers: true,
          links: true,
          images: {
            directory: 'public/images/blog',
            publicPath: '/images/blog',
          },
          tables: true,
        }),
      },
    }),
  },
});
