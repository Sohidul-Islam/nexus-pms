import { PriorityBadgePipe } from './priority-badge.pipe';

describe('PriorityBadgePipe', () => {
  let pipe: PriorityBadgePipe;

  beforeEach(() => {
    pipe = new PriorityBadgePipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform URGENT priority', () => {
    const res = pipe.transform('URGENT');
    expect(res.label).toBe('Urgent');
    expect(res.cssClass).toBe('badge-urgent');
  });

  it('should transform HIGH priority', () => {
    const res = pipe.transform('HIGH');
    expect(res.label).toBe('High');
    expect(res.cssClass).toBe('badge-high');
  });

  it('should default to Medium for undefined priority', () => {
    const res = pipe.transform(undefined);
    expect(res.label).toBe('Medium');
    expect(res.cssClass).toBe('badge-medium');
  });
});
