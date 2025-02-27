/**
 * Thin wrapper to parse env, so we load correct `.env`
 */
import { config } from 'dotenv'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { exportCommand } from './commands/export/export.command'
import { importCommand } from './commands/import/import.command'
import { resetCommand } from './commands/reset/reset.command'
import { scrapeCommand } from './commands/scrape/scrape.command'
import { seedCommand } from './commands/seed/seed.command'
import { tasksCommand } from './commands/tasks/tasks.command'
import { terraformCommand } from './commands/terraform/terraform.command'
import { getStageOptions, loadStageMiddleware } from './shared/command'
import { Stage } from './shared/utils/stage'

// Assume `.env` if no other middleware
config({})

/**
 * We create wrapper around our cli commands so we can load env vars as needed. Calling nx will automatically load `.env`, we'll have to wait until this PR gets published to nrwl https://github.com/nrwl/nx/issues/5426
 *
 * Having our own CLI commands also makes it more self documenting on what commands are possible. Think of this as docs for devs, it creates a better DX.
 */
void yargs(hideBin(process.argv))
  .scriptName('cli')
  // .options(getEnvOptions([Stage.Dev, Stage.Test, Stage.Prod]))
  // .middleware(loadStageMiddleware)
  /**
   * These scripts could act on different deployment environment, so we group under `data`
   */
  .command('data', 'Import / export / reset', (argv) =>
    argv
      .command(seedCommand)
      .command(resetCommand)
      .command(importCommand)
      .command(exportCommand)
      /**
       * Here we initialize all data, data ID is created so may duplicate data
       *
       * - Basic Types
       * - Atoms & interfaces
       */
      .demandCommand(1, 'Please provide a command'),
  )

  /**
   * These scripts don't require env to be explicitly set
   */
  .command(tasksCommand)
  /**
   * This uses puppeteer to scrape the API documentation as CSV file
   */
  .command(scrapeCommand)

  /**
   * Terraform
   */
  .command(terraformCommand)

  /**
   * TS Parser
   */

  // .command('parse-ts', 'Typescript prop types to Interface parse', (_yargs) => {
  //   return _yargs.command(
  //     'mui',
  //     "Parses Material UI's component declarations",
  //     (__yargs) =>
  //       __yargs.option('dir', {
  //         type: 'string',
  //         alias: 'd',
  //         required: true,
  //         describe:
  //           'The root directory where MUI is downloaded, e.g. ~/material-ui',
  //       }),
  //     (argv) => runCli(Env.Dev, `parse-ts mui -d ${argv.dir}`),
  //   )
  // })

  .demandCommand(1, 'Please provide a command')
  // Must add this to throw error for unknown arguments
  .strict().argv
