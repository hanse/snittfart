import { Slider, Spacer, Stack } from '@devmoods/ui';
import * as React from 'react';

import { getPace, toHHMMSS, withCommas } from './formatting';

interface SplitCalculatorProps {
  meters: number;
  seconds: number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: number;
}

function getColor(value: number) {
  return value <= 0 ? 'var(--colors-success)' : 'var(--colors-danger)';
}

function SplitCalculator({
  value,
  seconds,
  meters,
  onChange,
}: SplitCalculatorProps) {
  const firstSeconds = value;
  const lastSeconds = seconds - value;
  const diff = lastSeconds - firstSeconds;

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          right: -8,
          top: -8,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: getColor(diff / seconds),
        }}
      />
      <Stack horizontal>
        <Stack spacing="xs">
          <span>
            <span style={{ color: '#999' }}>1st</span> {withCommas(meters / 2)}{' '}
            m, {toHHMMSS(firstSeconds, 'normal')}
          </span>
          <small>{getPace(meters / 2, value)}</small>
          <Spacer height="s" />
        </Stack>
        <Stack spacing="xs">
          <span>
            <span style={{ color: '#999' }}>2nd</span> {withCommas(meters / 2)}{' '}
            m, {toHHMMSS(lastSeconds, 'normal')}
          </span>
          <small>{getPace(meters / 2, lastSeconds)}</small>
        </Stack>
      </Stack>
      <Spacer height="m" />
      <Slider value={value} min={0} max={seconds} onChange={onChange} />
    </div>
  );
}

export default SplitCalculator;
