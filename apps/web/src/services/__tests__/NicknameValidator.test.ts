import { describe, it, expect } from 'vitest';
import { validateNickname } from '../NicknameValidator';

describe('NicknameValidator', () => {
  it('trims whitespace and accepts valid names including Vietnamese diacritics', () => {
    const res = validateNickname('  Cánh Cụt Bé Nhỏ  ', 'Snowy');
    expect(res.valid).toBe(true);
    expect(res.value).toBe('Cánh Cụt Bé Nhỏ');
  });

  it('normalizes multiple spaces', () => {
    const res = validateNickname('Snowy    Brave   One', 'Snowy');
    expect(res.valid).toBe(true);
    expect(res.value).toBe('Snowy Brave One');
  });

  it('falls back to default species name if empty or only whitespace', () => {
    const res = validateNickname('   ', 'Snowy');
    expect(res.valid).toBe(true);
    expect(res.value).toBe('Snowy');
  });

  it('rejects names longer than 20 characters', () => {
    const res = validateNickname('Super Long Penguin Name Beyond Twenty Characters', 'Snowy');
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('rejects control characters and HTML/script content', () => {
    expect(validateNickname('<script>alert(1)</script>', 'Snowy').valid).toBe(false);
    expect(validateNickname('Penguin <3', 'Snowy').valid).toBe(false); // contains <
    expect(validateNickname('Hello\x00World', 'Snowy').valid).toBe(false); // control char
  });

  it('allows safe punctuation characters', () => {
    const res = validateNickname('P-1, Cool. Guy!?', 'Snowy');
    expect(res.valid).toBe(true);
    expect(res.value).toBe('P-1, Cool. Guy!?');
  });

  it('normalizes decomposed Unicode (NFD) to NFC canonical composition', () => {
    // 'Cánh Cụt' in decomposed form (NFD: base letter + combining diacritic)
    const decomposed = 'Ca\u0301nh Cu\u0323t';
    const res = validateNickname(decomposed, 'Snowy');
    expect(res.valid).toBe(true);
    expect(res.value).toBe('Cánh Cụt');
    expect(res.value).toBe(decomposed.normalize('NFC'));
  });
});
