import app from './api/index.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Local development server running on http://localhost:${PORT}`);
});
