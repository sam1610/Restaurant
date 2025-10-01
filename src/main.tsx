import React from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json'; // Adjust path if needed
import '@aws-amplify/ui-react/styles.css';
// import App from './App.tsx'; // Adjust ppathath
import App from './App';



// import App from './App'; // Adjust path

Amplify.configure(outputs);

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
// create root then use Authenticator to wrap App

const root = createRoot(document.getElementById('root')!);
root.render(
  <Authenticator>
    {({ signOut, user }) => <App signOut={signOut} user={user} />}
  </Authenticator>
);