import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    // Exclude workspace packages so Rollup bundles them from TypeScript source.
    // better-sqlite3 and bcryptjs are transitive deps that live in workspace
    // package.json files (not in apps/desktop/package.json), so externalizeDepsPlugin
    // doesn't see them. We list them explicitly so they are never bundled — native
    // .node binaries can't survive bundling.
    plugins: [
      externalizeDepsPlugin({
        exclude: ['@my-pos/shared', '@my-pos/database', '@my-pos/core', '@my-pos/ipc'],
      }),
    ],
    build: {
      rollupOptions: {
        external: ['better-sqlite3', 'bcryptjs', /\.node$/],
      },
    },
    resolve: {
      alias: {
        '@my-pos/shared': resolve('../../packages/shared/src/index.ts'),
        '@my-pos/database': resolve('../../packages/database/src/index.ts'),
        '@my-pos/core': resolve('../../packages/core/src/index.ts'),
        '@my-pos/ipc': resolve('../../packages/ipc/src/index.ts'),
      },
    },
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['@my-pos/ipc', '@my-pos/ipc/channels', '@my-pos/shared'],
      }),
    ],
    resolve: {
      alias: {
        // Resolve only channels to avoid pulling in ipcMain (main-process only)
        '@my-pos/ipc/channels': resolve('../../packages/ipc/src/channels.ts'),
        '@my-pos/shared': resolve('../../packages/shared/src/index.ts'),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@my-pos/ipc/channels': resolve('../../packages/ipc/src/channels.ts'),
        '@my-pos/ipc': resolve('../../packages/ipc/src/index.ts'),
        '@my-pos/shared': resolve('../../packages/shared/src/index.ts'),
      },
    },
    plugins: [react()],
  },
});
