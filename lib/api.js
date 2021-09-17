const { config } = require("./config");
const { JSDOM } = require("jsdom");
const currencyjs = require("currency.js");
const got = require("got");

const api = got.extend({});

module.exports = {
  listProducts,
};

async function listProducts() {
  var products = new Set();

  // Search products with config.productsSearch
  for (let s of config.get("productsSearch")) {
    let request = await api.get(s);
    let dom = new JSDOM(request.body);
    let items = dom.window.document.querySelectorAll(
      `[data-qa='product-thumb']`
    );
    items.forEach((i) => {
      products.add(new URL(request.url).origin + i.href.split("#")[0]);
    });
  }

  // Add products from config.products
  for (let p of config.get("products")) {
    products.add(p);
  }

  var result = {};
  for (let p of products.values()) {
    Object.assign(result, await listProductPrices(p));
  }
  return result;
}

async function listProductPrices(url) {
  let request = await api.get(url);
  let dom = new JSDOM(request.body);
  let info = JSON.parse(
    dom.window.document.querySelector("[type='application/ld+json']")
      .textContent
  );
  let title = info["name"].replace(/\s+/g, " ");
  let result = {};
  for (let q = 10; q <= 12; q++) {
    let desc = dom.window.document.querySelector(`[data-qa='${q}']`);
    if (desc) {
      let condition = desc.firstChild.children[0].textContent.trim();
      let name = `${title} (${condition})`;
      result[name] = {
        price: buildPrice(
          desc.firstChild.children[1].textContent,
          dom.window.document.documentElement.lang,
          info["offers"]["priceCurrency"]
        ),
        url: `${request.url}#l=${q}`,
        name: name,
      };
    }
  }
  return result;
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
