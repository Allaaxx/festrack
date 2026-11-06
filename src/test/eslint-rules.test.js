import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

describe('ESLint custom guardrail rules', () => {
  const eslint = new ESLint();

  describe('no-restricted-syntax: asChild', () => {
    it('fails linting when JSX uses asChild prop with error directing to use render', async () => {
      const code = `
export function CustomButton() {
  return <button asChild><span /></button>;
}
`;
      const [result] = await eslint.lintText(code, {
        filePath: 'src/components/example.jsx',
      });

      const asChildError = result.messages.find(
        (msg) => msg.ruleId === 'no-restricted-syntax'
      );
      expect(asChildError).toBeDefined();
      expect(asChildError.message).toContain("Do not use 'asChild'");
      expect(asChildError.message).toContain('render={<Button />}');
    });

    it('passes linting when JSX uses render prop', async () => {
      const code = `
export function CustomButton() {
  return <button render={<span />} />;
}
`;
      const [result] = await eslint.lintText(code, {
        filePath: 'src/components/example.jsx',
      });

      const asChildError = result.messages.find(
        (msg) => msg.ruleId === 'no-restricted-syntax'
      );
      expect(asChildError).toBeUndefined();
    });
  });

  describe('no-restricted-imports: feature boundary imports', () => {
    it('fails when an outside file imports deep feature paths', async () => {
      const code = `
import ShopService from '@/features/shops/api/services';
import Something from '@/features/events/components/something';
`;
      const [result] = await eslint.lintText(code, {
        filePath: 'src/pages/example.jsx',
      });

      const importErrors = result.messages.filter(
        (msg) => msg.ruleId === 'no-restricted-imports'
      );
      expect(importErrors.length).toBe(2);
      expect(importErrors[0].message).toContain('@/features/shops');
      expect(importErrors[1].message).toContain('@/features/events');
    });

    it('passes when an outside file imports through the public barrel', async () => {
      const code = `
import { ShopService } from '@/features/shops';
import { EventList } from '@/features/events';
`;
      const [result] = await eslint.lintText(code, {
        filePath: 'src/pages/example.jsx',
      });

      const importErrors = result.messages.filter(
        (msg) => msg.ruleId === 'no-restricted-imports'
      );
      expect(importErrors).toHaveLength(0);
    });

    it('passes when intra-feature imports are within the same feature', async () => {
      const code = `
import ShopService from '@/features/shops/api/services';
import { useShops } from '@/features/shops/api/hooks';
`;
      const [result] = await eslint.lintText(code, {
        filePath: 'src/features/shops/components/test.jsx',
      });

      const importErrors = result.messages.filter(
        (msg) => msg.ruleId === 'no-restricted-imports'
      );
      expect(importErrors).toHaveLength(0);
    });

    it('fails when a feature file imports deep paths from another feature', async () => {
      const code = `
import { EventService } from '@/features/events/api/services';
`;
      const [result] = await eslint.lintText(code, {
        filePath: 'src/features/shops/components/test.jsx',
      });

      const importErrors = result.messages.filter(
        (msg) => msg.ruleId === 'no-restricted-imports'
      );
      expect(importErrors.length).toBeGreaterThan(0);
      expect(importErrors[0].message).toContain('@/features/events');
    });
  });
});
