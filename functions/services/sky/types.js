/**
 * SkyMessage - Type Definitions (JSDoc)
 */

/**
 * @typedef {Object} SaintProfile
 * @property {string} slug
 * @property {string} displayName
 * @property {string[]} [aliases]
 * @property {{year?: number, place?: string}} [birth]
 * @property {{year?: number, place?: string}} [death]
 * @property {string} [feastDay] - Format: "MM-DD"
 * @property {string[]} [patronages]
 * @property {string[]} [orders]
 * @property {string} [era]
 * @property {string} [summaryPD]
 * @property {SourceAttribution[]} sources
 * @property {string[]} [tags]
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {Object} SourceAttribution
 * @property {string} url
 * @property {string} [title]
 * @property {string} [publisher]
 * @property {"PD"|"Permitted"|"Unknown"|"Restricted"} [license]
 * @property {string} [crawlId]
 * @property {Array<{pid: string, textHash: string}>} [paragraphs]
 */

/**
 * @typedef {Object} SaintChunk
 * @property {string} saintSlug
 * @property {number} idx
 * @property {string} text
 * @property {string} sourceUrl
 * @property {string} hash
 * @property {number[]} [embedding]
 * @property {{feastDay?: string, patronages?: string[], era?: string, publisher?: string}} [meta]
 */

/**
 * @typedef {"saint"|"emoji-story"|"plain"} AskStyle
 */

/**
 * @typedef {Object} AskSkyRequest
 * @property {string} query
 * @property {string} [saintSlug]
 * @property {AskStyle} [style]
 * @property {"kids"|"adult"} [audience]
 */

/**
 * @typedef {Object} AskSkyResponse
 * @property {string} text
 * @property {Array<{publisher?: string, url?: string}>} sources
 * @property {string} saint
 */

module.exports = {};

