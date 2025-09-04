import assert from 'assert';
import test from 'node:test';
import { applyGuardrails } from '../guardrails.js';

test('removes meta references', () => {
  const cleaned = applyGuardrails('As an AI, I think this works.');
  assert.ok(!/AI/i.test(cleaned));
});

test('allows explicit content', () => {
  const sanitized = applyGuardrails('She wants to have sex');
  assert.equal(sanitized, 'She wants to have sex');
});
