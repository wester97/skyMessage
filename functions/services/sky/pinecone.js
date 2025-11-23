/**
 * SkyMessage - Pinecone Vector Operations
 */

const { Pinecone } = require("@pinecone-database/pinecone");

let pc = null;
let _index = null;

function getClient() {
  if (!pc) {
    pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY?.trim() });
  }
  return pc;
}

function getIndex() {
  if (!_index) {
    const client = getClient();
    _index = client.index(process.env.PINECONE_INDEX || "saints-v1");
  }
  return _index;
}

async function upsertChunks(namespace, chunks) {
  const index = getIndex();
  await index.namespace(namespace).upsert(chunks);
}

async function queryChunks(namespace, vector, topK, filter) {
  const index = getIndex();
  return index.namespace(namespace).query({
    vector,
    topK,
    includeMetadata: true,
    filter,
  });
}

module.exports = {
  getClient,
  getIndex,
  upsertChunks,
  queryChunks,
};

