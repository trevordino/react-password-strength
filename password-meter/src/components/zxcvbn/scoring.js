(function () {
  var BRUTEFORCE_CARDINALITY,
    MIN_GUESSES_BEFORE_GROWING_SEQUENCE,
    MIN_SUBMATCH_GUESSES_MULTI_CHAR,
    MIN_SUBMATCH_GUESSES_SINGLE_CHAR,
    adjacency_graphs,
    calc_average_degree,
    k,
    scoring,
    v;

  adjacency_graphs = require('./adjacency_graphs');

  calc_average_degree = function (graph) {
    var average, k, key, n, neighbors, v;
    average = 0;
    for (key in graph) {
      neighbors = graph[key];
      average += (function () {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = neighbors.length; _i < _len; _i++) {
          n = neighbors[_i];
          if (n) {
            _results.push(n);
          }
        }
        return _results;
      })().length;
    }
    average /= (function () {
      var _results;
      _results = [];
      for (k in graph) {
        v = graph[k];
        _results.push(k);
      }
      return _results;
    })().length;
    return average;
  };

  BRUTEFORCE_CARDINALITY = 10;

  MIN_GUESSES_BEFORE_GROWING_SEQUENCE = 10000;

  MIN_SUBMATCH_GUESSES_SINGLE_CHAR = 10;

  MIN_SUBMATCH_GUESSES_MULTI_CHAR = 50;

  scoring = {
    nCk: function (n, k) {
      var d, r, _i;
      if (k > n) {
        return 0;
      }
      if (k === 0) {
        return 1;
      }
      r = 1;
      for (d = _i = 1; 1 <= k ? _i <= k : _i >= k; d = 1 <= k ? ++_i : --_i) {
        r *= n;
        r /= d;
        n -= 1;
      }
      return r;
    },
    log10: function (n) {
      return Math.log(n) / Math.log(10);
    },
    log2: function (n) {
      return Math.log(n) / Math.log(2);
    },
    factorial: function (n) {
      var f, i, _i;
      if (n < 2) {
        return 1;
      }
      f = 1;
      for (i = _i = 2; 2 <= n ? _i <= n : _i >= n; i = 2 <= n ? ++_i : --_i) {
        f *= i;
      }
      return f;
    },
    mostGuessableMatchSequence: function (password, matches, _exclude_additive) {
      //  takes a sequence of overlapping matches, returns the non-overlapping sequence with
      //  minimum guesses.


      var bruteforce_update,
        guesses,
        k,
        l,
        lst,
        m,
        make_bruteforce_match,
        matches_by_j,
        n,
        optimal,
        optimal_l,
        optimal_match_sequence,
        unwind,
        update,
        _,
        _i,
        _j,
        _k,
        _l,
        _len,
        _len1,
        _len2,
        _ref;
      if (_exclude_additive == null) {
        _exclude_additive = false;
      }
      n = password.length;
      matches_by_j = (function () {
        var _i, _results;
        _results = [];
        for (_ = _i = 0; 0 <= n ? _i < n : _i > n; _ = 0 <= n ? ++_i : --_i) {
          _results.push([]);
        }
        return _results;
      })();
      for (const m of matches) {
        matches_by_j[m.j].push(m);
      }
      for (_j = 0, _len1 = matches_by_j.length; _j < _len1; _j++) {
        lst = matches_by_j[_j];
        lst.sort(function (m1, m2) {
          return m1.i - m2.i;
        });
      }
      optimal = {
        m: (function () {
          var _k, _results;
          _results = [];
          for (_ = _k = 0; 0 <= n ? _k < n : _k > n; _ = 0 <= n ? ++_k : --_k) {
            _results.push({});
          }
          return _results;
        })(),
        pi: (function () {
          var _k, _results;
          _results = [];
          for (_ = _k = 0; 0 <= n ? _k < n : _k > n; _ = 0 <= n ? ++_k : --_k) {
            _results.push({});
          }
          return _results;
        })(),
        g: (function () {
          var _k, _results;
          _results = [];
          for (_ = _k = 0; 0 <= n ? _k < n : _k > n; _ = 0 <= n ? ++_k : --_k) {
            _results.push({});
          }
          return _results;
        })(),
      };
      update = (function (_this) {
        return function (m, l) {
          var competing_g, competing_l, g, k, pi, _ref;
          k = m.j;
          pi = _this.estimate_guesses(m, password);
          if (l > 1) {
            pi *= optimal.pi[m.i - 1][l - 1];
          }
          g = _this.factorial(l) * pi;
          if (!_exclude_additive) {
            g += Math.pow(MIN_GUESSES_BEFORE_GROWING_SEQUENCE, l - 1);
          }
          _ref = optimal.g[k];
          for (competing_l in _ref) {
            competing_g = _ref[competing_l];
            if (competing_l > l) {
              continue;
            }
            if (competing_g <= g) {
              return;
            }
          }
          optimal.g[k][l] = g;
          optimal.m[k][l] = m;
          return (optimal.pi[k][l] = pi);
        };
      })(this);
      bruteforce_update = (function (_this) {
        return function (k) {
          var i, l, last_m, _k, _results;
          m = make_bruteforce_match(0, k);
          update(m, 1);
          _results = [];
          for (i = _k = 1; 1 <= k ? _k <= k : _k >= k; i = 1 <= k ? ++_k : --_k) {
            m = make_bruteforce_match(i, k);
            _results.push(
              (function () {
                var _ref, _results1;
                _ref = optimal.m[i - 1];
                _results1 = [];
                for (l in _ref) {
                  last_m = _ref[l];
                  l = parseInt(l);
                  if (last_m.pattern === 'bruteforce') {
                    continue;
                  }
                  _results1.push(update(m, l + 1));
                }
                return _results1;
              })()
            );
          }
          return _results;
        };
      })(this);
      make_bruteforce_match = (function (_this) {
        return function (i, j) {
          return {
            pattern: 'bruteforce',
            token: password.slice(i, +j + 1 || 9e9),
            i: i,
            j: j,
          };
        };
      })(this);
      unwind = (function (_this) {
        return function (n) {
          var candidate_g, candidate_l, g, k, l, optimal_match_sequence, _ref;
          optimal_match_sequence = [];
          k = n - 1;
          l = void 0;
          g = Infinity;
          _ref = optimal.g[k];
          for (candidate_l in _ref) {
            candidate_g = _ref[candidate_l];
            if (candidate_g < g) {
              l = candidate_l;
              g = candidate_g;
            }
          }
          while (k >= 0) {
            m = optimal.m[k][l];
            optimal_match_sequence.unshift(m);
            k = m.i - 1;
            l--;
          }
          return optimal_match_sequence;
        };
      })(this);
      for (k = _k = 0; 0 <= n ? _k < n : _k > n; k = 0 <= n ? ++_k : --_k) {
        _ref = matches_by_j[k];
        for (_l = 0, _len2 = _ref.length; _l < _len2; _l++) {
          m = _ref[_l];
          if (m.i > 0) {
            for (l in optimal.m[m.i - 1]) {
              l = parseInt(l);
              update(m, l + 1);
            }
          } else {
            update(m, 1);
          }
        }
        bruteforce_update(k);
      }
      optimal_match_sequence = unwind(n);
      optimal_l = optimal_match_sequence.length;
      if (password.length === 0) {
        guesses = 1;
      } else {
        guesses = optimal.g[n - 1][optimal_l];
      }
      return {
        password: password,
        guesses: guesses,
        guesses_log10: this.log10(guesses),
        sequence: optimal_match_sequence,
      };
    },
    estimate_guesses: function (match, password) {
      var estimation_functions, guesses, min_guesses;
      if (match.guesses != null) {
        return match.guesses;
      }
      min_guesses = 1;
      if (match.token.length < password.length) {
        min_guesses = match.token.length === 1 ? MIN_SUBMATCH_GUESSES_SINGLE_CHAR : MIN_SUBMATCH_GUESSES_MULTI_CHAR;
      }
      estimation_functions = {
        bruteforce: this.bruteforce_guesses,
        dictionary: this.dictionary_guesses,
        spatial: this.spatial_guesses,
        repeat: this.repeat_guesses,
        sequence: this.sequence_guesses,
        regex: this.regex_guesses,
        date: this.date_guesses,
      };
      guesses = estimation_functions[match.pattern].call(this, match);
      match.guesses = Math.max(guesses, min_guesses);
      match.guesses_log10 = this.log10(match.guesses);
      return match.guesses;
    },
    bruteforce_guesses: function (match) {
      var guesses, min_guesses;
      guesses = Math.pow(BRUTEFORCE_CARDINALITY, match.token.length);
      if (guesses === Number.POSITIVE_INFINITY) {
        guesses = Number.MAX_VALUE;
      }
      min_guesses = match.token.length === 1 ? MIN_SUBMATCH_GUESSES_SINGLE_CHAR + 1 : MIN_SUBMATCH_GUESSES_MULTI_CHAR + 1;
      return Math.max(guesses, min_guesses);
    },
    repeat_guesses: function (match) {
      return match.base_guesses * match.repeat_count;
    },
    sequence_guesses: function (match) {
      var base_guesses, first_chr;
      first_chr = match.token.charAt(0);
      if (
        first_chr === 'a' ||
        first_chr === 'A' ||
        first_chr === 'z' ||
        first_chr === 'Z' ||
        first_chr === '0' ||
        first_chr === '1' ||
        first_chr === '9'
      ) {
        base_guesses = 4;
      } else {
        if (first_chr.match(/\d/)) {
          base_guesses = 10;
        } else {
          base_guesses = 26;
        }
      }
      if (!match.ascending) {
        base_guesses *= 2;
      }
      return base_guesses * match.token.length;
    },
    MIN_YEAR_SPACE: 20,
    REFERENCE_YEAR: new Date().getFullYear(),
    regex_guesses: function (match) {
      var char_class_bases, year_space;
      char_class_bases = {
        alpha_lower: 26,
        alpha_upper: 26,
        alpha: 52,
        alphanumeric: 62,
        digits: 10,
        symbols: 33,
      };
      if (match.regex_name in char_class_bases) {
        return Math.pow(char_class_bases[match.regex_name], match.token.length);
      } else {
        switch (match.regex_name) {
          case 'recent_year':
            year_space = Math.abs(parseInt(match.regex_match[0]) - this.REFERENCE_YEAR);
            year_space = Math.max(year_space, this.MIN_YEAR_SPACE);
            return year_space;
        }
      }
    },
    date_guesses: function (match) {
      var guesses, year_space;
      year_space = Math.max(Math.abs(match.year - this.REFERENCE_YEAR), this.MIN_YEAR_SPACE);
      guesses = year_space * 365;
      if (match.separator) {
        guesses *= 4;
      }
      return guesses;
    },
    KEYBOARD_AVERAGE_DEGREE: calc_average_degree(adjacency_graphs.qwerty),
    KEYPAD_AVERAGE_DEGREE: calc_average_degree(adjacency_graphs.keypad),
    KEYBOARD_STARTING_POSITIONS: (function () {
      var _ref, _results;
      _ref = adjacency_graphs.qwerty;
      _results = [];
      for (k in _ref) {
        v = _ref[k];
        _results.push(k);
      }
      return _results;
    })().length,
    KEYPAD_STARTING_POSITIONS: (function () {
      var _ref, _results;
      _ref = adjacency_graphs.keypad;
      _results = [];
      for (k in _ref) {
        v = _ref[k];
        _results.push(k);
      }
      return _results;
    })().length,
    spatial_guesses: function (match) {
      var L, S, U, d, guesses, i, j, possible_turns, s, shifted_variations, t, _i, _j, _k, _ref, _ref1;
      if ((_ref = match.graph) === 'qwerty' || _ref === 'dvorak') {
        s = this.KEYBOARD_STARTING_POSITIONS;
        d = this.KEYBOARD_AVERAGE_DEGREE;
      } else {
        s = this.KEYPAD_STARTING_POSITIONS;
        d = this.KEYPAD_AVERAGE_DEGREE;
      }
      guesses = 0;
      L = match.token.length;
      t = match.turns;
      for (i = _i = 2; 2 <= L ? _i <= L : _i >= L; i = 2 <= L ? ++_i : --_i) {
        possible_turns = Math.min(t, i - 1);
        for (j = _j = 1; 1 <= possible_turns ? _j <= possible_turns : _j >= possible_turns; j = 1 <= possible_turns ? ++_j : --_j) {
          guesses += this.nCk(i - 1, j - 1) * s * Math.pow(d, j);
        }
      }
      if (match.shifted_count) {
        S = match.shifted_count;
        U = match.token.length - match.shifted_count;
        if (S === 0 || U === 0) {
          guesses *= 2;
        } else {
          shifted_variations = 0;
          for (i = _k = 1, _ref1 = Math.min(S, U); 1 <= _ref1 ? _k <= _ref1 : _k >= _ref1; i = 1 <= _ref1 ? ++_k : --_k) {
            shifted_variations += this.nCk(S + U, i);
          }
          guesses *= shifted_variations;
        }
      }
      return guesses;
    },
    dictionary_guesses: function (match) {
      var reversed_variations;
      match.base_guesses = match.rank;
      match.uppercase_variations = this.uppercase_variations(match);
      match.l33t_variations = this.l33t_variations(match);
      reversed_variations = (match.reversed && 2) || 1;
      return match.base_guesses * match.uppercase_variations * match.l33t_variations * reversed_variations;
    },
    START_UPPER: /^[A-Z][^A-Z]+$/,
    END_UPPER: /^[^A-Z]+[A-Z]$/,
    ALL_UPPER: /^[^a-z]+$/,
    ALL_LOWER: /^[^A-Z]+$/,
    uppercase_variations: function (match) {
      var L, U, chr, i, regex, variations, word, _i, _j, _len, _ref, _ref1;
      word = match.token;
      if (word.match(this.ALL_LOWER) || word.toLowerCase() === word) {
        return 1;
      }
      _ref = [this.START_UPPER, this.END_UPPER, this.ALL_UPPER];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        regex = _ref[_i];
        if (word.match(regex)) {
          return 2;
        }
      }
      U = (function () {
        var _j, _len1, _ref1, _results;
        _ref1 = word.split('');
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          chr = _ref1[_j];
          if (chr.match(/[A-Z]/)) {
            _results.push(chr);
          }
        }
        return _results;
      })().length;
      L = (function () {
        var _j, _len1, _ref1, _results;
        _ref1 = word.split('');
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          chr = _ref1[_j];
          if (chr.match(/[a-z]/)) {
            _results.push(chr);
          }
        }
        return _results;
      })().length;
      variations = 0;
      for (i = _j = 1, _ref1 = Math.min(U, L); 1 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 1 <= _ref1 ? ++_j : --_j) {
        variations += this.nCk(U + L, i);
      }
      return variations;
    },
    l33t_variations: function (match) {
      var S, U, chr, chrs, i, p, possibilities, subbed, unsubbed, variations, _i, _ref;
      if (!match.l33t) {
        return 1;
      }
      variations = 1;
      _ref = match.sub;
      for (subbed in _ref) {
        unsubbed = _ref[subbed];
        chrs = match.token.toLowerCase().split('');
        S = (function () {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = chrs.length; _i < _len; _i++) {
            chr = chrs[_i];
            if (chr === subbed) {
              _results.push(chr);
            }
          }
          return _results;
        })().length;
        U = (function () {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = chrs.length; _i < _len; _i++) {
            chr = chrs[_i];
            if (chr === unsubbed) {
              _results.push(chr);
            }
          }
          return _results;
        })().length;
        if (S === 0 || U === 0) {
          variations *= 2;
        } else {
          p = Math.min(U, S);
          possibilities = 0;
          for (i = _i = 1; 1 <= p ? _i <= p : _i >= p; i = 1 <= p ? ++_i : --_i) {
            possibilities += this.nCk(U + S, i);
          }
          variations *= possibilities;
        }
      }
      return variations;
    },
  };

  module.exports = scoring;
}.call(this));
