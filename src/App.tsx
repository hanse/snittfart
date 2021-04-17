import * as React from 'react';

import { Header } from './Header';
import PaceCalculator from './PaceCalculator';

function App() {
  return (
    <>
      <Header title="Snittfart" />
      <div className="content-container">
        <div className="content-view">
          <main>
            <PaceCalculator />
          </main>

          <footer>
            Email <a href="mailto:post@snittfart.no">post@snittfart.no</a> for
            support and other requests &middot;{' '}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.location = window.location;
              }}
            >
              Reload
            </a>
          </footer>
        </div>
      </div>
    </>
  );
}

export default App;
