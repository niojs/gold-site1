/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone нужен только для self-hosted/Vercel продакшена.
  // Локально (npm run dev / STANDALONE=0 next start) удобнее обычный вывод:
  // standalone-копия .next при живых процессах блокируется Windows.
  ...(process.env.STANDALONE === '0' ? {} : { output: 'standalone' }),
};

module.exports = nextConfig;