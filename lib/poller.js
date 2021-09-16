const _ = require("lodash");
const { from, of, combineLatest, timer } = require("rxjs");
const { mergeMap, filter, retry, catchError } = require("rxjs/operators");
const { config } = require("./config");
const api = require("./api");

const MINIMAL_POLLING_INTERVAL = 15000;

module.exports = {
  poll$,
};

function poll$(enabled$) {
  return pollByInterval$(enabled$);
}

function pollByInterval$(enabled$) {
  const pollingIntervalInMs = getInterval(
    "api.pollingIntervalInMs",
    MINIMAL_POLLING_INTERVAL
  );

  return combineLatest(enabled$, timer(0, pollingIntervalInMs)).pipe(
    filter(([enabled]) => enabled),
    mergeMap(() =>
      from(api.listProducts()).pipe(retry(2), catchError(logError))
    )
  );
}

function logError(error) {
  if (error.options) {
    console.error(`Error during request:
${error.options.method} ${error.options.url.toString()}
${JSON.stringify(error.options.json, null, 4)}

${error.stack}`);
  } else if (error.stack) {
    console.error(error.stack);
  } else {
    console.error(error);
  }
  return of(null);
}

function getInterval(configPath, minimumIntervalInMs) {
  const configuredIntervalInMs = config.get(configPath);
  return _.isFinite(configuredIntervalInMs)
    ? Math.max(configuredIntervalInMs, minimumIntervalInMs)
    : minimumIntervalInMs;
}
