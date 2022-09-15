/**
 * Thin wrapper to parse env, so we load correct `.env`
 */
import dotenv from 'dotenv'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { exportCommand } from './commands/export/export.command'
import { importCommand } from './commands/import/import.command'
import { parseCommand } from './commands/parse/parse.command'
import { resetCommand } from './commands/reset/reset.command'
import { scrapeCommand } from './commands/scrape/scrape.command'
import { tasksCommand } from './commands/tasks/tasks.command'
import { Stage } from './shared/utils/env'

dotenv.config({ path: '.env' })

/**
 * We create wrapper around our cli commands so we can load env vars as needed. Calling nx will automatically load `.env`, we'll have to wait until this PR gets published to nrwl https://github.com/nrwl/nx/issues/5426
 *
 * Having our own CLI commands also makes it more self documenting on what commands are possible. Think of this as docs for devs, it creates a better DX.
 */
void yargs(hideBin(process.argv))
  .scriptName('cli')
  /**
   * These scripts could act on different deployment environment, so we group under `data`
   */
  .command('data', 'Import / export / reset', (argv) =>
    argv
      .options({
        stage: {
          alias: 's',
          describe: 'The deployment environment',
          demandOption: true,
          default: Stage.Dev,
          type: 'string',
          choices: Object.values(Stage),
        },
      })
      // Load different env based on stage
      .middleware(({ stage }) => {
        if (process.env.CI) {
          return
        }

        // Load prod env only if not CI
        if (stage === Stage.Prod) {
          dotenv.config({ path: '.env.prod', override: true })
          // console.log(process.env.NEO4J_URI)
        }

        if (stage === Stage.Dev) {
          dotenv.config({ path: '.env', override: true })
          // console.log(process.env.NEO4J_URI)
        }
      })
      .command(resetCommand)
      .command(importCommand)
      .command(exportCommand)
      .demandCommand(1, 'Please provide a command'),
  )

  /**
   * These scripts don't require env to be explicitly set
   */
  .command(tasksCommand)
  .command(scrapeCommand)
  .command(parseCommand)

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
