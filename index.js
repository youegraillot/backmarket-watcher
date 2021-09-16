#!/usr/bin/env node
const notifier = require("./lib/notifier");
const { poll$ } = require("./lib/poller");
const { editConfig, resetConfig, configPath, config } = require("./lib/config");

const argv = require("yargs")
  .usage(`Usage: ${config.projectName} <command>`)
  .env("BACKMARKET")
  .command("config", "Edit the config file.")
  .command("config-reset", "Reset the config to the default values.")
  .command("config-path", "Show the path of the config file.")
  .command("watch", "Start watching for changes.", {
    config: {
      type: "string",
      describe:
        "Custom config. Note: the config will be overwrite the current config file.",
    },
  })
  .demandCommand().argv;

switch (argv._[0]) {
  case "config":
    editConfig();
    break;

  case "config-reset":
    resetConfig();
    break;

  case "config-path":
    configPath();
    break;

  case "watch":
    if (argv.config) {
      const customConfig = JSON.parse(argv.config);
      config.set(customConfig);
    }

    poll$(notifier.hasListeners$()).subscribe(
      (products) => notifier.notifyIfChanged(products),
      console.error
    );
    break;
}
