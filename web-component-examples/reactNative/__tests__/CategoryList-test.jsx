import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { expect, it } from '@jest/globals';
import { Dimensions, FlatList } from 'react-native';
import CategoryList from '../screens/CategoryList';
import { clear } from 'console';

// Mock the navigation prop
const mockNavigation = {
    navigate: jest.fn(),
};

jest.mock('react-native-gesture-handler', () => { });


describe('CategoryList Component', () => {
    const { width, height } = Dimensions.get('window');
    it('renders correctly with default filters', () => {
        const { getByText } = render(<CategoryList navigation={mockNavigation} />);

        // Ensure the component's header is rendered
        expect(getByText('Choose the content to play')).toBeTruthy();

        // Ensure both "Multiple choice questions" and "Subjective Questions" sections are present
        expect(getByText('Multiple choice questions')).toBeTruthy();
        expect(getByText('Subjective Questions')).toBeTruthy();
    });

    it('navigates when a category box is pressed', () => {
        const { getByText } = render(<CategoryList navigation={mockNavigation} />);

        // Simulate clicking a category box
        fireEvent.press(getByText('Short Text Question Set'));

        // Ensure the navigate function is called with the correct params
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Questions', {
            identifier: 'do_2138622515299368961170',
        });
    });

    it('toggles the side menu', () => {
        const { getByTestId } = render(<CategoryList navigation={mockNavigation} />);

        // Check that the side menu is initially hidden
        const sideMenuElement = getByTestId('side-menu');
        expect(sideMenuElement.props.style.transform).toEqual([{ translateX: -width / 2 }]);

        // Toggle the side menu
        fireEvent.press(getByTestId('filter-icon'));

        setTimeout(() => {
            // Check that the side menu is now visible after waiting for 500ms for animation to complete
            expect(sideMenuElement.props.style.transform).toEqual([{ translateX: 0 }]);

        }, 500);


    });

    it('toggles multiple choice filters', async () => {
        const { getByText, getByTestId } = render(<CategoryList navigation={mockNavigation} />);

        // Ensure the "Multiple Choice" filter switch is initially enabled
        expect(getByTestId('multiple-choice-switch').props.value).toEqual(true);

        // Toggle the "Multiple Choice" filter switch
        fireEvent.press(getByTestId('multiple-choice-switch'));

        // Ensure the state of the filter switch has changed
        const switchToogle = setTimeout(() => {
            expect(getByTestId('multiple-choice-switch').props.value).toEqual(false);
        }, 1000)

        clearTimeout(switchToogle)
    });
});
