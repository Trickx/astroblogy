---
title: Contact
layout: default
permalink: /contact/
---

<nav class="category-links blog-top-links" aria-label="Blog navigation links">
  <div class="category-link-list">
    <a class="button" href="{{ '/blog/' | relative_url }}">Blog Home</a>
    <a class="button" href="{{ '/galerie/' | relative_url }}">Gallery</a>
  </div>
  <div class="category-action-links">
    <a class="button" href="{{ '/pixinsight-workflow/' | relative_url }}">PI Workflow</a>
    <a class="button" href="{{ '/filter-compare/' | relative_url }}">Filter Comparator</a>
    <a class="button contact-link" href="{{ '/contact/' | relative_url }}">Contact</a>
  </div>
</nav>

<section class="section-intro">
  <p class="eyebrow">Contact</p>
  <h1>Write me an email</h1>
  <p class="section-copy">Fill in the fields and click Send email to open your mail app with a prefilled message.</p>

  <form id="contact-mail-form" class="contact-form">
    <label for="contact-subject">Subject</label>
    <input id="contact-subject" name="subject" type="text" required>

    <label for="contact-body">Message</label>
    <textarea id="contact-body" name="body" rows="8" required></textarea>

    <button type="submit" class="button">Send email</button>
  </form>
</section>

## Impressum

<div id="impressum-content"></div>
<noscript>Bitte JavaScript aktivieren, um das Impressum anzuzeigen.</noscript>

<script>
  (function () {
    var form = document.getElementById('contact-mail-form');
    if (!form) return;

    function decode(codes) {
      return codes.map(function (code) {
        return String.fromCharCode(code);
      }).join('');
    }

    // Basic obfuscation: address is assembled at runtime.
    var mailboxUser = decode([116, 114, 105, 99, 107, 120, 45, 97, 115, 116, 114, 111]);
    var mailboxDomain = decode([119, 101, 98, 46, 100, 101]);
    var recipient = mailboxUser + '@' + mailboxDomain;

    var impressumTarget = document.getElementById('impressum-content');
    if (impressumTarget) {
      var impressumLines = [
        decode([83, 118, 101, 110, 32, 75, 111, 112, 101, 116, 122, 107, 105]),
        decode([80, 108, 97, 110, 101, 116, 101, 110, 115, 116, 114, 97, 223, 101, 32, 56, 53]),
        decode([51, 49, 50, 55, 53, 32, 76, 101, 104, 114, 116, 101]),
        decode([68, 101, 117, 116, 115, 99, 104, 108, 97, 110, 100]),
        '',
        decode([69, 45, 77, 97, 105, 108, 58]) + ' ' + recipient
      ];

      impressumTarget.textContent = impressumLines.join('\n');
      impressumTarget.style.whiteSpace = 'pre-line';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var subject = form.subject.value || '';
      var body = form.body.value || '';

      var mailto = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.location.href = mailto;
    });
  })();
</script>