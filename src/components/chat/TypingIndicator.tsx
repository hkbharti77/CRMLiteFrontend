import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { tokens } from '@theme/tokens';
import { useTheme } from 'react-native-paper';

export const TypingIndicator: React.FC = () => {
  const theme = useTheme();
  
  // Create animated values for 3 dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    };

    Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ]).start();
  }, [dot1, dot2, dot3]);

  const getAnimatedStyle = (dot: Animated.Value) => {
    return {
      opacity: dot.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
      }),
      transform: [
        {
          translateY: dot.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -5],
          }),
        },
      ],
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.backgroundDark }]}>
      <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary }, getAnimatedStyle(dot1)]} />
      <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary }, getAnimatedStyle(dot2)]} />
      <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary }, getAnimatedStyle(dot3)]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.lg,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: tokens.spacing.xs,
    width: 60,
    height: 36,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});
