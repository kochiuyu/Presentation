import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function copyIndexTo404(): Plugin {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const distIndex = path.resolve('dist/index.html');
      const dist404 = path.resolve('dist/404.html');
      if (fs.existsSync(distIndex)) {
        fs.copyFileSync(distIndex, dist404);
      }
    },
  };
}

export default defineConfig(() => {
  // If running in GitHub Actions, automatically detect the repository name from GITHUB_REPOSITORY (e.g. "kochiuyu/Presentation")
  // and set base to "/Presentation/", or allow explicit BASE_PATH.
  // Fall back to './' for local dev or standalone file builds.
  const repoName = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : './';
  const base = process.env.BASE_PATH || repoName;

  return {
    base,
    plugins: [react(), tailwindcss(), copyIndexTo404()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
