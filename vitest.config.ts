import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'src/**/*.test.ts',
        'src/auto_buffer.ts',
        'src/auto_data.ts',
        'src/instruction_models.ts',
        'src/types/**',
        'src/index.old.ts'
      ]
    }
  }
});
