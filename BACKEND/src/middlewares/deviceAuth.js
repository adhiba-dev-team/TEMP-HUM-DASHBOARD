export const deviceAuth = (req, res, next) => {
  const key = req.headers['x-api-key'];

  if (!key || key !== process.env.DEVICE_API_KEY) {
    return res.status(401).json({ error: 'invalid apikey' });
  }

  next();
};
