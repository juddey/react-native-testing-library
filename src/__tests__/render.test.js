// @flow
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import stripAnsi from 'strip-ansi';
import { render, fireEvent } from '..';

class Button extends React.Component<*> {
  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress}>
        <Text>{this.props.children}</Text>
      </TouchableOpacity>
    );
  }
}

class Banana extends React.Component<*, *> {
  state = {
    fresh: false,
  };

  componentDidUpdate() {
    if (this.props.onUpdate) {
      this.props.onUpdate();
    }
  }

  componentWillUnmount() {
    if (this.props.onUnmount) {
      this.props.onUnmount();
    }
  }

  changeFresh = () => {
    this.setState(state => ({
      fresh: !state.fresh,
    }));
  };

  render() {
    return (
      <View>
        <Text>Is the banana fresh?</Text>
        <Text testID="bananaFresh">
          {this.state.fresh ? 'fresh' : 'not fresh'}
        </Text>
        <Button onPress={this.changeFresh} type="primary">
          Change freshness!
        </Button>
      </View>
    );
  }
}

test('getByTestId, queryByTestId', () => {
  const { getByTestId, queryByTestId } = render(<Banana />);
  const component = getByTestId('bananaFresh');

  expect(component.props.children).toBe('not fresh');
  expect(() => getByTestId('InExistent')).toThrow('No instances found');

  expect(getByTestId('bananaFresh')).toBe(component);
  expect(queryByTestId('InExistent')).toBeNull();
});

test('getByName, queryByName', () => {
  const { getByTestId, getByName, queryByName } = render(<Banana />);
  const bananaFresh = getByTestId('bananaFresh');
  const button = getByName('Button');

  button.props.onPress();

  expect(bananaFresh.props.children).toBe('fresh');

  const sameButton = getByName(Button);
  sameButton.props.onPress();

  expect(bananaFresh.props.children).toBe('not fresh');
  expect(() => getByName('InExistent')).toThrow('No instances found');
  expect(() => getByName(Text)).toThrow('Expected 1 but found 3');

  expect(queryByName('Button')).toBe(button);
  expect(queryByName('InExistent')).toBeNull();
});

test('getAllByName, queryAllByName', () => {
  const { getAllByName, queryAllByName } = render(<Banana />);
  const [text, status, button] = getAllByName('Text');

  expect(text.props.children).toBe('Is the banana fresh?');
  expect(status.props.children).toBe('not fresh');
  expect(button.props.children).toBe('Change freshness!');
  expect(() => getAllByName('InExistent')).toThrow('No instances found');

  expect(queryAllByName('Text')[1]).toBe(status);
  expect(queryAllByName('InExistent')).toHaveLength(0);
});

test('getAllByType, queryAllByType', () => {
  const { getAllByType, queryAllByType } = render(<Banana />);
  const [text, status, button] = getAllByType(Text);
  const InExistent = () => null;

  expect(text.props.children).toBe('Is the banana fresh?');
  expect(status.props.children).toBe('not fresh');
  expect(button.props.children).toBe('Change freshness!');
  expect(() => getAllByType(InExistent)).toThrow('No instances found');

  expect(queryAllByType(Text)[1]).toBe(status);
  expect(queryAllByType(InExistent)).toHaveLength(0);
});

test('getByText, queryByText', () => {
  const { getByText, queryByText } = render(<Banana />);
  const button = getByText(/change/i);

  expect(button.props.children).toBe('Change freshness!');

  const sameButton = getByText('not fresh');

  expect(sameButton.props.children).toBe('not fresh');
  expect(() => getByText('InExistent')).toThrow('No instances found');

  expect(queryByText(/change/i)).toBe(button);
  expect(queryByText('InExistent')).toBeNull();
  expect(() => queryByText(/fresh/)).toThrow('Expected 1 but found 3');
});

test('getAllByText, queryAllByText', () => {
  const { getAllByText, queryAllByText } = render(<Banana />);
  const buttons = getAllByText(/fresh/i);

  expect(buttons).toHaveLength(3);
  expect(() => getAllByText('InExistent')).toThrow('No instances found');

  expect(queryAllByText(/fresh/i)).toEqual(buttons);
  expect(queryAllByText('InExistent')).toHaveLength(0);
});

test('getByProps, queryByProps', () => {
  const { getByProps, queryByProps } = render(<Banana />);
  const primaryType = getByProps({ type: 'primary' });

  expect(primaryType.props.children).toBe('Change freshness!');
  expect(() => getByProps({ type: 'inexistent' })).toThrow(
    'No instances found'
  );

  expect(queryByProps({ type: 'primary' })).toBe(primaryType);
  expect(queryByProps({ type: 'inexistent' })).toBeNull();
});

test('getAllByProp, queryAllByProps', () => {
  const { getAllByProps, queryAllByProps } = render(<Banana />);
  const primaryTypes = getAllByProps({ type: 'primary' });

  expect(primaryTypes).toHaveLength(1);
  expect(() => getAllByProps({ type: 'inexistent' })).toThrow(
    'No instances found'
  );

  expect(queryAllByProps({ type: 'primary' })).toEqual(primaryTypes);
  expect(queryAllByProps({ type: 'inexistent' })).toHaveLength(0);
});

test('update', () => {
  const fn = jest.fn();
  const { getByName, update } = render(<Banana onUpdate={fn} />);
  const button = getByName('Button');

  button.props.onPress();

  update(<Banana onUpdate={fn} />);

  expect(fn).toHaveBeenCalledTimes(2);
});

test('unmount', () => {
  const fn = jest.fn();
  const { unmount } = render(<Banana onUnmount={fn} />);
  unmount();
  expect(fn).toHaveBeenCalled();
});

test('toJSON', () => {
  const { toJSON } = render(<Button>press me</Button>);

  expect(toJSON()).toMatchSnapshot();
});

test('debug', () => {
  jest.spyOn(console, 'log').mockImplementation(x => x);

  const { debug } = render(<Banana />);

  debug();
  debug('my custom message');
  debug.shallow();
  debug.shallow('my other custom message');

  // eslint-disable-next-line no-console
  const mockCalls = console.log.mock.calls;

  expect(stripAnsi(mockCalls[0][0])).toMatchSnapshot();
  expect(stripAnsi(mockCalls[1][0] + mockCalls[1][1])).toMatchSnapshot(
    'with message'
  );
  expect(stripAnsi(mockCalls[2][0])).toMatchSnapshot('shallow');
  expect(stripAnsi(mockCalls[3][0] + mockCalls[3][1])).toMatchSnapshot(
    'shallow with message'
  );
});

test('debug changing component', () => {
  jest.spyOn(console, 'log').mockImplementation(x => x);

  const { getByProps, debug } = render(<Banana />);

  fireEvent.press(getByProps({ type: 'primary' }));

  debug();

  // eslint-disable-next-line no-console
  const mockCalls = console.log.mock.calls;

  expect(stripAnsi(mockCalls[4][0])).toMatchSnapshot(
    'bananaFresh button message should now be "fresh"'
  );
});
