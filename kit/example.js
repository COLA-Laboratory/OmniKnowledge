/**
 * The example the pictures tell: one question, its seed papers, the searches and filters it
 * runs through and the numbers at each step. Illustrative. The Build section's presets are
 * separate illustrations with their own records (sections/build/record.js).
 */

/**
 * @typedef {'cite' | 'sem' | 'db'} SearchKey
 * @typedef {'year' | 'citations' | 'venue' | 'keywords' | 'title' | 'abstract' | 'fulltext'} FilterId
 * @typedef {object} Filter
 * @property {FilterId} id A stable key; names are for reading only.
 * @property {string} name
 * @property {string} reads What part of a paper it reads, in words.
 * @property {string} setting What the user set, in the user's words.
 * @property {number} pass How many papers pass it.
 * @property {boolean} model An LLM screens it; otherwise a rule checks it.
 */

export const EXAMPLE = {
  question: 'How does microplastic exposure affect freshwater fish?',
  seeds: ['Li et al. 2021', 'Chen et al. 2019', 'Park et al. 2018'],
  /** @type {{ key: SearchKey, name: string, found: number }[]} */
  searches: [
    { key: 'cite', name: 'Citation tracing', found: 8210 },
    { key: 'sem', name: 'Semantic Search', found: 4630 },
    { key: 'db', name: 'Database Search', found: 2110 },
  ],
  found: 14950,
  deduped: 12400,
  /** @type {Filter[]} */
  filters: [
    { id: 'year', name: 'Year', reads: 'the year', setting: '2015 or later', pass: 8500, model: false },
    { id: 'citations', name: 'Citations', reads: 'the citation count', setting: 'At least 5 a year', pass: 6200, model: false },
    { id: 'venue', name: 'Venue', reads: 'the venue', setting: 'Peer-reviewed, no preprints', pass: 5300, model: false },
    {
      id: 'keywords',
      name: 'Keywords',
      reads: 'words in title and abstract',
      setting: 'microplastic* OR nanoplastic*',
      pass: 1900,
      model: false,
    },
    {
      id: 'title',
      name: 'Title criteria',
      reads: 'the title',
      setting: 'Studies a freshwater fish species',
      pass: 650,
      model: true,
    },
    {
      id: 'abstract',
      name: 'Abstract criteria',
      reads: 'the abstract',
      setting: 'Reports an exposure experiment',
      pass: 320,
      model: true,
    },
    {
      id: 'fulltext',
      name: 'Full-text criteria',
      reads: 'the full text',
      setting: 'Reports dose and duration',
      pass: 212,
      model: true,
    },
  ],
  kept: 212,
  tasks: ['Literature review', 'Hypothesis generation', 'Experiment planning', 'Results interpretation'],
};
