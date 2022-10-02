#!/usr/bin/env node
import yargs from 'yargs';
import RunCommand from './commands/run';

yargs.command(RunCommand)
     .demandCommand(1)
     .help('help').argv;
