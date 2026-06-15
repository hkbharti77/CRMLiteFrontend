// @ts-nocheck
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton } from '../AppButton';

// Mock theme since AppButton uses useTheme from react-native-paper
jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  return {
    ...actual,
    useTheme: () => ({
      colors: {
        primary: '#0F766E',
        surfaceVariant: '#E2E8F0',
        onSurface: '#0F172A',
      },
      fonts: {
        labelLarge: { fontFamily: 'System', fontWeight: '500', letterSpacing: 0.1, lineHeight: 20 },
      },
    }),
  };
});

describe('AppButton', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<AppButton>Click Me</AppButton>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('handles onPress event', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<AppButton onPress={onPressMock}>Press Me</AppButton>);
    fireEvent.press(getByText('Press Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('disables the button when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<AppButton disabled onPress={onPressMock}>Disabled</AppButton>);
    const button = getByText('Disabled');
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
  });
});

