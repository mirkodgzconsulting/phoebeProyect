import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';

import {useTheme} from '../hooks/';
import Button from './Button';
import Text from './Text';

interface BrandActionButtonProps {
  label: string;
  onPress: () => void;
  gradient?: readonly [string, string] | string[];
  disabledGradient?: readonly [string, string] | string[];
  disabled?: boolean;
  uppercase?: boolean;
  style?: StyleProp<ViewStyle>;
  disabledStyle?: StyleProp<ViewStyle>;
}

// Botón de acción principal reutilizable para CTA de onboarding y autenticación
const BrandActionButton = ({
  label,
  onPress,
  gradient,
  disabledGradient,
  disabled = false,
  uppercase = true,
  style,
  disabledStyle,
}: BrandActionButtonProps) => {
  const {sizes, gradients} = useTheme();

  const baseGradient = gradient ?? gradients?.primary ?? ['#0B3D4D', '#60CB58'];
  const baseDisabledGradient =
    disabledGradient ?? ['rgba(11,61,77,0.45)', 'rgba(11,61,77,0.25)'];
  const appliedGradient = disabled ? baseDisabledGradient : baseGradient;
  const buttonGradient = [...appliedGradient];

  return (
    <Button
      gradient={buttonGradient}
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          borderRadius: sizes.sm * 1.4,
          paddingVertical: sizes.s,
        },
        style,
        disabled ? disabledStyle || {opacity: 0.6} : null,
      ]}>
      <Text bold white transform={uppercase ? 'uppercase' : undefined}>
        {label}
      </Text>
    </Button>
  );
};

export default BrandActionButton;

