const BRAND = {
  primary: '#1565C0',
  primaryDark: '#0B3D66',
  accent: '#F57C00',
  border: '#D8E3F0',
  text: '#1F2937',
  muted: '#5B6B7A',
  soft: '#F6F9FD',
};

const toLines = (pdf, text, width) => pdf.splitTextToSize(String(text || ''), width);

const titleize = (value) => String(value || '')
  .trim()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/\b\w/g, (ch) => ch.toUpperCase());

const asList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const ensurePage = (pdf, y, minHeight = 18) => {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + minHeight > pageHeight - 18) {
    pdf.addPage();
    return 18;
  }
  return y;
};

const drawHeader = (pdf, { title, subtitle, documentCode, caseNumber }) => {
  const width = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(21, 101, 192);
  pdf.rect(0, 0, width, 29, 'F');

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(14, 7, 15, 15, 2.5, 2.5, 'F');
  pdf.setFillColor(21, 101, 192);
  pdf.circle(21.5, 14.5, 4.3, 'F');
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.9);
  pdf.line(21.5, 14.5, 28, 8.3);

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('ARBITRATION PLATFORM', 34, 15);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Legal workflow and dispute management', 34, 21);

  if (documentCode) {
    pdf.setFillColor(245, 124, 0);
    pdf.roundedRect(width - 68, 7, 54, 15, 4, 4, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text(documentCode, width - 41, 16.5, { align: 'center' });
  }

  pdf.setTextColor(31, 41, 55);
  pdf.setFillColor(246, 249, 253);
  pdf.rect(0, 29, width, 8, 'F');
  pdf.setDrawColor(245, 124, 0);
  pdf.setLineWidth(1.3);
  pdf.line(0, 37, width, 37);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.text(title, 14, 48);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(91, 107, 122);
  pdf.text(subtitle, 14, 54);

  pdf.setFillColor(246, 249, 253);
  pdf.setDrawColor(216, 227, 240);
  pdf.roundedRect(width - 69, 41, 55, 18, 3, 3, 'FD');
  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(8);
  pdf.text('CASE', width - 61, 48);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(String(caseNumber || '—').slice(0, 32), width - 61, 54);
};

const drawSectionHeader = (pdf, y, title) => {
  const width = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(246, 249, 253);
  pdf.setDrawColor(216, 227, 240);
  pdf.roundedRect(14, y, width - 28, 10, 2.5, 2.5, 'FD');
  pdf.setFillColor(245, 124, 0);
  pdf.rect(14, y, 3, 10, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(31, 41, 55);
  pdf.text(title, 20, y + 6.7);
  return y + 14;
};

const drawField = (pdf, y, label, value, options = {}) => {
  const width = pdf.internal.pageSize.getWidth();
  const left = 14;
  const contentWidth = width - 28;
  const labelWidth = options.labelWidth || 58;
  const valueX = left + labelWidth + 4;
  const valueWidth = contentWidth - labelWidth - 4;
  const lines = toLines(pdf, value || '—', valueWidth);
  const height = Math.max(10, lines.length * 4.8 + 4);

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(216, 227, 240);
  pdf.roundedRect(left, y, contentWidth, height, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(91, 107, 122);
  pdf.text(label, left + 3, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(31, 41, 55);
  pdf.text(lines, valueX, y + 6, { maxWidth: valueWidth });
  return y + height + 4;
};

const drawParagraph = (pdf, y, text) => {
  const width = pdf.internal.pageSize.getWidth();
  const left = 14;
  const contentWidth = width - 28;
  const lines = toLines(pdf, text, contentWidth - 6);
  const height = Math.max(12, lines.length * 4.8 + 4);

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(216, 227, 240);
  pdf.roundedRect(left, y, contentWidth, height, 2, 2, 'FD');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(31, 41, 55);
  pdf.text(lines, left + 3, y + 6, { maxWidth: contentWidth - 6 });
  return y + height + 4;
};

const drawBulletList = (pdf, y, items) => {
  const width = pdf.internal.pageSize.getWidth();
  const left = 14;
  const contentWidth = width - 28;
  (items || []).forEach((item) => {
    y = ensurePage(pdf, y, 14);
    const lines = toLines(pdf, `- ${item}`, contentWidth - 6);
    const height = Math.max(10, lines.length * 4.7 + 3);
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(216, 227, 240);
    pdf.roundedRect(left, y, contentWidth, height, 2, 2, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55);
    pdf.text(lines, left + 3, y + 5.8, { maxWidth: contentWidth - 6 });
    y += height + 3;
  });
  return y;
};

const drawSignatureBlock = (pdf, y, title, fields) => {
  const width = pdf.internal.pageSize.getWidth();
  const left = 14;
  const blockWidth = (width - 34) / 2;
  const height = 60;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(33, 37, 41);
  pdf.rect(left, y, blockWidth, height);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(title, left + 6, y + 8);

  let fieldY = y + 16;
  (fields || []).forEach((field) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(91, 107, 122);
    pdf.text(field.label, left + 6, fieldY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(31, 41, 55);
    pdf.text(String(field.value || '—'), left + 40, fieldY);
    fieldY += 11;
  });

  pdf.setDrawColor(31, 41, 55);
  pdf.line(left + 6, y + 42, left + blockWidth - 6, y + 42);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.text('(Place for signature)', left + 6, y + 48);
};

export const buildCaseAgreementPdf = ({ pdf, caseData = {}, user } = {}) => {
  const c = caseData || {};
  const caseNumber = c.caseId || c.CASE_ID || 'AGREEMENT-DRAFT';
  const caseTitle = c.title || c.TITLE || 'Arbitration Agreement';
  const firstParty = c.claimantName || c.CLAIMANT_NAME || 'First Party';
  const secondParty = c.respondentName || c.RESPONDENT_NAME || 'Second Party';
  const arbitrator = c.arbitratorNominee || c.ARBITRATOR_NOMINEE || 'Arbitrator';
  const seat = c.seatOfArbitration || c.SEAT_OF_ARBITRATION || '________';
  const language = c.languageOfProceedings || c.LANGUAGE_OF_PROCEEDINGS || 'English';
  const governingLaw = c.governingLaw || c.GOVERNING_LAW || 'Arbitration Act, Cap. 49';
  const rules = c.arbitrationRules || c.ARBITRATION_RULES || 'NCIA Rules';
  const date = c.agreementDate || new Date().toLocaleDateString();
  const documentCode = `AP-AGR-${String(caseNumber).replace(/[^a-z0-9]+/gi, '-').toUpperCase().slice(0, 18)}`;

  pdf.setProperties({
    title: 'Arbitration Agreement',
    subject: 'Platform branded agreement template',
    author: 'Arbitration Platform',
    creator: 'Arbitration Platform',
    keywords: 'arbitration, agreement, template, NCIA, arbitrator, parties',
  });

  drawHeader(pdf, {
    title: 'Arbitration Agreement',
    subtitle: 'Template agreement for parties and the arbitrator to sign before case setup',
    documentCode,
    caseNumber,
  });

  let y = 62;
  y = drawSectionHeader(pdf, y, 'Agreement Details');
  y = drawField(pdf, y, 'Agreement Title', caseTitle);
  y = drawField(pdf, y, 'Effective Date', date);
  y = drawField(pdf, y, 'Seat of Arbitration', seat);
  y = drawField(pdf, y, 'Language of Proceedings', titleize(language));
  y = drawField(pdf, y, 'Governing Law', governingLaw);
  y = drawField(pdf, y, 'Arbitration Rules', rules);

  y = ensurePage(pdf, y, 40);
  y = drawSectionHeader(pdf, y, 'Parties');
  y = drawField(pdf, y, 'First Party', c.claimantOrg || c.CLAIMANT_ORG || firstParty);
  y = drawField(pdf, y, 'Second Party', c.respondentOrg || c.RESPONDENT_ORG || secondParty);
  y = drawField(pdf, y, 'Arbitrator', arbitrator);

  y = ensurePage(pdf, y, 40);
  y = drawSectionHeader(pdf, y, 'Subject of the Agreement');
  y = drawParagraph(pdf, y, c.subject || c.SUBJECT || 'This agreement sets the framework for arbitration of disputes, claims, or controversies arising from or related to the contract or relationship between the parties.');
  y = drawParagraph(pdf, y, 'The parties agree that the arbitrator will manage the proceedings fairly, the hearing will take place in the agreed seat or virtually if necessary, and the award will be final and binding unless the agreement or applicable law provides otherwise.');

  y = ensurePage(pdf, y, 40);
  y = drawSectionHeader(pdf, y, 'Prehearing Conference');
  y = drawParagraph(pdf, y, 'Before the arbitration begins, the parties and the arbitrator should hold a prehearing conference to confirm the schedule, procedure, disclosure, witnesses, language, and any confidentiality measures.');
  y = drawBulletList(pdf, y, [
    'Scheduling of hearing',
    'Procedural matters and document exchange',
    'Witnesses and experts',
    'Language and translation',
    'Confidentiality and protective measures',
  ]);

  y = ensurePage(pdf, y, 40);
  y = drawSectionHeader(pdf, y, 'Arbitration Costs and Fees');
  y = drawBulletList(pdf, y, [
    'Filing fees and administrative fees',
    'Arbitrator fees and expenses',
    'Legal fees and expenses of each party',
    'Other agreed costs and expenses',
  ]);

  y = ensurePage(pdf, y, 40);
  y = drawSectionHeader(pdf, y, 'The Hearing and Decision');
  y = drawParagraph(pdf, y, 'The hearing will take place as specified in this agreement. After the hearing, the arbitrator will render a written decision based on the evidence, the applicable law, and the arbitration rules.');
  y = drawParagraph(pdf, y, 'The decision will be communicated to the parties in writing and kept with the case record.');

  y = ensurePage(pdf, y, 40);
  y = drawSectionHeader(pdf, y, 'Notice and Governing Law');
  y = drawParagraph(pdf, y, 'Any notice or communication under this agreement may be delivered personally, by certified mail, or by email to the addresses the parties provide. Each party may update its notice address in writing.');
  y = drawParagraph(pdf, y, `This agreement is governed by the laws of ${governingLaw}. Any dispute about this agreement will be resolved in the agreed seat or by the competent court if required.`);

  y = ensurePage(pdf, y, 40);
  y = drawSectionHeader(pdf, y, 'Other Clauses');
  y = drawBulletList(pdf, [
    'Severability',
    'Entire agreement',
    'Waiver',
    'Amendments',
    'Binding effect',
    'Annexes and schedules',
  ]);

  y = ensurePage(pdf, y, 44);
  y = drawSectionHeader(pdf, y, 'Agreement Note');
  y = drawParagraph(pdf, y, 'This template may be used to prepare an agreement for signing by the parties and the arbitrator before the case is opened in the platform. A signed copy should be uploaded to the case record once complete.');
  y = drawParagraph(pdf, y, 'The platform will treat the uploaded signed agreement as the starting point for case setup and data extraction.');

  y = ensurePage(pdf, y, 72);
  y = drawSectionHeader(pdf, y, 'Signatures');
  const left = 14;
  const blockGap = 6;
  const width = pdf.internal.pageSize.getWidth();
  const blockWidth = (width - 34 - blockGap) / 2;

  drawSignatureBlock(pdf, y, 'First Party', [
    { label: 'Name', value: firstParty },
    { label: 'Date', value: date },
  ]);
  pdf.setPage(pdf.getCurrentPageInfo().pageNumber);
  pdf.setDrawColor(33, 37, 41);
  pdf.rect(left + blockWidth + blockGap, y, blockWidth, 60);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Second Party', left + blockWidth + blockGap + 6, y + 8);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(91, 107, 122);
  pdf.text('Name', left + blockWidth + blockGap + 6, y + 16);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(31, 41, 55);
  pdf.text(secondParty, left + blockWidth + blockGap + 46, y + 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(91, 107, 122);
  pdf.text('Date', left + blockWidth + blockGap + 6, y + 27);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(31, 41, 55);
  pdf.text(date, left + blockWidth + blockGap + 46, y + 27);
  pdf.setDrawColor(31, 41, 55);
  pdf.line(left + blockWidth + blockGap + 6, y + 42, left + blockWidth + blockGap + blockWidth - 6, y + 42);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.text('(Place for signature)', left + blockWidth + blockGap + 6, y + 48);

  y += 68;
  y = ensurePage(pdf, y, 70);
  pdf.setDrawColor(33, 37, 41);
  pdf.rect(left, y, width - 28, 60);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Arbitrator', left + 6, y + 8);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(91, 107, 122);
  pdf.text('Name', left + 6, y + 16);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(31, 41, 55);
  pdf.text(arbitrator, left + 46, y + 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(91, 107, 122);
  pdf.text('Date', left + 6, y + 27);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(31, 41, 55);
  pdf.text(date, left + 46, y + 27);
  pdf.setDrawColor(31, 41, 55);
  pdf.line(left + 6, y + 42, left + width - 34, y + 42);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.text('(Place for signature)', left + 6, y + 48);

  pdf.setFillColor(246, 249, 253);
  pdf.setDrawColor(216, 227, 240);
  pdf.roundedRect(14, pdf.internal.pageSize.getHeight() - 28, width - 28, 14, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(11, 61, 102);
  pdf.text('This template should be reviewed, signed, and uploaded back to the platform before the case is created.', 17, pdf.internal.pageSize.getHeight() - 19, {
    maxWidth: width - 34,
  });

  return pdf;
};
