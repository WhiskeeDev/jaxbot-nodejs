# Jax Discord Bot
Jax (also known as tophat-bot) is a discord bot designed for TopHat moderation and CRM. It uses a heavily modified version of the wsky bot framework (framework due to be updated with changes from Jax).

## Neccessary extensions
Please make sure you are using extensions for the following when working on this bot:
- EditorConfig
- ESLint

This is necessary to make sure formatting stays the same across contributor's PRs, and anybody using a different OS.

Configuration files for both can be found in the root of this project, make sure you have a read so you know what formatting to expect.

## API error codes
You can find API error codes and their meanings [here](/https/errorCodes.md).

## Project setup
NOTE: We are presuming you already know and understand [npm](https://www.npmjs.com/), [nodejs](https://nodejs.org/en/) and how to setup discord Bots in the [Discord Developer Portal](https://discord.com/developers/applications).

Once you've cloned the project, start by installing necessary dependencies:
```
npm install
```
*NOTE: We recommend against using `npm i` for installing, as multiple users have reported having issues.*

Once our dependencies are installed, you'll need to setup the `.env` file with the necessary variables.
To find out what variables are necessary, you can run the bot once using `npm run live` and then stopping it.
The bot should have given an error with all the missing "required" variables.

Once your `.env` is configured, you can run the bot using:
```
npm run live
```

The bot is designed to give as informative error messages as possible, so if there is any issues have a read of the log files.
If you are experiencing an issue that hasn't been answered in our FAQ, you can [make a report in the issues section](https://github.com/WhiskeeDev/tophat-bot/issues).
