import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Calendar } from '../calendar'; // Adjust import path as necessary
import { es } from 'date-fns/locale'; // For testing locale prop

describe('Calendar component', () => {
    const today = new Date();

    it('should render the calendar with the current month by default', () => {
        render(<Calendar />);
        const currentMonthYear = today.toLocaleString('default', { month: 'long', year: 'numeric' });
        expect(screen.getByText(currentMonthYear)).toBeInTheDocument();
    });

    it('should apply additional className to the calendar', () => {
        const { container } = render(<Calendar className="custom-calendar-class" />);
        expect(container.querySelector('.rdp-root')).toHaveClass('custom-calendar-class');
    });

    it('should display the specified month when "month" prop is provided', () => {
        const specifiedDate = new Date(2023, 0, 15); // January 15, 2023
        render(<Calendar month={specifiedDate} />);
        expect(screen.getByText('January 2023')).toBeInTheDocument();
    });

    it('should navigate to the next month when "Next month" button is clicked', () => {
        render(<Calendar />);
        fireEvent.click(screen.getByRole('button', { name: 'Go to the Next Month' }));
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextMonthYear = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        expect(screen.getByText(nextMonthYear)).toBeInTheDocument();
    });

    it('should navigate to the previous month when "Previous month" button is clicked', () => {
        render(<Calendar />);
        fireEvent.click(screen.getByRole('button', { name: 'Go to the Previous Month' }));
        const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthYear = prevMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        expect(screen.getByText(prevMonthYear)).toBeInTheDocument();
    });

    it('should call onSelect when a date is clicked', () => {
        const mockOnSelect = jest.fn();
        render(<Calendar mode="single" onSelect={mockOnSelect} />);
        // Find the gridcell for the 15th day of the currently rendered month first
        // The name attribute of the gridcell contains the full date string.
        const dayCell = screen.getByRole('gridcell', { name: /15/i });
        // Then find the button within that cell to click
        const dayButton = within(dayCell).getByRole('button');
        fireEvent.click(dayButton);
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
        // The argument to onSelect depends on the mode (single, multiple, range)
        // For default single mode, it should be the selected Date object.
        // We can check if it's a Date object and roughly corresponds to the 15th.
        expect(mockOnSelect.mock.calls[0][0]).toBeInstanceOf(Date);
        expect((mockOnSelect.mock.calls[0][0] as Date).getDate()).toBe(15);
    });

    it('should highlight the selected date when "selected" prop is provided', () => {
        const selectedDate = new Date(today.getFullYear(), today.getMonth(), 20);
        render(<Calendar mode="single" selected={selectedDate} onSelect={jest.fn()} />);

        // The button for the selected day should have aria-selected="true"
        const selectedDayButton = screen.getByRole('button', {
            name: (nameContent, el) => nameContent.includes('20') && el.getAttribute('aria-selected') === 'true'
        });
        expect(selectedDayButton).toBeInTheDocument();

        // Check classes on the button from classNames.day_selected
        expect(selectedDayButton).toHaveClass('bg-primary', 'text-primary-foreground');

        // The parent cell (td) should have 'bg-accent' due to "[&:has([aria-selected])]:bg-accent"
        // and react-day-picker adds 'rdp-selected' to the cell if a day is selected.
        const selectedDayCell = selectedDayButton.closest('td[role="gridcell"]');
        expect(selectedDayCell).toBeInTheDocument();
        if (selectedDayCell) { // Type guard
            expect(selectedDayCell).toHaveClass('rdp-selected'); // From react-day-picker
            expect(selectedDayCell).toHaveClass('bg-accent');    // From our custom styles in calendar.tsx
        }
    });

    it('should disable navigation when "disableNavigation" prop is true', () => {
        render(<Calendar disableNavigation />);
        // react-day-picker uses aria-disabled for navigation buttons
        expect(screen.getByRole('button', { name: 'Go to the Next Month' })).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('button', { name: 'Go to the Previous Month' })).toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable specified dates', () => {
        const disabledDate = new Date(today.getFullYear(), today.getMonth(), 10);
        const monthForTest = new Date(today.getFullYear(), today.getMonth(), 1);
        render(
            <Calendar
                month={monthForTest}
                mode="single"
                onSelect={jest.fn()} // Necessary for interactive modes
                disabled={[disabledDate]}
            />
        );

        // Find the button for the 10th day.
        // It should be disabled and have specific classes.
        const disabledDayButton = screen.getByRole('button', {
            name: (nameContent, el) => (nameContent.includes('10') || el.textContent?.trim() === '10')
        });
        expect(disabledDayButton).toBeInTheDocument();
        expect(disabledDayButton).toBeDisabled(); // Check the disabled attribute on the button

        // Check classes from classNames.day_disabled (applied to the button)
        expect(disabledDayButton).toHaveClass('text-muted-foreground', 'opacity-50');

        // The parent cell should also reflect that it contains a disabled day,
        // react-day-picker adds aria-disabled="true" to the cell.
        const parentCell = disabledDayButton.closest('td[role="gridcell"]');
        expect(parentCell).toBeInTheDocument();
        if (parentCell) {
            expect(parentCell).toHaveAttribute('aria-disabled', 'true');
        }
    });

    it('should show multiple months when "numberOfMonths" prop is used', () => {
        render(<Calendar numberOfMonths={2} />);
        const currentMonthYear = today.toLocaleString('default', { month: 'long', year: 'numeric' });
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextMonthYear = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        expect(screen.getByText(currentMonthYear)).toBeInTheDocument();
        expect(screen.getByText(nextMonthYear)).toBeInTheDocument();
    });

    it('should use the specified locale', () => {
        const specifiedDate = new Date(2023, 0, 15); // January 15, 2023
        render(<Calendar month={specifiedDate} locale={es} />);
        // Check for month name in Spanish
        expect(screen.getByText('enero 2023')).toBeInTheDocument(); // 'enero' is January in Spanish
    });

    // Test for fixedWeeks prop
    it('should render a fixed number of weeks if fixedWeeks is true', () => {
        const { container } = render(<Calendar fixedWeeks />);
        // react-day-picker renders 6 rows (<tr> with class rdp-week) in tbody when fixedWeeks is true.
        const weekElements = container.querySelectorAll('tbody.rdp-weeks tr.rdp-week');
        expect(weekElements.length).toBe(6);
    });

    it('should render with showOutsideDays prop', () => {
        const testMonth = new Date(2024, 1, 1); // Feb 2024 (Jan 31 is an outside day)
        render(<Calendar month={testMonth} showOutsideDays />);

        // Find the button for an outside day, e.g., Jan 31 when Feb 2024 is shown.
        // The button itself will have the 'day-outside' class from our calendar.tsx
        const outsideDayButton = screen.getByRole('button', {
            name: (name, el) => (name.toLowerCase().includes('january 31') || el.textContent?.trim() === '31') && el.classList.contains('day-outside')
        });

        expect(outsideDayButton).toBeInTheDocument();
        // Check classes from classNames.day_outside on the button itself
        expect(outsideDayButton).toHaveClass('day-outside', 'text-muted-foreground', 'opacity-50');

        // The parent cell (td) should be marked with data-outside="true" by react-day-picker
        const parentCellOfOutsideDay = outsideDayButton.closest('td[role="gridcell"]');
        expect(parentCellOfOutsideDay).toBeInTheDocument();
        if (parentCellOfOutsideDay) {
            expect(parentCellOfOutsideDay).toHaveAttribute('data-outside', 'true');
            // It should also have rdp-outside class from react-day-picker
            expect(parentCellOfOutsideDay).toHaveClass('rdp-outside');
        }
    });
});
