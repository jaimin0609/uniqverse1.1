import { cn } from '../cn';

describe('cn utility function', () => {
    it('should return an empty string when no arguments are provided', () => {
        expect(cn()).toBe('');
    });

    it('should handle a single string argument', () => {
        expect(cn('foo')).toBe('foo');
    });

    it('should handle multiple string arguments', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle an array of strings', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle an object with boolean values', () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should handle mixed arguments (strings, arrays, objects)', () => {
        expect(cn('foo', ['bar', { baz: true, qux: false }], 'quux')).toBe('foo bar baz quux');
    });

    it('should correctly merge Tailwind CSS classes (tailwind-merge behavior)', () => {
        // Example: p-2 and p-4 should result in p-4 (last one wins for same property)
        expect(cn('p-2', 'p-4')).toBe('p-4');
        // Example: text-left and text-center should result in text-center
        expect(cn('text-left', 'text-center')).toBe('text-center');
    });

    it('should handle conflicting Tailwind CSS classes correctly', () => {
        // Example: bg-red-500 and bg-blue-500 should result in bg-blue-500 (last one wins)
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
        // Example: conflicting padding and margin
        expect(cn('p-4 m-2', 'p-2 m-4')).toBe('p-2 m-4');
    });

    it('should handle conditional classes with falsy values', () => {
        expect(cn('foo', null, 'bar', undefined, { baz: true, qux: null }, false && 'not-this')).toBe('foo bar baz');
    });

    it('should handle complex combinations from clsx documentation examples', () => {
        expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
        expect(cn({ foo: true, bar: false, duck: true })).toBe('foo duck');
        expect(cn(['foo', { bar: true, duck: false }], 'baz', { quux: true })).toBe('foo bar baz quux');
    });
});
