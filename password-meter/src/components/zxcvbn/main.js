const matching = require('./matching');
const scoring = require('./scoring');
const time_estimates = require('./time_estimates');
const feedback = require('./feedback');

var time = function () {
  return new Date().getTime();
};

const zxcvbn = function (password, userInputs) {
  if (userInputs == null) {
    userInputs = [];
  }
  var start = time();
  var cleanedInputs = [];
  for (let i of userInputs) {
    try {
      cleanedInputs.push(i.toString().toLowerCase());
    } catch (e) {
      console.log('Wrong type');
    }
  }

  // for any custom inputs by the user
  // Not used in this demo
  matching.setUserInputDictionary(cleanedInputs);

  // get matches for different patterns
  const matches = matching.omnimatch(password);

  // scores the different patterns to get the one that is most guessable
  var result = scoring.mostGuessableMatchSequence(password, matches);
  result.calc_time = time() - start;

  // estimate the attact time needed to crack the password
  var attack_times = time_estimates.estimateAttackTimes(result.guesses);
  for (let prop in attack_times) {
    var val = attack_times[prop];
    result[prop] = val;
  }
  result.feedback = feedback.get_feedback(result.score, result.sequence);

  return result;
};

module.exports = zxcvbn;
