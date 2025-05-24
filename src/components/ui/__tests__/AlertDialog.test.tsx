import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../alert-dialog'; // Adjust the import path as necessary

describe('AlertDialog', () => {
    const TestAlertDialog = ({
        onActionClick = jest.fn(),
        onCancelClick = jest.fn(),
        title = 'Test Dialog Title',
        description = 'Test dialog description.',
        actionText = 'Confirm',
        cancelText = 'Cancel',
        triggerText = 'Open Dialog',
    }) => (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button>{triggerText}</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancelClick}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction onClick={onActionClick}>{actionText}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    it('should render the trigger button', () => {
        render(<TestAlertDialog />);
        expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    });

    it('should open the dialog when the trigger is clicked', async () => {
        render(<TestAlertDialog />);
        await userEvent.click(screen.getByText('Open Dialog'));
        expect(screen.getByText('Test Dialog Title')).toBeVisible();
        expect(screen.getByText('Test dialog description.')).toBeVisible();
        expect(screen.getByText('Confirm')).toBeVisible();
        expect(screen.getByText('Cancel')).toBeVisible();
    });

    it('should display custom title, description, action, and cancel text', async () => {
        const customProps = {
            title: 'Custom Title',
            description: 'Custom Description',
            actionText: 'Proceed',
            cancelText: 'Go Back',
            triggerText: 'Show Custom Dialog'
        };
        render(<TestAlertDialog {...customProps} />);
        await userEvent.click(screen.getByText(customProps.triggerText));
        expect(screen.getByText(customProps.title)).toBeVisible();
        expect(screen.getByText(customProps.description)).toBeVisible();
        expect(screen.getByText(customProps.actionText)).toBeVisible();
        expect(screen.getByText(customProps.cancelText)).toBeVisible();
    });

    it('should call onActionClick when the action button is clicked', async () => {
        const onActionClick = jest.fn();
        render(<TestAlertDialog onActionClick={onActionClick} />);
        await userEvent.click(screen.getByText('Open Dialog'));
        await userEvent.click(screen.getByText('Confirm'));
        expect(onActionClick).toHaveBeenCalledTimes(1);
    });

    it('should call onCancelClick when the cancel button is clicked', async () => {
        const onCancelClick = jest.fn();
        render(<TestAlertDialog onCancelClick={onCancelClick} />);
        await userEvent.click(screen.getByText('Open Dialog'));
        await userEvent.click(screen.getByText('Cancel'));
        expect(onCancelClick).toHaveBeenCalledTimes(1);
    });

    it('should close the dialog when the cancel button is clicked', async () => {
        render(<TestAlertDialog />);
        await userEvent.click(screen.getByText('Open Dialog'));
        // Dialog is open
        expect(screen.getByText('Test Dialog Title')).toBeVisible();

        await userEvent.click(screen.getByText('Cancel'));
        // Dialog should be closed, Radix typically removes it from the DOM or hides it
        // We will check if the title is no longer visible/present.
        // Radix UI might animate out, so we need to wait for the animation to complete.
        // A more robust way might be to check for absence or use waitForElementToBeRemoved.
        // For now, let's assume it becomes not visible quickly.
        // Using queryByText which returns null if not found, instead of getByText which throws.
        // expect(screen.queryByText('Test Dialog Title')).not.toBeVisible();
        // After clicking cancel, the dialog content should be removed from the DOM or hidden.
        // Radix UI animates out, so we might need to wait for the element to be removed.
        await waitFor(() => {
            expect(screen.queryByText('Test Dialog Title')).not.toBeInTheDocument();
        });
    });

    // Test for accessibility attributes (basic check)
    it('should have appropriate aria roles', async () => {
        render(<TestAlertDialog />);
        await userEvent.click(screen.getByText('Open Dialog'));

        // Radix UI handles roles, so this is more of an integration check
        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByText('Test Dialog Title')).toHaveAttribute('id');
        const titleId = screen.getByText('Test Dialog Title').id;
        expect(dialog).toHaveAttribute('aria-labelledby', titleId);

        expect(screen.getByText('Test dialog description.')).toHaveAttribute('id');
        const descriptionId = screen.getByText('Test dialog description.').id;
        expect(dialog).toHaveAttribute('aria-describedby', descriptionId);
    });
});
