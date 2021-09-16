const notifier = require("node-notifier");
const { config } = require("./config");
const telegramBot = require("./telegram-bot");
const _ = require("lodash");
const { of, combineLatest } = require("rxjs");
const { map } = require("rxjs/operators");
const { notifyIFTTT } = require("./ifttt");
const { notifyGotify } = require("./gotify");

const cache = { products: {} };

module.exports = {
  hasListeners$,
  notifyIfChanged,
};

function hasListeners$() {
  return combineLatest(
    of(config.get("notifications.console.enabled")),
    of(config.get("notifications.desktop.enabled")),
    of(config.get("notifications.ifttt.enabled")),
    of(config.get("notifications.gotify.enabled")),
    telegramBot.hasActiveChats$()
  ).pipe(map((enabledItems) => _.some(enabledItems)));
}

function notifyIfChanged(products) {
  const filteredProducts = filterProducts(products);
  const textMessage = createTextMessage(filteredProducts);
  const htmlMessage = createHtmlMessage(filteredProducts);

  if (config.get("notifications.console.enabled")) {
    notifyConsole(textMessage, config.get("notifications.console"));
  }

  if (filteredProducts.length > 0) {
    if (config.get("notifications.desktop.enabled")) {
      notifyDesktop(textMessage);
    }
    if (config.get("notifications.telegram.enabled")) {
      telegramBot.notify(htmlMessage);
    }
    if (config.get("notifications.ifttt.enabled")) {
      notifyIFTTT(textMessage, htmlMessage);
    }
    if (config.get("notifications.gotify.enabled")) {
      notifyGotify(filteredProducts);
    }
  }

  cache.products = products;
}

function filterProducts(products) {
  return Object.keys(products)
    .filter((key) => {
      const current = products[key];
      const previous = cache.products[key];
      return hasInterestingChange(current, previous);
    })
    .map((key) => products[key]);
}

function hasInterestingChange(current, previous) {
  const options = config.get("messageFilter");

  const currentPrice = current.price.value;
  const previousPrice = previous ? previous.price.value : 0;

  if (currentPrice === previousPrice) {
    return options.showUnchanged;
  } else if (currentPrice === 0) {
    return options.showDecreaseToZero;
  } else if (currentPrice < previousPrice) {
    return options.showDecrease;
  } else if (previousPrice === 0) {
    return options.showIncreaseFromZero;
  } else {
    return options.showIncrease;
  }
}

function notifyConsole(message, options) {
  if (options.clear) {
    console.clear();
  }
  console.log(message + "\n");
}

function notifyDesktop(message) {
  notifier.notify({ title: config.projectName, message });
}

function createTextMessage(products) {
  return products
    .map(
      (p) => `${p.name}
Price: ${p.price.format()}`
    )
    .join("\n\n");
}

function createHtmlMessage(products) {
  return products
    .map(
      (p) => `<a href="${p.url}">${p.name}</a>
Price: ${p.price.format()}`
    )
    .join("\n\n");
}
