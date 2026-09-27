export interface NicknameValidationResult {
  valid: boolean;
  value: string;
  error?: string;
}

export function validateNickname(
  input: string,
  fallbackName: string
): NicknameValidationResult {
  // Normalize Unicode to NFC, trim and normalize multiple spaces to a single space
  const normalized = input.normalize('NFC').trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return { valid: true, value: fallbackName };
  }

  // Unicode length check (max 20 characters)
  const charLength = Array.from(normalized).length;
  if (charLength > 20) {
    return {
      valid: false,
      value: normalized,
      error: 'Tên không được vượt quá 20 ký tự.',
    };
  }

  // Check for control characters (0-31, 127)
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      return {
        valid: false,
        value: normalized,
        error: 'Tên chứa ký tự điều khiển không hợp lệ.',
      };
    }
  }

  // Reject HTML/Script tag characters (<, >, &, ", ')
  if (/[<>&"']/.test(normalized)) {
    return {
      valid: false,
      value: normalized,
      error: 'Tên không được chứa các ký tự đặc biệt như < > & " \'.',
    };
  }

  // Allow standard letters (including full Vietnamese Unicode block), numbers, spaces, and safe punctuation: - _ . , ! ?
  const validPattern = /^[\p{L}\p{N}\s\-_.,!?]+$/u;
  if (!validPattern.test(normalized)) {
    return {
      valid: false,
      value: normalized,
      error: 'Tên chỉ được chứa chữ cái, số, khoảng trắng và dấu câu thông dụng.',
    };
  }

  return {
    valid: true,
    value: normalized,
  };
}
