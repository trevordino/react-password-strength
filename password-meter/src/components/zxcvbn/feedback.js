(function() {
  var feedback, scoring;

  scoring = require('./scoring');

  feedback = {
    default_feedback: {
      warning: '',
      suggestions: ["Use a few words, avoid common phrases", "No need for symbols, digits, or uppercase letters"]
    },
    get_feedback: function(score, sequence) {
      var extra_feedback, longest_match, match, _i, _len, _ref;
      if (sequence.length === 0) {
        return this.default_feedback;
      }
      if (score > 2) {
        return {
          warning: '',
          suggestions: []
        };
      }
      longest_match = sequence[0];
      _ref = sequence.slice(1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        match = _ref[_i];
        if (match.token.length > longest_match.token.length) {
          longest_match = match;
        }
      }
      feedback = this.get_match_feedback(longest_match, sequence.length === 1);
      extra_feedback = 'Add another word or two. Uncommon words are better.';
      if (feedback != null) {
        feedback.suggestions.unshift(extra_feedback);
        if (feedback.warning == null) {
          feedback.warning = '';
        }
      } else {
        feedback = {
          warning: '',
          suggestions: [extra_feedback]
        };
      }
      return feedback;
    },
    get_match_feedback: function(match, is_sole_match) {
      var layout, warning;
      switch (match.pattern) {
        case 'dictionary':
          return this.get_dictionary_match_feedback(match, is_sole_match);
        case 'spatial':
          // feedback for spatial matches
          layout = match.graph.toUpperCase();
          warning = match.turns === 1 ? 'Straight rows of keys are easy to guess' : 'Short keyboard patterns are easy to guess';
          return {
            warning: warning,
            suggestions: ['Use a longer keyboard pattern with more turns']
          };
        case 'repeat':
          // feedback for repeat matches
          warning = match.base_token.length === 1 ? 'Repeats like "aaa" are easy to guess' : 'Repeats like "abcabcabc" are only slightly harder to guess than "abc"';
          return {
            warning: warning,
            suggestions: ['Avoid repeated words and characters']
          };
        case 'sequence':
          // feedback for sequence matches
          return {
            warning: "Sequences like abc or 6543 are easy to guess",
            suggestions: ['Avoid sequences']
          };
        case 'regex':
          // feedback for regex matches, recent years in this case
          if (match.regex_name === 'recent_year') {
            return {
              warning: "Recent years are easy to guess",
              suggestions: ['Avoid recent years', 'Avoid years that are associated with you']
            };
          }
          break;
        case 'date':
          // feedback for date matches
          return {
            warning: "Dates are often easy to guess",
            suggestions: ['Avoid dates and years that are associated with you']
          };
      }
    },
    get_dictionary_match_feedback: function(match, is_sole_match) {
      var result, suggestions, warning, word, _ref;
      warning = match.dictionary_name === 'passwords' ? is_sole_match && !match.l33t && !match.reversed ? match.rank <= 10 ? 'This is a top-10 common password' : match.rank <= 100 ? 'This is a top-100 common password' : 'This is a very common password' : match.guesses_log10 <= 4 ? 'This is similar to a commonly used password' : void 0 : match.dictionary_name === 'english_wikipedia' ? is_sole_match ? 'A word by itself is easy to guess' : void 0 : (_ref = match.dictionary_name) === 'surnames' || _ref === 'male_names' || _ref === 'female_names' ? is_sole_match ? 'Names and surnames by themselves are easy to guess' : 'Common names and surnames are easy to guess' : '';
      suggestions = [];
      word = match.token;
      if (word.match(scoring.START_UPPER)) {
        suggestions.push("Capitalization doesn't help very much");
      } else if (word.match(scoring.ALL_UPPER) && word.toLowerCase() !== word) {
        suggestions.push("All-uppercase is almost as easy to guess as all-lowercase");
      }
      if (match.reversed && match.token.length >= 4) {
        suggestions.push("Reversed words aren't much harder to guess");
      }
      if (match.l33t) {
        suggestions.push("Predictable substitutions like '@' instead of 'a' don't help very much");
      }
      result = {
        warning: warning,
        suggestions: suggestions
      };
      return result;
    }
  };

  module.exports = feedback;

}).call(this);