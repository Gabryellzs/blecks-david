import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // As configurações de 'webpack' e 'experimental' foram removidas
  // pois estavam causando erros de compilação.
  // As correções para 'localStorage' já foram aplicadas diretamente nos arquivos relevantes.
};

export default nextConfig;
