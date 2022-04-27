import React, { useState } from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { ParticlesContainer } from './ParticleContainer.tsx';

import zxcvbn from 'zxcvbn';
import PasswordStrengthBar from '../components/passwordBar/PasswordStrengthBar.tsx';

export function Home(props) {
  const [password, setPassword] = useState('');
  const [crackTimeDisplay, setCrackTimeDisplay] = useState('');
  const [feedback, setFeedback] = useState('');
  const [zxcvbnResult, setZxcvbnResult] = useState(null);
  const [passwordType, setPasswordType] = useState(true);
  const [buttonText, setButtonText] = useState('Show Password');

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    let result = zxcvbn(event.target.value);
    setZxcvbnResult(result);
    setCrackTimeDisplay(result.crack_times_display);
    setFeedback(result.feedback);
  };

  const togglePassword = () => {
    setPasswordType(!passwordType);
    setButtonText(passwordType ? 'Hide Password' : 'Show Password');
  };

  return (
    <div className='col-lg-6 mx-auto h-100 justify-content-center'>
      <Row className='h-100'>
        <Col className='align-middle my-auto bg-secondary bg-opacity-50 p-5'>
          <h1 className='text-center'>Password Strength Meter</h1>
          <Form.Control type={passwordType ? 'password' : 'text'} className='mb-3' onChange={handlePasswordChange} />
          <PasswordStrengthBar password={password} />
          <Row className='justify-content-center'>
            <Button className='w-50' onClick={togglePassword} varient='primary'>
              {buttonText}
            </Button>
          </Row>

          {password !== '' && (
            <div>
              <h4>Guesses</h4>
              <h5>{zxcvbnResult.guesses}</h5>
              <h4>Feedback</h4>
              {feedback.warning && <p>{feedback.warning}</p>}
              {feedback.suggestions && <p>{feedback.suggestions}</p>}
              {/* <h4>Estimated Crack times</h4>
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
              {feedback.suggestions && <p>{feedback.suggestions}</p>} */}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
