const timeEstimates = {
  estimateAttackTimes: function (guesses) {
    let crack_times_seconds = {
      online_throttling_100_per_hour: guesses / (100 / 3600),
      online_no_throttling_10_per_second: guesses / 10,
      offline_slow_hashing_1e4_per_second: guesses / 1e4,
      offline_fast_hashing_1e10_per_second: guesses / 1e10,
    };
    let crack_times_display = {};
    for (const scenario in crack_times_seconds) {
      let seconds = crack_times_seconds[scenario];
      crack_times_display[scenario] = this.display_time(seconds);
    }
    return {
      crack_times_seconds: crack_times_seconds,
      crack_times_display: crack_times_display,
      score: this.guesses_to_score(guesses),
    };
  },
  guesses_to_score: function (guesses) {
    const DELTA = 5;
    if (guesses < 1e3 + DELTA) {
      //  risky password: "too guessable"
      return 0;
    } else if (guesses < 1e6 + DELTA) {
      // modest protection from throttled online attacks: "very guessable"
      return 1;
    } else if (guesses < 1e8 + DELTA) {
      // modest protection from unthrottled online attacks: "somewhat guessable"
      return 2;
    } else if (guesses < 1e10 + DELTA) {
      // modest protection from offline attacks: "safely unguessable"
      // assuming a salted, slow hash function like bcrypt, scrypt, PBKDF2, argon, etc
      return 3;
    } else {
      // strong protection from offline attacks under same scenario: "very unguessable"
      return 4;
    }
  },
  display_time: function (seconds) {
    var base, century, day, display_num, display_str, hour, minute, month, year, _ref;
    minute = 60;
    hour = minute * 60;
    day = hour * 24;
    month = day * 31;
    year = month * 12;
    century = year * 100;
    _ref =
      seconds < 1
        ? [null, 'less than a second']
        : seconds < minute
        ? ((base = Math.round(seconds)), [base, base + ' second'])
        : seconds < hour
        ? ((base = Math.round(seconds / minute)), [base, base + ' minute'])
        : seconds < day
        ? ((base = Math.round(seconds / hour)), [base, base + ' hour'])
        : seconds < month
        ? ((base = Math.round(seconds / day)), [base, base + ' day'])
        : seconds < year
        ? ((base = Math.round(seconds / month)), [base, base + ' month'])
        : seconds < century
        ? ((base = Math.round(seconds / year)), [base, base + ' year'])
        : [null, 'centuries'];
    display_num = _ref[0];
    display_str = _ref[1];
    if (display_num != null && display_num !== 1) {
      display_str += 's';
    }
    return display_str;
  },
};

module.exports = timeEstimates;
