import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';

var zxcvbn = require('zxcvbn');

export function Home(props) {
  const [password, setPassword] = useState('');
  const [crackTimeDisplay, setCrackTimeDisplay] = useState('');
  const [feedback, setFeedback] = useState('');

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    let result = zxcvbn(event.target.value);
    setCrackTimeDisplay(result.crack_times_display);
    setFeedback(result.feedback);
  };

  return (
    <div>
      <h1>Password Strength Meter</h1>
      <input type='password' name='' id='' onChange={handlePasswordChange} />
      {password !== '' && (
        <div>
          <h4>Estimated Crack times</h4>
          <Row>
            <Col>
              <h5>Online Rate Limited: {crackTimeDisplay.online_throttling_100_per_hour}</h5>
              <h5>Online, No Rate Limit: {crackTimeDisplay.online_no_throttling_10_per_second}</h5>
            </Col>
            <Col>
              <h5>Offline Slow Hash: {crackTimeDisplay.offline_slow_hashing_1e4_per_second}</h5>
              <h5>Offline Fash Hash: {crackTimeDisplay.offline_fast_hashing_1e10_per_second}</h5>
            </Col>
          </Row>
          <h4>Feedback</h4>
          {feedback.warning && <p>{feedback.warning}</p>}
          {feedback.suggestions && <p>{feedback.suggestions}</p>}
        </div>
      )}
    </div>
  );
}
