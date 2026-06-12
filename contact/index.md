---
title: Contact
layout: default
permalink: /contact/
---

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

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var subject = form.subject.value || '';
      var body = form.body.value || '';

      var mailto = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.location.href = mailto;
    });
  })();
</script>