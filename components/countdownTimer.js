import React, { useEffect, useState } from 'react';
import { intervalToDuration } from 'date-fns'
// import './CountdownTimer.css';

const CountdownTimer = ({ dropDate }) => {
  const [timerString, setTimerString] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const remainingDate = intervalToDuration({
        start: new Date(),
        end: dropDate
      })

      const remaining = `${remainingDate.days}d ${remainingDate.hours}h ${remainingDate.minutes}m ${remainingDate.seconds}s`
      setTimerString(remaining)  
    }, 1000);

    return () => {
      if (interval) {
          clearInterval(interval);
      }
    }
  }, [dropDate])


  return (
    <div className="timer-container">
      <p className="timer-header">
        NFT drop starts In {timerString && <span>{timerString}</span>}
      </p>
    </div>
  );
};

export default CountdownTimer;