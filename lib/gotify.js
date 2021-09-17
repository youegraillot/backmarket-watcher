const got = require("got");
const { config } = require("./config");

const api = got.extend({
  prefixUrl: config.get("notifications.gotify.url"),
});

module.exports = {
  notifyGotify,
};

function notifyGotify(products) {
  products.forEach((p) => {
    api.post(`message?token=${config.get("notifications.gotify.apptoken")}`, {
      json: {
        title: p.name,
        message: `${p.description}\n> ${p.price.format()}`,
        priority: config.get("notifications.gotify.priority"),
        extras: {
          "client::notification": {
            click: { url: p.url },
          },
        },
      },
    });
  });
}
