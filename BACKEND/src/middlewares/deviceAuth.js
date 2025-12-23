export const deviceAuth = (req, res, next) => {
  console.log('❌ deviceAuth HIT — SHOULD NOT HAPPEN');
  next();
};
