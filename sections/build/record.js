/**
 * What the Build picture shows, as data: the kinds of search step, the three presets, the
 * library of filters a pipeline is built from, and the record of each preset's run. Each preset
 * is its own illustration, with its own steps, filters and numbers; none of them is the page's
 * main example (kit/example.js).
 */

/**
 * @typedef {'seed' | 'back' | 'fwd' | 'sem' | 'db'} Kind
 * @typedef {'light' | 'medium' | 'heavy'} PresetId
 * @typedef {import('../../kit/example.js').FilterId} FilterId
 * @typedef {object} LibraryFilter What the user set in a filter, in one of three forms.
 * @property {string} name
 * @property {string} [setting] A rule on a paper's record.
 * @property {string} [query] Words matched in title and abstract.
 * @property {string[]} [prompt] The question an LLM answers, as the lines it is shown in.
 * @typedef {object} RunRecord The record of one preset's run.
 * @property {number} found The papers its steps found together.
 * @property {number} merged The duplicates merged.
 * @property {FilterId[]} filters Its filters, in order.
 * @property {number[]} pass The papers that go on after each filter; the last are kept.
 */

/** A kind of step: its name (split where the narrow card breaks it) and what it does. */
export const KINDS = {
  seed: { name: ['Seed', 'set'], does: 'The papers you trust' },
  back: { name: ['Backward', 'Searcher'], does: 'The papers each paper cites' },
  fwd: { name: ['Forward', 'Searcher'], does: 'The papers that cite it' },
  sem: { name: ['Semantic', 'Search'], does: 'The papers closest in meaning' },
  db: { name: ['Database', 'Search'], does: 'Queries written from the question' },
};

/**
 * The presets: rows from top to bottom; the steps of one row (two at most) run side by side. A
 * step keeps its id from preset to preset, so it is seen to move, not to be replaced.
 *
 * @type {{ id: PresetId, rows: string[][] }[]}
 */
export const PRESETS = [
  { id: 'light', rows: [['seed'], ['b1', 'f1'], ['s1']] },
  { id: 'medium', rows: [['seed'], ['b1', 'f1'], ['s1', 'd1'], ['b2']] },
  { id: 'heavy', rows: [['seed'], ['d1'], ['b1', 'f1'], ['b2', 'f2'], ['s1']] },
];

/**
 * Returns the kind of a step from its id.
 *
 * @param {string} id
 * @returns {Kind}
 */
export const kindOf = (id) =>
  id === 'seed' ? 'seed' : /** @type {Record<string, Kind>} */ ({ b: 'back', f: 'fwd', s: 'sem', d: 'db' })[id.charAt(0)];

/** The papers each search step found. @type {Record<string, number>} */
export const FOUND = { b1: 3480, f1: 2960, d1: 2110, s1: 4630, b2: 1770, f2: 1540 };

/** The filters a pipeline can be built from, by id. @type {Record<FilterId, LibraryFilter>} */
export const LIBRARY = {
  year: { name: 'Year', setting: '2015 or later' },
  citations: { name: 'Citations', setting: 'At least 5 a year' },
  venue: { name: 'Venue', setting: 'Peer-reviewed, no preprints' },
  keywords: { name: 'Keywords', query: 'microplastic* OR nanoplastic*' },
  title: { name: 'Title criteria', prompt: ['Does the title describe a study', 'of a freshwater fish species?'] },
  abstract: {
    name: 'Abstract criteria',
    prompt: [
      'Does the abstract report an exposure',
      'experiment with micro- or nanoplastics',
      'and a measured effect on the fish?',
    ],
  },
  fulltext: {
    name: 'Full-text criteria',
    prompt: [
      'Does the paper state particle size,',
      'dose and exposure duration, include',
      'an unexposed control group and',
      'report its outcomes with statistics?',
    ],
  },
};

/** Each preset's run. @type {Record<PresetId, RunRecord>} */
export const RECORD = {
  light: {
    found: 11070,
    merged: 1730,
    filters: ['year', 'citations', 'venue', 'keywords', 'title', 'abstract'],
    pass: [6400, 4670, 3990, 1430, 480, 245],
  },
  medium: {
    found: 14950,
    merged: 2550,
    filters: ['year', 'venue', 'keywords', 'title', 'abstract', 'fulltext'],
    pass: [8500, 7300, 2600, 900, 380, 212],
  },
  heavy: {
    found: 16490,
    merged: 3090,
    filters: ['year', 'citations', 'keywords', 'title', 'abstract', 'fulltext'],
    pass: [9180, 6700, 2650, 920, 395, 230],
  },
};

/** The preset shown first. */
export const FIRST = 'medium';
