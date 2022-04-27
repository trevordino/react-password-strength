const frequencyLists = require('./frequency_lists');
const adjacencyGraphs = require('./adjacency_graphs');
const scoring = require('./scoring');

var buildRankedDict = function (orderedList) {
  var result = {};
  var curr = 1;
  for (const word of orderedList) {
    result[word] = curr;
    curr += 1;
  }
  return result;
};

var RANKED_DICTIONARIES = {};

for (const name in frequencyLists) {
  let lst = frequencyLists[name];
  RANKED_DICTIONARIES[name] = buildRankedDict(lst);
}

// const for adjencency graphs
// shows the 6 characters around a key
const GRAPHS = {
  qwerty: adjacencyGraphs.qwerty,
  dvorak: adjacencyGraphs.dvorak,
  keypad: adjacencyGraphs.keypad,
  mac_keypad: adjacencyGraphs.mac_keypad,
};

// const for l33t substitutions
const L33T_TABLE = {
  a: ['4', '@'],
  b: ['8'],
  c: ['(', '{', '[', '<'],
  e: ['3'],
  g: ['6', '9'],
  i: ['1', '!', '|'],
  l: ['1', '|', '7'],
  o: ['0'],
  s: ['$', '5'],
  t: ['+', '7'],
  x: ['%'],
  z: ['2'],
};

// const for regex dates
const REGEXEN = {
  recent_year: /19\d\d|200\d|201\d|202\d/g,
};

// 
const DATE_SPLITS = {
  4: [
    [1, 2],
    [2, 3],
  ],
  5: [
    [1, 3],
    [2, 3],
  ],
  6: [
    [1, 2],
    [2, 4],
    [4, 5],
  ],
  7: [
    [1, 3],
    [2, 3],
    [4, 5],
    [4, 6],
  ],
  8: [
    [2, 4],
    [4, 6],
  ],
};

const matching = {
  empty: function (obj) {
    let results = [];
    for (const k in obj) {
      results.push(k);
    }
    return results;
  },
  extend: function (lst, lst2) {
    return lst.push.apply(lst, lst2);
  },
  translate: function (string, chrMap) {
    return (function () {
      let ref = string.split('');
      let results = [];
      for (const chr of ref) {
        results.push(chrMap[chr] || chr);
      }
      return results;
    })().join('');
  },
  mod: function (n, m) {
    return ((n % m) + m) % m;
  },
  sorted: function (matches) {
    // Sort matches according to length

    return matches.sort(function (m1, m2) {
      return m1.i - m2.i || m1.j - m2.j;
    });
  },
  omnimatch: function (password) {
    // Function to find all possible matches for a password.

    // The omnimatch function takes a password and returns an array of
    // possible matches, sorted in order of decreasing likelihood.
    let matches = [];
    const matchers = [
      this.dictionaryMatch,
      this.reverseDictionaryMatch,
      this.l33tMatch,
      this.spatialMatch,
      this.repeatMatch,
      this.sequenceMatch,
      this.regexMatch,
      this.dateMatch,
    ];
    for (const matcher of matchers) {
      this.extend(matches, matcher.call(this, password));
    }
    return this.sorted(matches);
  },
  dictionaryMatch: function (password, _rankedDictionaries) {
    // Function to check if password is in a dictionary.
    // This dictionary is from freq_list
    // consist of common passwords, surnames, eng words, names, films
    var i, j, rank, word, _i, _j;
    if (_rankedDictionaries == null) {
      _rankedDictionaries = RANKED_DICTIONARIES;
    }
    let matches = [];
    let len = password.length;
    let lowerCasePassword = password.toLowerCase();
    for (const dictionaryName in _rankedDictionaries) {
      let ranked_dict = _rankedDictionaries[dictionaryName];
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        for (j = _j = i; i <= len ? _j < len : _j > len; j = i <= len ? ++_j : --_j) {
          if (lowerCasePassword.slice(i, +j + 1 || 9e9) in ranked_dict) {
            word = lowerCasePassword.slice(i, +j + 1 || 9e9);
            rank = ranked_dict[word];
            matches.push({
              pattern: 'dictionary',
              i: i,
              j: j,
              token: password.slice(i, +j + 1 || 9e9),
              matched_word: word,
              rank: rank,
              dictionary_name: dictionaryName,
              reversed: false,
              l33t: false,
            });
          }
        }
      }
    }
    return this.sorted(matches);
  },
  reverseDictionaryMatch: function (password, _rankedDictionaries) {
    // Function to check if password in reverse is in a dictionary.
    // This checks against poor passwords that are typed in reverse

    if (_rankedDictionaries == null) {
      _rankedDictionaries = RANKED_DICTIONARIES;
    }
    const reversedPassword = password.split('').reverse().join('');
    let matches = this.dictionaryMatch(reversedPassword, _rankedDictionaries);
    for (const match of matches) {
      match.token = match.token.split('').reverse().join('');
      match.reversed = true;
      let ref = [password.length - 1 - match.j, password.length - 1 - match.i];
      match.i = ref[0];
      match.j = ref[1];
    }
    return this.sorted(matches);
  },
  setUserInputDictionary: function (orderedList) {
    // used if there are any custom user inputs
    // not used in this demo
    RANKED_DICTIONARIES['user_inputs'] = buildRankedDict(orderedList.slice());
  },
  relevantl33tSubtable: function (password, table) {
    // 

    let passwordChars = {};
    let _ref = password.split('');
    for (const chr of _ref) {
      passwordChars[chr] = true;
    }
    let subtable = {};
    for (const letter in table) {
      let subs = table[letter];
      let relevantSubs = (function () {
        let results = [];
        for (const sub of subs) {
          if (sub in passwordChars) {
            results.push(sub);
          }
        }
        return results;
      })();
      if (relevantSubs.length > 0) {
        subtable[letter] = relevantSubs;
      }
    }
    return subtable;
  },
  enumeratel33tSubs: function (table) {
    var chr, dedup, helper, l33t_chr, sub, sub_dict, sub_dicts, subs, _i, _j, _len, _len1, _ref;
    let keys = (function () {
      let _results;
      _results = [];
      for (const k in table) {
        _results.push(k);
      }
      return _results;
    })();
    subs = [[]];
    dedup = function (subs) {
      var assoc, deduped, label, members, sub, v, _i, _len;
      deduped = [];
      members = {};
      for (_i = 0, _len = subs.length; _i < _len; _i++) {
        sub = subs[_i];
        assoc = (function () {
          var _j, _len1, _results;
          _results = [];
          for (v = _j = 0, _len1 = sub.length; _j < _len1; v = ++_j) {
            let k = sub[v];
            _results.push([k, v]);
          }
          return _results;
        })();
        assoc.sort();
        label = (function () {
          var _j, _len1, _results;
          _results = [];
          for (v = _j = 0, _len1 = assoc.length; _j < _len1; v = ++_j) {
            let k = assoc[v];
            _results.push(k + ',' + v);
          }
          return _results;
        })().join('-');
        if (!(label in members)) {
          members[label] = true;
          deduped.push(sub);
        }
      }
      return deduped;
    };
    helper = function (keys) {
      var dup_l33t_index, first_key, i, l33t_chr, next_subs, rest_keys, sub, sub_alternative, sub_extension, _i, _j, _k, _len, _len1, _ref, _ref1;
      if (!keys.length) {
        return;
      }
      first_key = keys[0];
      rest_keys = keys.slice(1);
      next_subs = [];
      _ref = table[first_key];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        l33t_chr = _ref[_i];
        for (_j = 0, _len1 = subs.length; _j < _len1; _j++) {
          sub = subs[_j];
          dup_l33t_index = -1;
          for (i = _k = 0, _ref1 = sub.length; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
            if (sub[i][0] === l33t_chr) {
              dup_l33t_index = i;
              break;
            }
          }
          if (dup_l33t_index === -1) {
            sub_extension = sub.concat([[l33t_chr, first_key]]);
            next_subs.push(sub_extension);
          } else {
            sub_alternative = sub.slice(0);
            sub_alternative.splice(dup_l33t_index, 1);
            sub_alternative.push([l33t_chr, first_key]);
            next_subs.push(sub);
            next_subs.push(sub_alternative);
          }
        }
      }
      subs = dedup(next_subs);
      return helper(rest_keys);
    };
    helper(keys);
    sub_dicts = [];
    for (_i = 0, _len = subs.length; _i < _len; _i++) {
      sub = subs[_i];
      sub_dict = {};
      for (_j = 0, _len1 = sub.length; _j < _len1; _j++) {
        _ref = sub[_j];
        l33t_chr = _ref[0];
        chr = _ref[1];
        sub_dict[l33t_chr] = chr;
      }
      sub_dicts.push(sub_dict);
    }
    return sub_dicts;
  },
  l33tMatch: function (password, _rankedDictionaries, _l33tTable) {
    // Find all instances of l33t substitutions in the password.

    var chr, k, match, match_sub, sub, subbed_chr, subbed_password, token, v, _i, _j, _len, _len1, _ref1;
    if (_rankedDictionaries == null) {
      _rankedDictionaries = RANKED_DICTIONARIES;
    }
    if (_l33tTable == null) {
      _l33tTable = L33T_TABLE;
    }
    let matches = [];
    let ref = this.enumeratel33tSubs(this.relevantl33tSubtable(password, _l33tTable));
    for (const sub of ref) {
      if (this.empty(sub)) {
        break;
      }
      subbed_password = this.translate(password, sub);
      _ref1 = this.dictionaryMatch(subbed_password, _rankedDictionaries);
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        match = _ref1[_j];
        token = password.slice(match.i, +match.j + 1 || 9e9);
        if (token.toLowerCase() === match.matched_word) {
          continue;
        }
        match_sub = {};
        for (subbed_chr in sub) {
          chr = sub[subbed_chr];
          if (token.indexOf(subbed_chr) !== -1) {
            match_sub[subbed_chr] = chr;
          }
        }
        match.l33t = true;
        match.token = token;
        match.sub = match_sub;
        match.sub_display = (function () {
          var _results;
          _results = [];
          for (k in match_sub) {
            v = match_sub[k];
            _results.push(k + ' -> ' + v);
          }
          return _results;
        })().join(', ');
        matches.push(match);
      }
    }
    return this.sorted(
      matches.filter(function (match) {
        return match.token.length > 1;
      })
    );
  },
  spatialMatch: function (password, _graphs) {
    // Find all instances of spatial patterns (like "i i") in the password.
    // Used to see if the password is created by using characters that are close to each other on the keyboard.
    // also counts the number of times directions changes

    var graph, graph_name, matches;
    if (_graphs == null) {
      _graphs = GRAPHS;
    }
    matches = [];
    for (graph_name in _graphs) {
      graph = _graphs[graph_name];
      this.extend(matches, this.spatialMatchHelper(password, graph, graph_name));
    }
    return this.sorted(matches);
  },
  SHIFTED_RX: /[~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:"ZXCVBNM<>?]/,
  spatialMatchHelper: function (password, graph, graph_name) {
    var adj, adjacents, cur_char, cur_direction, found, found_direction, i, j, last_direction, matches, prev_char, shifted_count, turns, _i, _len;
    matches = [];
    i = 0;
    while (i < password.length - 1) {
      j = i + 1;
      last_direction = null;
      turns = 0;
      if ((graph_name === 'qwerty' || graph_name === 'dvorak') && this.SHIFTED_RX.exec(password.charAt(i))) {
        shifted_count = 1;
      } else {
        shifted_count = 0;
      }
      while (true) {
        prev_char = password.charAt(j - 1);
        found = false;
        found_direction = -1;
        cur_direction = -1;
        adjacents = graph[prev_char] || [];
        if (j < password.length) {
          cur_char = password.charAt(j);
          for (_i = 0, _len = adjacents.length; _i < _len; _i++) {
            adj = adjacents[_i];
            cur_direction += 1;
            if (adj && adj.indexOf(cur_char) !== -1) {
              found = true;
              found_direction = cur_direction;
              if (adj.indexOf(cur_char) === 1) {
                shifted_count += 1;
              }
              if (last_direction !== found_direction) {
                turns += 1;
                last_direction = found_direction;
              }
              break;
            }
          }
        }
        if (found) {
          j += 1;
        } else {
          if (j - i > 2) {
            matches.push({
              pattern: 'spatial',
              i: i,
              j: j - 1,
              token: password.slice(i, j),
              graph: graph_name,
              turns: turns,
              shifted_count: shifted_count,
            });
          }
          i = j;
          break;
        }
      }
    }
    return matches;
  },
  repeatMatch: function (password) {
    // Find repeated sequences of characters in the password.

    var base_analysis,
      base_guesses,
      base_matches,
      base_token,
      greedy,
      greedy_match,
      i,
      j,
      lastIndex,
      lazy,
      lazy_anchored,
      lazy_match,
      match,
      matches,
      _ref;
    matches = [];
    greedy = /(.+)\1+/g;
    lazy = /(.+?)\1+/g;
    lazy_anchored = /^(.+?)\1+$/;
    lastIndex = 0;
    while (lastIndex < password.length) {
      greedy.lastIndex = lazy.lastIndex = lastIndex;
      greedy_match = greedy.exec(password);
      lazy_match = lazy.exec(password);
      if (greedy_match == null) {
        break;
      }
      if (greedy_match[0].length > lazy_match[0].length) {
        match = greedy_match;
        base_token = lazy_anchored.exec(match[0])[1];
      } else {
        match = lazy_match;
        base_token = match[1];
      }
      _ref = [match.index, match.index + match[0].length - 1];
      i = _ref[0];
      j = _ref[1];
      base_analysis = scoring.most_guessable_match_sequence(base_token, this.omnimatch(base_token));
      base_matches = base_analysis.sequence;
      base_guesses = base_analysis.guesses;
      matches.push({
        pattern: 'repeat',
        i: i,
        j: j,
        token: match[0],
        base_token: base_token,
        base_guesses: base_guesses,
        base_matches: base_matches,
        repeat_count: match[0].length / base_token.length,
      });
      lastIndex = j + 1;
    }
    return matches;
  },
  MAX_DELTA: 5,
  sequenceMatch: function (password) {
    // Find sequences of characters in the password.

    var delta, i, j, k, last_delta, result, update, _i, _ref;
    if (password.length === 1) {
      return [];
    }
    update = (function (_this) {
      return function (i, j, delta) {
        var sequence_name, sequence_space, token, _ref;
        if (j - i > 1 || Math.abs(delta) === 1) {
          if (0 < (_ref = Math.abs(delta)) && _ref <= _this.MAX_DELTA) {
            token = password.slice(i, +j + 1 || 9e9);
            if (/^[a-z]+$/.test(token)) {
              sequence_name = 'lower';
              sequence_space = 26;
            } else if (/^[A-Z]+$/.test(token)) {
              sequence_name = 'upper';
              sequence_space = 26;
            } else if (/^\d+$/.test(token)) {
              sequence_name = 'digits';
              sequence_space = 10;
            } else {
              sequence_name = 'unicode';
              sequence_space = 26;
            }
            return result.push({
              pattern: 'sequence',
              i: i,
              j: j,
              token: password.slice(i, +j + 1 || 9e9),
              sequence_name: sequence_name,
              sequence_space: sequence_space,
              ascending: delta > 0,
            });
          }
        }
      };
    })(this);
    result = [];
    i = 0;
    last_delta = null;
    for (k = _i = 1, _ref = password.length; 1 <= _ref ? _i < _ref : _i > _ref; k = 1 <= _ref ? ++_i : --_i) {
      delta = password.charCodeAt(k) - password.charCodeAt(k - 1);
      if (last_delta == null) {
        last_delta = delta;
      }
      if (delta === last_delta) {
        continue;
      }
      j = k - 1;
      update(i, j, last_delta);
      i = j;
      last_delta = delta;
    }
    update(i, password.length - 1, last_delta);
    return result;
  },
  regexMatch: function (password, _regexen) {
    // Find matches for regular expressions in the password.
    // in this case, we are using it to look for recent dates

    var matches, regex, rx_match, token;
    if (_regexen == null) {
      _regexen = REGEXEN;
    }
    matches = [];
    for (const name in _regexen) {
      regex = _regexen[name];
      regex.lastIndex = 0;
      while ((rx_match = regex.exec(password))) {
        token = rx_match[0];
        matches.push({
          pattern: 'regex',
          token: token,
          i: rx_match.index,
          j: rx_match.index + rx_match[0].length - 1,
          regex_name: name,
          regex_match: rx_match,
        });
      }
    }
    return this.sorted(matches);
  },
  dateMatch: function (password) {
    // Find matches for dates in the password.

    var candidate,
      candidates,
      distance,
      dmy,
      i,
      j,
      k,
      l,
      _i,
      _j,
      _k,
      _l,
      _len,
      _len1,
      _m,
      _n,
      _ref,
      _ref1,
      _ref2,
      _ref3,
      _ref4,
      _ref5,
      _ref6,
      _ref7,
      _ref8,
      _ref9;
    let matches = [];
    let maybe_date_no_separator = /^\d{4,8}$/;
    let maybe_date_with_separator = /^(\d{1,4})([\s\/\\_.-])(\d{1,2})\2(\d{1,4})$/;
    for (i = _i = 0, _ref = password.length - 4; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      for (j = _j = _ref1 = i + 3, _ref2 = i + 7; _ref1 <= _ref2 ? _j <= _ref2 : _j >= _ref2; j = _ref1 <= _ref2 ? ++_j : --_j) {
        if (j >= password.length) {
          break;
        }
        var token = password.slice(i, +j + 1 || 9e9);
        if (!maybe_date_no_separator.exec(token)) {
          continue;
        }
        candidates = [];
        _ref3 = DATE_SPLITS[token.length];
        for (_k = 0, _len = _ref3.length; _k < _len; _k++) {
          _ref4 = _ref3[_k];
          k = _ref4[0];
          l = _ref4[1];
          dmy = this.map_ints_to_dmy([parseInt(token.slice(0, k)), parseInt(token.slice(k, l)), parseInt(token.slice(l))]);
          if (dmy != null) {
            candidates.push(dmy);
          }
        }
        if (candidates.length <= 0) {
          continue;
        }
        let best_candidate = candidates[0];
        let metric = function (candidate) {
          return Math.abs(candidate.year - scoring.REFERENCE_YEAR);
        };
        let min_distance = metric(candidates[0]);
        _ref5 = candidates.slice(1);
        for (_l = 0, _len1 = _ref5.length; _l < _len1; _l++) {
          candidate = _ref5[_l];
          distance = metric(candidate);
          if (distance < min_distance) {
            _ref6 = [candidate, distance];
            best_candidate = _ref6[0];
            min_distance = _ref6[1];
          }
        }
        matches.push({
          pattern: 'date',
          token: token,
          i: i,
          j: j,
          separator: '',
          year: best_candidate.year,
          month: best_candidate.month,
          day: best_candidate.day,
        });
      }
    }
    for (i = _m = 0, _ref7 = password.length - 6; 0 <= _ref7 ? _m <= _ref7 : _m >= _ref7; i = 0 <= _ref7 ? ++_m : --_m) {
      for (j = _n = _ref8 = i + 5, _ref9 = i + 9; _ref8 <= _ref9 ? _n <= _ref9 : _n >= _ref9; j = _ref8 <= _ref9 ? ++_n : --_n) {
        if (j >= password.length) {
          break;
        }
        token = password.slice(i, +j + 1 || 9e9);
        let rx_match = maybe_date_with_separator.exec(token);
        if (rx_match == null) {
          continue;
        }
        dmy = this.map_ints_to_dmy([parseInt(rx_match[1]), parseInt(rx_match[3]), parseInt(rx_match[4])]);
        if (dmy == null) {
          continue;
        }
        matches.push({
          pattern: 'date',
          token: token,
          i: i,
          j: j,
          separator: rx_match[2],
          year: dmy.year,
          month: dmy.month,
          day: dmy.day,
        });
      }
    }
    return this.sorted(
      matches.filter(function (match) {
        var is_submatch, other_match, _len2, _o;
        is_submatch = false;
        for (_o = 0, _len2 = matches.length; _o < _len2; _o++) {
          other_match = matches[_o];
          if (match === other_match) {
            continue;
          }
          if (other_match.i <= match.i && other_match.j >= match.j) {
            is_submatch = true;
            break;
          }
        }
        return !is_submatch;
      })
    );
  },
  map_ints_to_dmy: function (ints) {
    var dm, int, over_12, over_31, possible_year_splits, rest, under_1, y, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    if (ints[1] > 31 || ints[1] <= 0) {
      return;
    }
    over_12 = 0;
    over_31 = 0;
    under_1 = 0;
    for (_i = 0, _len = ints.length; _i < _len; _i++) {
      int = ints[_i];
      if ((99 < int && int < 1000) || int > 2050) {
        return;
      }
      if (int > 31) {
        over_31 += 1;
      }
      if (int > 12) {
        over_12 += 1;
      }
      if (int <= 0) {
        under_1 += 1;
      }
    }
    if (over_31 >= 2 || over_12 === 3 || under_1 >= 2) {
      return;
    }
    possible_year_splits = [
      [ints[2], ints.slice(0, 2)],
      [ints[0], ints.slice(1, 3)],
    ];
    for (_j = 0, _len1 = possible_year_splits.length; _j < _len1; _j++) {
      _ref = possible_year_splits[_j];
      y = _ref[0];
      rest = _ref[1];
      if (1000 <= y && y <= 2050) {
        dm = this.map_ints_to_dm(rest);
        if (dm != null) {
          return {
            year: y,
            month: dm.month,
            day: dm.day,
          };
        } else {
          return;
        }
      }
    }
    for (_k = 0, _len2 = possible_year_splits.length; _k < _len2; _k++) {
      _ref1 = possible_year_splits[_k];
      y = _ref1[0];
      rest = _ref1[1];
      dm = this.map_ints_to_dm(rest);
      if (dm != null) {
        y = this.two_to_four_digit_year(y);
        return {
          year: y,
          month: dm.month,
          day: dm.day,
        };
      }
    }
  },
  map_ints_to_dm: function (ints) {
    var d, m, _i, _len, _ref, _ref1;
    _ref = [ints, ints.slice().reverse()];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      _ref1 = _ref[_i];
      d = _ref1[0];
      m = _ref1[1];
      if (1 <= d && d <= 31 && 1 <= m && m <= 12) {
        return {
          day: d,
          month: m,
        };
      }
    }
  },
  two_to_four_digit_year: function (year) {
    if (year > 99) {
      return year;
    } else if (year > 50) {
      return year + 1900;
    } else {
      return year + 2000;
    }
  },
};

module.exports = matching;
