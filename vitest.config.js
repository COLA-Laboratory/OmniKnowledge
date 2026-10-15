// Vitest runs the unit tests of the kit's pure functions and of the generated layouts.
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/unit/**/*.test.js'] } });
