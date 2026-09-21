export default function handler(req, res) {
  console.log('[PING-ENTRY]', req.method, req.url);
  res.status(200).json({ ok: true, method: req.method });
}
