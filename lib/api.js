const { config } = require("./config");
const { JSDOM } = require("jsdom");
const currencyjs = require("currency.js");
const got = require("got");

const api = got.extend({
  resolveBodyOnly: true,
});

module.exports = {
  listProducts,
};

async function listProducts() {
  var results = {};
  for (const p in config.get("products")) {
    let result = await api.get(config.get("products")[p]);
    let dom = new JSDOM(result);
    let info = JSON.parse(
      dom.window.document.querySelector("[type='application/ld+json']")
        .textContent
    );
    let title = info["name"].replace(/\s+/g, " ");
    for (let i = 10; i <= 12; i++) {
      let desc = dom.window.document.querySelector(`[data-qa='${i}']`);
      if (desc) {
        let condition = desc.firstChild.children[0].textContent.trim();
        let name = `${title} (${condition})`;
        results[name] = {
          price: buildPrice(
            desc.firstChild.children[1].textContent,
            dom.window.document.documentElement.lang,
            info["offers"]["priceCurrency"]
          ),
          url: `${result.url}#l=${i}`,
          name: name,
        };
      }
    }
  }
  return results;
}

function buildPrice(str, lang, currency) {
  let parts = Intl.NumberFormat(lang, {
    style: "currency",
    currency: currency,
  }).formatToParts(10000);
  return currencyjs(str, {
    symbol: parts.find((p) => p.type === "currency").value,
    separator: parts.find((p) => p.type === "group").value,
    decimal: parts.find((p) => p.type === "decimal").value,
  });
}
