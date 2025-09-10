export function getHostname(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error('Invalid URL:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

describe('getHostname', () => {
  it('should extract hostname from a valid HTTPS URL', () => {
    expect(getHostname('https://www.example.com/path')).toBe('www.example.com');
  });

  it('should extract hostname from a valid HTTP URL', () => {
    expect(getHostname('http://localhost:3000')).toBe('localhost');
  });

  it('should return null for an invalid URL', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    expect(getHostname('invalid-url')).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid URL:', expect.any(String));
    consoleErrorSpy.mockRestore();
  });

  it('should extract hostname from a URL without path', () => {
    expect(getHostname('https://api.example.com')).toBe('api.example.com');
  });

  it('should extract hostname from a URL with query parameters', () => {
    expect(getHostname('https://example.com/path?a=1&b=2')).toBe('example.com');
  });

  it('should handle URLs with special characters', () => {
    expect(getHostname('https://sub-domain.example.com')).toBe('sub-domain.example.com');
  });
});
