import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => {
    pipe = new TimeAgoPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return "Just now" for dates less than 30s ago', () => {
    const now = new Date();
    expect(pipe.transform(now)).toBe('Just now');
  });

  it('should format minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(pipe.transform(fiveMinutesAgo)).toBe('5m ago');
  });

  it('should format hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(pipe.transform(twoHoursAgo)).toBe('2h ago');
  });

  it('should format yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(pipe.transform(yesterday)).toBe('Yesterday');
  });
});
