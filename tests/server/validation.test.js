/**
 * Input validation tests.
 * Ensures all request payloads are strictly validated.
 */

import { describe, it, expect } from 'vitest';
import {
  validateRecommendRequest,
  validateExplainRequest,
  VALID_TYPES,
  VALID_ZONES,
} from '../../server/utils/validation.js';

describe('validateRecommendRequest', () => {
  it('accepts valid input', () => {
    const result = validateRecommendRequest({ type: 'restroom', userZone: 'zone-north' });
    expect(result.valid).toBe(true);
    expect(result.data.type).toBe('restroom');
    expect(result.data.userZone).toBe('zone-north');
  });

  it('rejects null body', () => {
    const result = validateRecommendRequest(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects non-object body', () => {
    const result = validateRecommendRequest('string');
    expect(result.valid).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = validateRecommendRequest({ type: 'invalid', userZone: 'zone-north' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('type');
  });

  it('rejects XSS in type field', () => {
    const result = validateRecommendRequest({ type: '<script>alert(1)</script>', userZone: 'zone-north' });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid zone', () => {
    const result = validateRecommendRequest({ type: 'food', userZone: 'zone-hacker' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('userZone');
  });

  it('rejects missing type', () => {
    const result = validateRecommendRequest({ userZone: 'zone-north' });
    expect(result.valid).toBe(false);
  });

  it('rejects missing userZone', () => {
    const result = validateRecommendRequest({ type: 'food' });
    expect(result.valid).toBe(false);
  });

  it('accepts all valid types', () => {
    VALID_TYPES.forEach((type) => {
      const result = validateRecommendRequest({ type, userZone: 'zone-north' });
      expect(result.valid).toBe(true);
    });
  });

  it('accepts all valid zones', () => {
    VALID_ZONES.forEach((zone) => {
      const result = validateRecommendRequest({ type: 'food', userZone: zone });
      expect(result.valid).toBe(true);
    });
  });
});

describe('validateExplainRequest', () => {
  const validBody = {
    recommendationId: 'restroom-north-b',
    type: 'restroom',
    userZone: 'zone-north',
  };

  it('accepts valid input', () => {
    const result = validateExplainRequest(validBody);
    expect(result.valid).toBe(true);
  });

  it('rejects empty recommendationId', () => {
    const result = validateExplainRequest({ ...validBody, recommendationId: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects recommendationId with special characters', () => {
    const result = validateExplainRequest({ ...validBody, recommendationId: 'foo; DROP TABLE' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid characters');
  });

  it('rejects overly long recommendationId', () => {
    const result = validateExplainRequest({ ...validBody, recommendationId: 'a'.repeat(101) });
    expect(result.valid).toBe(false);
  });

  it('rejects null body', () => {
    const result = validateExplainRequest(null);
    expect(result.valid).toBe(false);
  });
});
