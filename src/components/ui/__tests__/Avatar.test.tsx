import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '../avatar';

describe('Avatar component', () => {
    let originalImage: typeof Image;
    let mockImageInstance: {
        onload?: () => void;
        onerror?: () => void;
        src?: string;
        addEventListener: jest.Mock<any, [string, () => void]>;
        removeEventListener: jest.Mock;
        __triggerLoad?: () => void;
        __triggerError?: () => void;
        _src?: string;
    };

    beforeEach(() => {
        originalImage = global.Image;
        // @ts-ignore
        global.Image = jest.fn(() => {
            const instance = {
                onload: undefined as (() => void) | undefined,
                onerror: undefined as (() => void) | undefined,
                _src: '',
                addEventListener: jest.fn((event: string, cb: () => void) => {
                    if (event === 'load') {
                        instance.onload = cb;
                    } else if (event === 'error') {
                        instance.onerror = cb;
                    }
                }),
                removeEventListener: jest.fn(),
                set src(newSrc: string) { instance._src = newSrc; },
                get src() { return instance._src; },
            };
            mockImageInstance = instance as any;

            mockImageInstance.__triggerLoad = () => {
                if (mockImageInstance.onload) {
                    act(() => {
                        mockImageInstance.onload!();
                    });
                }
            };
            mockImageInstance.__triggerError = () => {
                if (mockImageInstance.onerror) {
                    act(() => {
                        mockImageInstance.onerror!();
                    });
                }
            };
            return instance;
        });
    });

    afterEach(() => {
        global.Image = originalImage;
        jest.restoreAllMocks();
    });

    it('should render Avatar with default classes', () => {
        render(<Avatar data-testid="avatar-root" />);
        const avatarElement = screen.getByTestId('avatar-root');
        expect(avatarElement).toBeInTheDocument();
        expect(avatarElement).toHaveClass('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full');
    });

    it('should apply additional className to Avatar', () => {
        render(<Avatar data-testid="avatar-root" className="custom-avatar-class" />);
        expect(screen.getByTestId('avatar-root')).toHaveClass('custom-avatar-class');
    });

    describe('AvatarImage', () => {
        it('should render AvatarImage with src and alt attributes when image loads successfully', async () => {
            render(
                <Avatar>
                    <AvatarImage src="test-image.jpg" alt="Test Alt Text" data-testid="avatar-image" />
                    <AvatarFallback>FB</AvatarFallback>
                </Avatar>
            );

            expect(global.Image).toHaveBeenCalledTimes(1);
            if (mockImageInstance && mockImageInstance.__triggerLoad) {
                mockImageInstance.__triggerLoad();
            } else {
                throw new Error("Mock image instance or __triggerLoad not found for success test");
            }

            const imageElement = await screen.findByTestId('avatar-image');
            expect(imageElement).toBeInTheDocument();
            expect(imageElement).toHaveAttribute('src', 'test-image.jpg');
            expect(imageElement).toHaveAttribute('alt', 'Test Alt Text');
            expect(imageElement).toHaveClass('aspect-square h-full w-full');
            expect(screen.queryByText('FB')).not.toBeInTheDocument();
        });

        it('should apply additional className to AvatarImage when image loads successfully', async () => {
            render(
                <Avatar>
                    <AvatarImage src="test.jpg" alt="test" className="custom-image-class" data-testid="avatar-image" />
                    <AvatarFallback>FB</AvatarFallback>
                </Avatar>
            );

            expect(global.Image).toHaveBeenCalledTimes(1);
            if (mockImageInstance && mockImageInstance.__triggerLoad) {
                mockImageInstance.__triggerLoad();
            } else {
                throw new Error("Mock image instance or __triggerLoad not found for className test");
            }

            const imageElement = await screen.findByTestId('avatar-image');
            expect(imageElement).toHaveClass('custom-image-class');
            expect(screen.queryByText('FB')).not.toBeInTheDocument();
        });
    });

    describe('AvatarFallback', () => {
        it('should render AvatarFallback with children (e.g. when no image src)', () => {
            render(
                <Avatar>
                    <AvatarFallback data-testid="avatar-fallback">JD</AvatarFallback>
                </Avatar>
            );
            const fallbackElement = screen.getByTestId('avatar-fallback');
            expect(fallbackElement).toBeInTheDocument();
            expect(fallbackElement).toHaveTextContent('JD');
            expect(fallbackElement).toHaveClass('flex h-full w-full items-center justify-center rounded-full bg-muted');
        });

        it('should render AvatarFallback if AvatarImage has no src', async () => {
            render(
                <Avatar>
                    <AvatarImage src="" alt="Empty src" data-testid="avatar-image-empty" />
                    <AvatarFallback>FB</AvatarFallback>
                </Avatar>
            );

            // If src is empty, Radix useEffect for image loading sets status to 'error' directly.
            // global.Image constructor might not be called by Radix in this case.
            // Let's verify this behavior.
            if (global.Image && (global.Image as jest.Mock).mock.calls.length > 0) {
                // If it was called, it implies an image was attempted to load, which is unexpected for empty src
                // depending on Radix version/implementation details.
                // For now, we assume it might be called, and if so, error should be triggered or it defaults to error.
                if (mockImageInstance && mockImageInstance.__triggerError) {
                    // This might not be necessary if Radix handles empty src by not loading.
                    // mockImageInstance.__triggerError();
                }
            }

            const fallbackElement = await screen.findByText('FB');
            expect(fallbackElement).toBeVisible();
            // Depending on Radix, the AvatarImage component might not render at all if src is empty.
            expect(screen.queryByTestId('avatar-image-empty')).not.toBeInTheDocument();
        });


        it('should apply additional className to AvatarFallback', () => {
            render(
                <Avatar>
                    <AvatarFallback className="custom-fallback-class" data-testid="avatar-fallback">FB</AvatarFallback>
                </Avatar>
            );
            expect(screen.getByTestId('avatar-fallback')).toHaveClass('custom-fallback-class');
        });

        it('should display fallback when image fails to load (e.g. invalid src)', async () => {
            render(
                <Avatar>
                    <AvatarImage src="invalid-image.jpg" alt="Invalid Image" data-testid="avatar-image-error" />
                    <AvatarFallback>FB</AvatarFallback>
                </Avatar>
            );

            expect(global.Image).toHaveBeenCalledTimes(1);
            if (mockImageInstance && mockImageInstance.__triggerError) {
                mockImageInstance.__triggerError();
            } else {
                throw new Error("Mock image instance or __triggerError not found for error test");
            }

            const fallbackElement = await screen.findByText('FB');
            expect(fallbackElement).toBeVisible();
            expect(screen.queryByTestId('avatar-image-error')).not.toBeInTheDocument();
        });
    });
});
