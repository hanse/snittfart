import { Badge, Slider, Spacer, Stack, cx } from '@devmoods/ui';
import * as React from 'react';

import { getPace, toHHMMSS, withCommas } from './formatting';

interface SplitCalculatorProps {
  meters: number;
  seconds: number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: number;
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
      <Badge
        intent="success"
        aria-hidden
        className={cx(
          'negative-split',
          diff < 0 && 'negative-split--visible',
          'dmk-margin-top-s'
        )}
        style={{ alignSelf: 'flex-end' }}
      >
        Negative split
      </Badge>
      <Slider value={value} min={0} max={seconds} onChange={onChange} />
    </div>
  );
}

export default SplitCalculator;
