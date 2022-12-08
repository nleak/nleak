## Usage

You can simply install NLeak globally and run it on your NodeJS application.

```
npm install -g nleak
```

Once you have installed the nleak module globally, you can run NLeak on your application by simply running the following command:

```
nleak run --config ./config.js --guest-app-entry ./app.js --out ./
```

As a result, you will get a `nleak_result.json` file in the current directory. This file contains the memory leak detection result. You can also use the NLeak viewer to visualize the result.
