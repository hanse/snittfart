import {
  Input,
  Select,
  SelectOption,
  Stack,
  useResponsiveValue,
  useThrottle,
} from '@devmoods/ui';
import * as React from 'react';

import Card from './Card';
import PRESETS from './data.json';
import PaceCalculatorTimingData from './PaceCalculatorTimingData';
import { parseMeters, parseSeconds } from './parsers';
import SplitCalculator from './SplitCalculator';

interface State {
  time: string;
  distance: string;
  splitValue: string;
}

function getInitialState(): State {
  const query = Object.fromEntries(
    new URLSearchParams(window.location.search.slice(1))
  );

  return {
    time: (query.time || '') as string,
    distance: (query.distance || '') as string,
    splitValue: (query.splitValue || '') as string,
  };
}

type Action =
  | {
      type: 'PRESET_SELECTED';
      preset: string;
    }
  | {
      type: 'DISTANCE_CHANGED';
      value: string;
    }
  | {
      type: 'TIME_CHANGED';
      value: string;
    }
  | {
      type: 'SPLIT_CHANGED';
      value: string;
    };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PRESET_SELECTED': {
      const key = action.preset;
      const preset = PRESETS.presets.find((preset) => preset.id === key)!;

      if (!preset) {
        return state;
      }

      const splitValue = preset.halfSplit || `${parseSeconds(preset.time) / 2}`;

      return {
        ...state,
        time: preset.time,
        distance: preset.distance,
        splitValue,
      };
    }

    case 'DISTANCE_CHANGED':
      return {
        ...state,
        distance: action.value,
        splitValue: `${parseSeconds(state.time) / 2}`,
      };

    case 'TIME_CHANGED':
      return {
        ...state,
        time: action.value,
        splitValue: `${parseSeconds(action.value) / 2}`,
      };

    case 'SPLIT_CHANGED':
      return {
        ...state,
        splitValue: action.value,
      };

    default:
      return state;
  }
}

const presetOptions = [['', 'Select a preset'] as SelectOption].concat(
  PRESETS.presets.map((preset) => {
    const description = `${preset.event} ${preset.name}`;
    return [preset.id, description] as SelectOption;
  })
);

function useLocationState(query: string) {
  const throttledQuery = useThrottle(query, 500);

  React.useEffect(() => {
    (window as any).history.pushState(null, null, throttledQuery);
  }, [throttledQuery]);
}

function PaceCalculator() {
  const [state, dispatch] = React.useReducer(
    reducer,
    undefined,
    getInitialState
  );

  const { time, distance, splitValue } = state;

  useLocationState(
    `?time=${time}&distance=${distance}&splitValue=${splitValue}`
  );

  const handlePresetSelect: React.FormEventHandler<HTMLSelectElement> = (e) => {
    dispatch({
      type: 'PRESET_SELECTED',
      preset: e.currentTarget.value,
    });
  };

  const handleInput = (
    type: 'SPLIT_CHANGED' | 'DISTANCE_CHANGED' | 'TIME_CHANGED'
  ) => ({ currentTarget: { value } }: React.FormEvent<HTMLInputElement>) => {
    dispatch({ type, value });
  };

  const handleSplitChange = (e: any) => {
    dispatch({
      type: 'SPLIT_CHANGED',
      value: e.target.value,
    });
  };

  const meters = parseMeters(distance);
  const seconds = parseSeconds(time);
  const splitValueSeconds = parseSeconds(splitValue);

  return (
    <Stack spacing="xl">
      <section>
        <Stack spacing="m" className="card dmk-margin-top-s dmk-padding-m">
          <Input
            label={'Enter distance 👟'}
            id="distance"
            autoCapitalize="none"
            autoFocus
            type="text"
            name="distance"
            placeholder="e.g. a marathon or 1500 m"
            value={distance}
            onChange={handleInput('DISTANCE_CHANGED')}
          />

          <Input
            label={'Goal time ⏱'}
            id="time"
            autoCapitalize="none"
            type="text"
            name="time"
            placeholder="e.g. 3:26.00 or 3 hours"
            value={time}
            onChange={handleInput('TIME_CHANGED')}
          />

          <h3 style={{ textAlign: 'center' }}>Or select a preset</h3>

          <Select onChange={handlePresetSelect} options={presetOptions} />
        </Stack>
      </section>

      <section className={!meters || !seconds ? 'blurred' : ''}>
        <h2>Splits</h2>
        <Card className="card dmk-margin-top-s dmk-padding-m">
          <SplitCalculator
            meters={meters}
            seconds={seconds}
            value={splitValueSeconds}
            onChange={handleSplitChange}
          />
        </Card>
      </section>

      <section className={!meters || !seconds ? 'blurred' : ''}>
        <h2>Timing data</h2>
        <Card className="card dmk-margin-top-s">
          <PaceCalculatorTimingData meters={meters} seconds={seconds} />
        </Card>
      </section>

      <section className="about">
        <p>
          The <strong>Snittfart</strong> pace calculator shows how fast you need
          to run on average to finish your runs at a given time.
        </p>
        <p>
          <mark>Timing data</mark> shows average lap-times needed for a range of
          lap lengths &ndash; not estimated equivalent race performances. Nice
          for planning your efforts!
        </p>

        <p>
          Use this tool to go figure out how fast you must run to beat Jakob,
          Eliud or Hicham.{' '}
          <em>
            If you are running on a regular track, the time in the 400 m row
            should match your watch {'⌚️'} after each lap to be sure you make
            it in time.
          </em>
        </p>
      </section>
    </Stack>
  );
}

export default PaceCalculator;
