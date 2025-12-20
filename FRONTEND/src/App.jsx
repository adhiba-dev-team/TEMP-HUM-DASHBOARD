import './App.css'
import AppRouter from './router/routes.jsx'
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Create deferred queue
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async function (OneSignal) {
      console.log('OneSignal SDK loaded ✅');

      await OneSignal.init({
        appId: '2688cceb-5140-4779-b06f-e00da0579872',
        notifyButton: {
          enable: true,
        },
      });

      console.log('Init complete');
      console.log('OptedIn:', OneSignal.User.PushSubscription.optedIn);
      console.log('Subscription ID:', OneSignal.User.PushSubscription.id);
    });
  }, []);
  return (
    <>
      <AppRouter />
    </>
  )
}

export default App
