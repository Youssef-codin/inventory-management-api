import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        setupFiles: ['./tests/setup.ts'],
        fileParallelism: false,
        include: ['tests/**/*.test.ts'],
        exclude: ['tests/perf/**', '**/node_modules/**'],
    },
});
