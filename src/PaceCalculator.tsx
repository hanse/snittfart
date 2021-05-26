import {
  ErrorBoundary,
  Input,
  Select,
  SelectOption,
  Stack,
  useThrottle,
} from '@devmoods/ui';
import * as React from 'react';
import { useAbortablePromise } from 'use-abortable-promise';

import { fetch } from './api';
import PaceCalculatorTimingData from './PaceCalculatorTimingData';
import { parseMeters, parseSeconds } from './parsers';
import SplitCalculator from './SplitCalculator';
import { RecordsDto } from './types';

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

function useLocationState(query: string) {
  const throttledQuery = useThrottle(query, 500);

  React.useEffect(() => {
    (window as any).history.pushState(null, null, throttledQuery);
  }, [throttledQuery]);
}

function useCalculatorState() {
  const [{ data }] = useAbortablePromise(async (signal) => {
    try {
      const result = await fetch<RecordsDto[]>('/records', { signal });
      return result.jsonData;
    } catch {
      return [];
    }
  }, []);

  const presets = data || [];

  const [state, dispatch] = React.useReducer(
    function reducer(state: State, action: Action): State {
      switch (action.type) {
        case 'PRESET_SELECTED': {
          const key = action.preset;
          const preset = presets.find((preset) => preset.id === key)!;

          if (!preset) {
            return state;
          }

          const splitValue =
            preset.halfSplit || `${parseSeconds(preset.time) / 2}`;

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
    },
    undefined,
    getInitialState
  );

  const onPresetSelect: React.FormEventHandler<HTMLSelectElement> = (e) => {
    dispatch({
      type: 'PRESET_SELECTED',
      preset: e.currentTarget.value,
    });
  };

  const onSplitChange = (e: any) => {
    dispatch({
      type: 'SPLIT_CHANGED',
      value: e.target.value,
    });
  };

  const onDistanceChange = (e: any) => {
    dispatch({
      type: 'DISTANCE_CHANGED',
      value: e.currentTarget.value,
    });
  };

  const onTimeChange = (e: any) => {
    dispatch({
      type: 'TIME_CHANGED',
      value: e.currentTarget.value,
    });
  };

  return {
    onPresetSelect,
    onSplitChange,
    onTimeChange,
    onDistanceChange,
    presets,
    ...state,
  };
}

function PaceCalculator() {
  const {
    time,
    distance,
    presets,
    splitValue,
    onPresetSelect,
    onSplitChange,
    onDistanceChange,
    onTimeChange,
  } = useCalculatorState();

  useLocationState(
    `?time=${time}&distance=${distance}&splitValue=${splitValue}`
  );

  const meters = parseMeters(distance);
  const seconds = parseSeconds(time);
  const splitValueSeconds = parseSeconds(splitValue);

  const isMissingInputs = !meters || !seconds;

  const throttledMeters = useThrottle(meters, 200);
  const throttledSeconds = useThrottle(seconds, 200);

  const presetOptions = [['', 'Select a preset'] as SelectOption].concat(
    presets.map((preset) => {
      return [
        preset.id,
        `${preset.description} ${preset.athleteName}`,
      ] as SelectOption;
    })
  );

  return (
    <Stack spacing="xl">
      <section>
        <Stack
          as="form"
          spacing="m"
          className="card dmk-margin-top-s dmk-padding-m"
        >
          <Input
            label={'Enter distance 👟'}
            id="distance"
            autoCapitalize="none"
            autoFocus
            type="text"
            name="distance"
            placeholder="e.g. a marathon or 1500 m"
            value={distance}
            onChange={onDistanceChange}
          />

          <Input
            label={'Goal time ⏱'}
            id="time"
            autoCapitalize="none"
            type="text"
            name="time"
            placeholder="e.g. 3:26.00 or 3 hours"
            value={time}
            onChange={onTimeChange}
          />

          <h3 style={{ textAlign: 'center' }}>Or select a preset</h3>

          <Select onChange={onPresetSelect} options={presetOptions} />
        </Stack>
      </section>

      <section className={isMissingInputs ? 'blurred' : ''}>
        <h2>Splits</h2>
        <div className="card dmk-margin-top-s dmk-padding-m">
          <SplitCalculator
            meters={meters}
            seconds={seconds}
            value={splitValueSeconds}
            onChange={onSplitChange}
          />
        </div>
      </section>

      <section className={isMissingInputs ? 'blurred' : ''}>
        <h2>Timing data</h2>
        <div className="card dmk-margin-top-s">
          <ErrorBoundary>
            <PaceCalculatorTimingData
              meters={throttledMeters}
              seconds={throttledSeconds}
            />
          </ErrorBoundary>
        </div>
      </section>

      <section className="about">
        <p>
          The <strong>Snittfart</strong> pace calculator shows how fast you need
          to run on average to finish your early enough to reach your goals!
        </p>

        <p>
          <strong>Snittfart</strong> also calculates the{' '}
          <a href="https://www.worldathletics.org/news/iaaf-news/scoring-tables-2017">
            World Athletics Ranking score
          </a>{' '}
          for the effort using the scoring tables and list equivalent
          performances using Riegels formula.
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
