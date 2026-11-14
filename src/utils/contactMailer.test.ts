import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveRecipientEmail,
  formatInquiryEmailSubject,
  formatInquiryEmailBody,
  buildGmailComposeUrl,
  buildMailtoUrl,
} from './contactMailer';

test('resolveRecipientEmail defaults and upgrades legacy email to aviz.arts@gmail.com', () => {
  assert.equal(resolveRecipientEmail(undefined), 'aviz.arts@gmail.com');
  assert.equal(resolveRecipientEmail(''), 'aviz.arts@gmail.com');
  assert.equal(resolveRecipientEmail('avinashr5904@gmail.com'), 'aviz.arts@gmail.com');
  assert.equal(resolveRecipientEmail('AVINASHR5904@GMAIL.COM'), 'aviz.arts@gmail.com');
  assert.equal(resolveRecipientEmail('custom@studio.dev'), 'custom@studio.dev');
});

test('formatInquiryEmailSubject and formatInquiryEmailBody format clean message payloads', () => {
  const subject = formatInquiryEmailSubject({
    name: 'Elena Vance',
    projectType: 'Game Design & Core Mechanics (Loops & Pacing)',
  });
  assert.equal(subject, '[Portfolio Inquiry] Game Design & Core Mechanics (Loops & Pacing) — Elena Vance');

  const body = formatInquiryEmailBody({
    recipientEmail: 'aviz.arts@gmail.com',
    name: 'Elena Vance',
    email: 'elena@vertex.games',
    projectType: 'Level Design',
    studio: 'Vertex Games',
    message: 'Looking to collaborate on our Q3 combat blockout.',
  });
  assert.ok(body.includes('Name: Elena Vance'));
  assert.ok(body.includes('Reply Email: elena@vertex.games'));
  assert.ok(body.includes('Studio / Company: Vertex Games'));
  assert.ok(body.includes('Looking to collaborate on our Q3 combat blockout.'));
});

test('buildGmailComposeUrl and buildMailtoUrl encode target recipient and inquiry details', () => {
  const payload = {
    recipientEmail: 'avinashr5904@gmail.com',
    name: 'Marcus',
    email: 'marcus@indie.io',
    projectType: 'Lighting Consultation',
    message: 'Need UE5 Lumen pass feedback.',
  };

  const gmailUrl = buildGmailComposeUrl(payload);
  assert.ok(gmailUrl.startsWith('https://mail.google.com/mail/?view=cm&fs=1'));
  assert.ok(gmailUrl.includes('to=aviz.arts%40gmail.com'));
  assert.ok(gmailUrl.includes('su=%5BPortfolio%20Inquiry%5D'));

  const mailtoUrl = buildMailtoUrl(payload);
  assert.ok(mailtoUrl.startsWith('mailto:aviz.arts%40gmail.com?subject='));
  assert.ok(mailtoUrl.includes('Need%20UE5%20Lumen%20pass%20feedback.'));
});
