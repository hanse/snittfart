require('dotenv-safe').config({
  allowEmptyValues: true,
});

import http from 'http';

import {
  ApiError,
  DoesNotExistError,
  NotFound,
  bodyParser,
  createLogger,
  createPostgres,
  envPort,
  errorHandler,
  listen,
  route,
  sql,
  useRequestId,
  validateQuery,
  withRequestContext,
} from '@devmoods/express-extras';
import * as Sentry from '@sentry/node';
import express from 'express';
import helmet from 'helmet';

import { toHHMMSS, withCommas } from './formatting';
import type { EventPerformanceDto } from './types';

const app = express();
const server = http.createServer(app);
const postgres = createPostgres();
const logger = createLogger({
  name: 'snittfart',
  getContext() {
    return {
      requestId: useRequestId(),
    };
  },
});

app.set('port', envPort());
app.use(Sentry.Handlers.requestHandler());
app.use(helmet());
app.use(bodyParser.json());
app.use(withRequestContext());

app.get(
  '/api/records',
  route(async () => {
    const rows = await postgres.all<any>(sql`
      SELECT id, athlete_name, competition_date, world_records.distance, time_seconds, half_split, description
      FROM world_records
    `);

    return rows.map((row) => ({
      id: `${row.id}`,
      athleteName: row.athlete_name,
      competitionDate: row.competition_date,
      distance: row.distance,
      time: toHHMMSS(+row.time_seconds, 'normal', 2),
      halfSplit: row.half_split == null ? null : toHHMMSS(+row.half_split),
      description: row.description,
    }));
  })
);

app.get(
  '/api/performance',
  validateQuery({
    properties: {
      distance: { type: 'number' },
      time: { type: 'number' },
    },
    required: ['distance', 'time'],
  }),
  route(async ({ query }) => {
    const distance = +(query.distance ?? 0);
    const time = +(query.time ?? 0);

    const get = async (gender: string) => {
      const event = await getMostLikelyEvent(distance, time, gender);
      const similarPerformances = await getSimilarPerformances(
        +event.points,
        gender
      );

      return {
        performance: mapToDto(event),
        similarPerformances: similarPerformances.map(mapToDto),
      };
    };

    const laps = [10000, 5000, 3000, 1500, 1000, 800, 400, 200, 100];

    return {
      performances: await Promise.all([get('male'), get('female')]),
      lapTimes: laps.map((lapDistance, index) => {
        const scaledSeconds = (time * lapDistance) / (distance || 1);
        return {
          id: index + 1,
          distance: lapDistance,
          humanDistance: `${withCommas(lapDistance)} m`,
          time: scaledSeconds,
          humanTime: toHHMMSS(scaledSeconds),
          riegel: toHHMMSS(time * (lapDistance / distance) ** 1.06),
        };
      }),
    };
  })
);

interface EventPerformanceRow {
  event_category: string;
  event_slug: string;
  points: string;
  time: string;
  gender: string;
}

function mapToDto(row: EventPerformanceRow): EventPerformanceDto {
  return {
    eventSlug: row.event_slug,
    eventCategory: row.event_category,
    humanTime: toHHMMSS(+row.time, 'normal', 2),
    points: +row.points,
    gender: row.gender?.toUpperCase(),
  };
}

async function getMostLikelyEvent(
  distance: number,
  time: number,
  gender = 'male'
) {
  const event = await postgres.first<EventPerformanceRow>(sql` 
    SELECT
      events.slug AS event_slug,
      event_categories.name AS event_category,
      ABS(events.distance - ${distance}) AS index,
      FLOOR(scoring.a * POW(${time} + scoring.b, 2)) AS points,
      ${time}::numeric AS time,
      scoring.gender AS gender
    FROM events
    LEFT JOIN event_categories ON events.event_category_id = event_categories.id
    LEFT JOIN scoring ON scoring.event_id = events.id AND scoring.gender = ${gender}
    ORDER BY index, event_categories.id
    LIMIT 1;
  `);

  if (event == null) {
    throw new DoesNotExistError('Could not find most likely event');
  }

  return event;
}

async function getSimilarPerformances(points: number, gender = 'male') {
  const query = sql`
    SELECT
      MAX(points) AS points,
      MIN(time) AS time,
      events.slug AS event_slug,
      event_categories.name AS event_category,
      ${gender}::text AS gender
    FROM `;

  query.append(
    gender === 'male'
      ? 'scoring_table_precomputed_male'
      : 'scoring_table_precomputed_female'
  );

  query.append(
    sql` AS t
    LEFT JOIN events ON events.id = t.event_id
    LEFT JOIN event_categories ON events.event_category_id = event_categories.id
    WHERE points > ${points} - 2 AND points < ${points} + 2
    GROUP BY event_slug, event_category`
  );

  return postgres.all<EventPerformanceRow>(query);
}

app.use((req, res, next) => {
  next(NotFound());
});

app.use(
  Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      return true;
    },
  })
);

app.use(
  errorHandler({
    onError(error) {
      if (error instanceof ApiError && error.status! < 500) {
        logger.warn(error.message, { error });
      } else {
        logger.error(error);
      }
    },
  })
);

listen(server, {
  port: app.get('port'),
  logger,
  async onShutdown() {
    await postgres.end();
  },
});
