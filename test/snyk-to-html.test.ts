import { exec } from 'child_process';
import path = require('path');
import {test} from 'tap';
import { SnykToHtml } from '../src/lib/snyk-to-html';

const summaryOnly = true;
const noSummary = false;
const remediation = true;
const noRemediation = false;
const main = '.'.replace(/\//g, path.sep);

test('test calling snyk-to-html from command line', (t) => {
  t.plan(1);
  exec(`node ${main} -i ./test/fixtures/multi-test-report.json -o ./results.html`, (err, stdout) => {
    if (err) {
      throw err;
    }
    t.match(stdout.trim(), 'Vulnerability snapshot saved at ./results.html', 'should confirm it has run');
  });
});

test('test snyk-to-html handles -s argument correctly', (t) => {
  t.plan(2);
  exec(`node ${main} -i ./test/fixtures/test-report-with-remediation.json -s`, (err, stdout) => {
    if (err) {
      throw err;
    }
    const regex = /<p class="timestamp">.*<\/p>/g;
    const cleanTimestamp = rep => rep.replace(regex, '<p class="timestamp">TIMESTAMP</p>');
    const cleanedReport = cleanTimestamp(stdout);
    t.doesNotHave(cleanedReport, '<h2 id="overview">Overview</h2>', 'does not contain overview of the vulnerability');
    t.matchSnapshot(cleanedReport, 'should be expected snapshot containing summary template');
  });
});

test('test snyk-to-html handles -a argument correctly', (t) => {
  t.plan(2);
  exec(`node ${main} -i ./test/fixtures/test-report-with-remediation.json -a`, (err, stdout) => {
    if (err) {
      throw err;
    }
    const regex = /<p class="timestamp">.*<\/p>/g;
    const cleanTimestamp = rep => rep.replace(regex, '<p class="timestamp">TIMESTAMP</p>');
    const cleanedReport = cleanTimestamp(stdout);
    t.contains(cleanedReport, '<body class="remediation-section-projects">', 'should contain remediation section');
    t.matchSnapshot(cleanedReport, 'should be expected snapshot containing actionable remediations');
  });
});

test('all-around test', (t) => {
  t.plan(5);
  SnykToHtml.run(
    path.join(__dirname, 'fixtures', 'test-report.json'),
    noRemediation,
    path.join(__dirname, '..', 'template', 'test-report.hbs'),
      noSummary,
     (report) => {
      t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (ReDoS)<\/h2>', 'should contain Regular Expression Denial of Service (ReDoS) vulnerability');
      t.contains(report, '<h2 class="card__title">Cross-site Scripting (XSS)</h2>', 'should contain Cross-site Scripting (XSS) vulnerability');
      t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (DoS)</h2>', 'should contain Regular Expression Denial of Service (DoS) vulnerability');
      t.contains(report, '<h2 id="overview">Overview</h2>', 'should contain overview of the vulnerability');
      t.contains(report, '<h2 id="details">Details</h2>', 'should contain description of the vulnerability');
    });
});

test('multi-report test', (t) => {
  t.plan(7);
  SnykToHtml.run(
    path.join(__dirname, 'fixtures', 'multi-test-report.json'),
    noRemediation,
    path.join(__dirname, '..', 'template', 'test-report.hbs'),
      noSummary,
     (report) => {
      t.contains(report, '<div class="meta-count"><span>139 vulnerable dependency paths</span></div>', 'should contain number of vulnerable dependency paths');
      t.contains(report, '<h2 class="card__title">Access Restriction Bypass</h2>', 'should contain Access Restriction Bypass vulnerability');
      t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (ReDoS)<\/h2>', 'should contain Regular Expression Denial of Service (ReDoS) vulnerability');
      t.contains(report, '<h2 class="card__title">Cross-site Scripting (XSS)</h2>', 'should contain Cross-site Scripting (XSS) vulnerability');
      t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (DoS)</h2>', 'should contain Regular Expression Denial of Service (DoS) vulnerability');
      t.contains(report, '<h2 id="overview">Overview</h2>', 'should contain overview of the vulnerability');
      t.contains(report, '<h2 id="details">Details</h2>', 'should contain description of the vulnerability');
    });
});

test('multi-report test with summary only', (t) => {
  t.plan(7);
  SnykToHtml.run(
      path.join(__dirname, 'fixtures', 'multi-test-report.json'),
      noRemediation,
      path.join(__dirname, '..', 'template', 'test-report.hbs'),
      summaryOnly,
      (report) => {
        t.contains(report, '<div class="meta-count"><span>139 vulnerable dependency paths</span></div>', 'should contain number of vulnerable dependency paths');
        t.contains(report, '<h2 class="card__title">Access Restriction Bypass</h2>', 'should contain Access Restriction Bypass vulnerability');
        t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (ReDoS)<\/h2>', 'should contain Regular Expression Denial of Service (ReDoS) vulnerability');
        t.contains(report, '<h2 class="card__title">Cross-site Scripting (XSS)</h2>', 'should contain Cross-site Scripting (XSS) vulnerability');
        t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (DoS)</h2>', 'should contain Regular Expression Denial of Service (DoS) vulnerability');
        t.doesNotHave(report, '<h2 id="overview">Overview</h2>', 'does not contain overview of the vulnerability');
        t.doesNotHave(report, '<h2 id="details">Details</h2>', 'does not contain details of the vulnerability');
      });
});

test('test with remediations arg and data containing remediations object', (t) => {
  t.plan(4);
  SnykToHtml.run(
      path.join(__dirname, 'fixtures', 'test-report-with-remediation.json'),
      remediation,
      path.join(__dirname, '..', 'template', 'remediation-report.hbs'),
      summaryOnly,
      (report) => {
        // can see actionable remediation
        t.contains(report, '<body class="remediation-section-projects">', 'should contain remediation section');
        t.contains(report, '.remediation-card', 'should contain remediation partial');
        t.contains(report, '.remediation-card__layout-container', 'should contain remediation tabs');
        t.contains(report, '.remediation-card__pane', 'should contain individual remediations');
      });
});

test('test with remediations arg but no remediations in json', (t) => {
  t.plan(1);
  SnykToHtml.run(
      path.join(__dirname, 'fixtures', 'multi-test-report.json'),
      remediation,
      path.join(__dirname, '..', 'template', 'remediation-report.hbs'),
      summaryOnly,
      (report) => {
        // no actionable remediations displayed
        t.contains(report, '<h2>No remediation path available</h2>', 'should contain remediation partial with message');
      });
});

test('all-around test with summary only', (t) => {
  t.plan(5);
  SnykToHtml.run(
      path.join(__dirname, 'fixtures', 'test-report.json'),
      noRemediation,
      path.join(__dirname, '..', 'template', 'test-report.hbs'),
      summaryOnly,
      (report) => {
        t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (ReDoS)<\/h2>', 'should contain Regular Expression Denial of Service (ReDoS) vulnerability');
        t.contains(report, '<h2 class="card__title">Cross-site Scripting (XSS)</h2>', 'should contain Cross-site Scripting (XSS) vulnerability');
        t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (DoS)</h2>', 'should contain Regular Expression Denial of Service (DoS) vulnerability');
        t.doesNotHave(report, '<h2 id="overview">Overview</h2>', 'does not contain overview of the vulnerability');
        t.doesNotHave(report, '<h2 id="details">Details</h2>', 'does not contain details of the vulnerability');
      });
});

test('all-around test with summary only with no remediation but having one fixedIn', (t) => {
  t.plan(4);
  SnykToHtml.run(
      path.join(__dirname, 'fixtures', 'test-report-with-no-remediation-with-one-fixed-in.json'),
      noRemediation,
      path.join(__dirname, '..', 'template', 'test-report.hbs'),
      summaryOnly,
      (report) => {
        t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (ReDoS)<\/h2>', 'should contain Regular Expression Denial of Service (ReDoS) vulnerability');
        t.contains(report, 'Fixed in: 2.9.10', 'should say: Fixed in: 2.9.10');
        t.doesNotHave(report, '<h2 id="overview">Overview</h2>', 'does not contain overview of the vulnerability');
        t.doesNotHave(report, '<h2 id="details">Details</h2>', 'does not contain details of the vulnerability');
      });
});

test('all-around test with summary only with no remediation but having multiple fixedIn', (t) => {
  t.plan(4);
  SnykToHtml.run(
      path.join(__dirname, 'fixtures', 'test-report-with-no-remediation-with-multiple-fixed-in.json'),
      noRemediation,
      path.join(__dirname, '..', 'template', 'test-report.hbs'),
      summaryOnly,
      (report) => {
        t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (ReDoS)<\/h2>', 'should contain Regular Expression Denial of Service (ReDoS) vulnerability');
        t.contains(report, 'Fixed in: 2.9.10, 4.5.6', 'should say: Fixed in: 2.9.10, 4.5.6');
        t.doesNotHave(report, '<h2 id="overview">Overview</h2>', 'does not contain overview of the vulnerability');
        t.doesNotHave(report, '<h2 id="details">Details</h2>', 'does not contain details of the vulnerability');
      });
});

test('all-around test with summary only with no remediation and no fixedIns', (t) => {
  t.plan(4);
  SnykToHtml.run(
      path.join(__dirname, 'fixtures', 'test-report-with-no-remediation-and-no-fixed-in.json'),
      noRemediation,
      path.join(__dirname, '..', 'template', 'test-report.hbs'),
      summaryOnly,
      (report) => {
        t.contains(report, '<h2 class="card__title">Regular Expression Denial of Service (ReDoS)<\/h2>', 'should contain Regular Expression Denial of Service (ReDoS) vulnerability');
        t.contains(report, 'There is no remediation at the moment', 'should say There is no remediation at the moment');
        t.doesNotHave(report, '<h2 id="overview">Overview</h2>', 'does not contain overview of the vulnerability');
        t.doesNotHave(report, '<h2 id="details">Details</h2>', 'does not contain details of the vulnerability');
      });
});

test('empty values test (description and info)', (t) => {
  t.plan(1);
  SnykToHtml.run(
      path.join(__dirname, 'fixtures', 'test-report-empty-descr.json'),
      noRemediation,
      path.join(__dirname, '..', 'template', 'test-report.hbs'),
      noSummary,
      (report) => {
        t.contains(report, '<p>No description available.</p>', 'should contain "No description available"');
      });
});

test('should not generate report for invalid json', (t) => {
  t.plan(0);
  SnykToHtml.run(
      path.join(__dirname, 'fixtures', 'invalid-input.json'),
      noRemediation,
      path.join(__dirname, '..', 'template', 'test-report.hbs'),
      noSummary,
      (report) => {
        t.match(report, '', 'report object is empty');
      });
});

test('template output displays vulns in descending order of severity ', (t) => {
  SnykToHtml.run(
    path.join(__dirname, 'fixtures', 'multi-test-report.json'),
    noRemediation,
    path.join(__dirname, '..', 'template', 'test-report.hbs'),
      summaryOnly,
      (report) => {
        const regex = /<p class="timestamp">.*<\/p>/g;
        const cleanTimestamp = rep => rep.replace(regex, '<p class="timestamp">TIMESTAMP</p>');
        const cleanedReport = cleanTimestamp(report);
        // compares against snapshot in tap-snapshots/test-snyk-to-html.test.ts-TAP.test.js
        // to re-generate snapshots: tap test.js --snapshot
        t.matchSnapshot(cleanedReport, 'should be expected snapshot');
        t.end();
      });
});
