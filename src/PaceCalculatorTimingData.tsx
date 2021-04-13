import * as React from 'react';

import { getPace, toHHMMSS, withCommas } from './formatting';

const PREDEFINED_LAPS = [10000, 5000, 3000, 1500, 1000, 800, 400, 200, 100];

interface SummaryProps {
  data: [string, string][];
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
  return (
    <div>
      <Summary
        data={[
          ['Distance', `${withCommas(meters)} m`],
          ['Time', toHHMMSS(seconds, 'normal', 2)],
          ['Pace', getPace(meters, seconds)],
        ]}
      />
      <table>
        <thead>
          <tr>
            <th>Lap</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {PREDEFINED_LAPS.map((distance, index) => {
            const scaledSeconds = (seconds * distance) / (meters || 1);

            const highlight = (value: number) =>
              distance === value ? { fontWeight: 700 } : undefined;

            return (
              <tr
                key={index}
                style={{
                  ...(index % 2 === 0 && {
                    backgroundColor: '#f3f3f3',
                  }),
                }}
              >
                <td>
                  <span style={highlight(1000)}>{withCommas(distance)} m</span>
                </td>
                <td>
                  <span
                    style={highlight(1000)}
                    title={`${scaledSeconds.toFixed(2)} seconds`}
                  >
                    <span style={{ color: '#ccc' }}>~ </span>
                    {toHHMMSS(scaledSeconds)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PaceCalculatorTimingData;
