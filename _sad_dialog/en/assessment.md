---
title: "Assessment"
menu: "Assessment"
order: 80
shot: [SAD_Assessment_Script.png, SAD_Assessment_AI.png]
handbook: [assessment, ai]
---
The verdicts of the last Calculate, topic by topic, with suggested corrections in the order in which to work through them, and the optional AI review: a second opinion by Claude on the measured values and the assessment.

While the Assessment tab is selected, the left side of the dialog shows the two assessments as tabs instead of the preview: **Script assessment** and **AI review**.
The Assessment tab on the right holds the settings of the AI review.

## Left side: the assessments

### Script assessment
{: .display}

Filled by Calculate.
It begins with the suggested order of corrections, followed by one entry per topic (data, mount, focus, tracking, tilt, spacing, coma, field curvature ...) with its verdict - **[OK]**, **[Note]** or **[Action]** - and, where something is to be done, a suggestion after an arrow.
The settings of Setup › General - optics type, mount and guiding - shape the suggestions.

### AI review
{: .display}

Claude\'s answer.
Before the first request it says what the button does; **Ask Claude** and **Continue** switch to this tab while the answer is awaited.

## AI review (Claude)

### API key
{: #aiKeyEdit .text}

Your Anthropic API key (console.anthropic.com).
The environment variable ANTHROPIC\_API\_KEY takes precedence when it is set.

A key entered here is stored unencrypted in PixInsight\'s settings, but never in a process icon.
Clear the field to remove it.

### Answer language
{: #aiLanguageEdit .text}

The language of the AI review, e.g. English or Deutsch.

### Explanation
{: #aiDetailCombo .list}

- Short (for experienced users)
- Step by step (for beginners)

**Step by step**: for up to 6 findings that need attention, the measured values and what they mean, what the stars look like, the derivation of the cause, at most two other causes, what to do and how to check it - each in at most two sentences, terms explained briefly (about 700 words).

**Short**: up to 5 findings, at most 25 words per field (about 300 words) - faster and cheaper.

### Attach the maps
{: #aiSendMapCheck .checkbox}

Sends the maps Star size, Star shape and Coma with their current layers as images (at most 1092 px each), so that Claude can see the patterns as well as the numbers.
Without it, only the measured values and the assessment are sent.

### Save requests and answers
{: #aiSaveLogCheck .checkbox}

Saves every request and its answer as a text file StarAberrationAI\_*date*\_*time*.txt: a header with the date and the analyzed files, the request as sent (the maps only as placeholders) and the answer, readable and as JSON.
Failed requests are saved with the error.

The file goes next to the series frames, else next to the target image, else to the temporary directory.
The API key is never written.

### Ask Claude
{: #aiButton .button}

Sends the measured values of the kept analysis (Calculate), the script assessment and optionally the three maps, and the comparison of the Series tab if there is one, to Claude (claude-opus-5-5, Anthropic API) and shows its review on the AI review tab left: which explanation fits all values, where the rules are too strict or too lenient, and what to do in which order.
Either a Calculate or a series is enough.

Needs an API key and an internet connection; each request is billed to the key (typically a few cents) and can take a minute.
No image data other than the attached maps leaves the computer.

### Continue
{: #aiContinueButton .button}

Only when Claude\'s answer was cut off at the token limit: asks Claude for the rest of the answer and shows the joined answer.
Billed like a new request (the request and the answer so far are sent again).
