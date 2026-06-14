// Redirect the Home (repo) button to the parent path so it works both
// locally (http://127.0.0.1:4000/pixinsight-workflow/) and on production
// (https://tricx.de/pixinsight-workflow/) without an absolute URL.
document.addEventListener('DOMContentLoaded', function () {
  var source = document.querySelector('a.md-source');
  if (!source) return;
  var loc = window.location;
  var base = loc.protocol + '//' + loc.host + '/';
  source.setAttribute('href', base);
});
