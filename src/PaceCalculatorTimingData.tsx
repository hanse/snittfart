import { cx } from '@devmoods/ui';
import * as React from 'react';
import { useAbortablePromise } from 'use-abortable-promise';

import { fetch } from './api';
import { getPace, toHHMMSS, withCommas } from './formatting';
import { PerformanceApiResponse } from './types';

const PREDEFINED_LAPS = [
  10000, 5000, 3000, 1500, 1000, 800, 400, 200, 100,
].map((distance, index) => ({
  id: index,
  distance,
  humanDistance: '',
  time: 0,
  humanTime: '',
  riegel: '',
}));

interface SummaryProps {
  data: [string, React.ReactNode][];
}

const Summary = ({ data }: SummaryProps) => (
  <dl className="summary">
    {data.map(([key, value]) => (
      <React.Fragment key={key}>
        <dt key={key}>{key}</dt>
        <dd>{value}</dd>
      </React.Fragment>
    ))}
  </dl>
);

interface PaceCalculatorTimingDataProps {
  meters: number;
  seconds: number;
}

function PaceCalculatorTimingData({
  meters,
  seconds,
}: PaceCalculatorTimingDataProps) {
  const [{ data, error, loading }] = useAbortablePromise(
    async (signal) => {
      const result = await fetch<PerformanceApiResponse>(
        `/performance?distance=${meters}&time=${seconds}`,
        { signal }
      );

      return result.jsonData;
    },
    [meters, seconds]
  );

  if (error) {
    throw error;
  }

  const waPoints = (
    data?.performances.map(
      (performance) => `${performance.performance.points}p`
    ) || ['-', '-']
  ).join(' / ');

  return (
    <div className={cx(loading && 'dmk-animate-pulse')}>
      <Summary
        data={[
          ['Distance', `${withCommas(meters)} m`],
          ['Time', toHHMMSS(seconds, 'normal', 2)],
          ['WA Ranking (m/f)', <span>{waPoints}</span>],
          ['Pace', getPace(meters, seconds)],
        ]}
      />
      <div className="table-container">
        <table className="timing-data-table">
          <thead>
            <tr>
              <th>Lap</th>
              <th>Same pace</th>
              <th title="Using the Riegel formula">Equivalent ℹ️</th>
            </tr>
          </thead>
          <tbody>
            {(data?.lapTimes || PREDEFINED_LAPS).map((lap) => {
              return (
                <tr key={lap.id} data-distance={lap.distance}>
                  <td>{lap.humanDistance}</td>
                  <td>
                    <span title={`${lap.time.toFixed(2)} seconds`} data-approx>
                      {lap.humanTime}
                    </span>
                  </td>
                  <td>
                    <span data-approx>{lap.riegel}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaceCalculatorTimingData;
