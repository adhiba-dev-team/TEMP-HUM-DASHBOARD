module.exports = {
  apps: [
    {
      name: 'myapp-backend',
      script: 'src/server.js',
      env: {
        PORT: 5000,
        ONESIGNAL_APP_ID: '2688cceb-5140-4779-b06f-e00da0579872',
        ONESIGNAL_API_KEY:
          'os_v2_app_e2emz22ribdxtmdp4ag2av4yol5nvqfxzu4ey3n5dqxdzaezqy7z67gubprsugxnqvagp4ekpovm5kjn7nzyxatnzpm2xf63fn7nlyi',
      },
    },
  ],
};
