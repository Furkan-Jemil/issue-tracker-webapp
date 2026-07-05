// Dead-simple probe: proves the Vercel function system works.
// No imports, no TypeScript, classic Node (req, res) signature.
module.exports = (req, res) => {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ hello: true, node: process.version, hasDbUrl: !!process.env.DATABASE_URL }));
};
