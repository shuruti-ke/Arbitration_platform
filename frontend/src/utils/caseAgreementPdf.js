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

const drawPanel = (pdf, x, y, width, height, style = 'FD') => {
  const values = [x, y, width, height].map((value) => Number(value));
  if (values.some((value) => !Number.isFinite(value))) {
    return;
  }

  try {
    pdf.roundedRect(values[0], values[1], values[2], values[3], 2, 2, style);
  } catch (error) {
    pdf.rect(values[0], values[1], values[2], values[3], style);
  }
};

const drawHeader = (pdf, { title, subtitle, documentCode, caseNumber }) => {
  const width = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(21, 101, 192);
  pdf.rect(0, 0, width, 29, 'F');

  pdf.setFillColor(255, 255, 255);
  drawPanel(pdf, 14, 7, 15, 15, 'F');
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
    drawPanel(pdf, width - 68, 7, 54, 15, 'F');
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
  drawPanel(pdf, width - 69, 41, 55, 18, 'FD');
  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(8);
  pdf.text('CASE', width - 61, 48);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(String(caseNumber || '—').slice(0, 32), width - 61, 54);
};

const drawSectionHeader = (pdf, y, title) => {
  const width = pdf.internal.pageSize.getWidth();
  const safeY = Number.isFinite(Number(y)) ? Number(y) : 18;
  pdf.setFillColor(246, 249, 253);
  pdf.setDrawColor(216, 227, 240);
  drawPanel(pdf, 14, safeY, width - 28, 10, 'FD');
  pdf.setFillColor(245, 124, 0);
  pdf.rect(14, safeY, 3, 10, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(31, 41, 55);
  pdf.text(title, 20, safeY + 6.7);
  return safeY + 14;
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
  drawPanel(pdf, left, y, contentWidth, height, 'FD');
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
  drawPanel(pdf, left, y, contentWidth, height, 'FD');
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
    drawPanel(pdf, left, y, contentWidth, height, 'FD');
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
  const draft = c.agreementDraft || {};
  const caseNumber = c.caseId || c.CASE_ID || 'AGREEMENT-DRAFT';
  const caseTitle = c.title || c.TITLE || 'Arbitration Agreement';
  const firstParty = c.claimantName || c.CLAIMANT_NAME || 'First Party';
  const secondParty = c.respondentName || c.RESPONDENT_NAME || 'Second Party';
  const firstPartyOrg = c.claimantOrg || c.CLAIMANT_ORG || '';
  const secondPartyOrg = c.respondentOrg || c.RESPONDENT_ORG || '';
  const arbitrator = c.arbitratorNominee || c.ARBITRATOR_NOMINEE || 'Arbitrator';
  const seat = c.seatOfArbitration || c.SEAT_OF_ARBITRATION || '________';
  const language = c.languageOfProceedings || c.LANGUAGE_OF_PROCEEDINGS || 'English';
  const governingLaw = c.governingLaw || c.GOVERNING_LAW || 'Arbitration Act, Cap. 49';
  const rules = c.arbitrationRules || c.ARBITRATION_RULES || 'NCIA Rules';
  const date = draft.effectiveDate || c.agreementDate || new Date().toLocaleDateString();
  const documentCode = `AP-AGR-${String(caseNumber).replace(/[^a-z0-9]+/gi, '-').toUpperCase().slice(0, 18)}`;

  const sectionText = (key, fallback) => String(draft[key] || fallback || '').trim();

  pdf.setProperties({
    title: 'Arbitration Agreement',
    subject: 'Filled arbitration agreement drafted by the arbitrator',
    author: 'Arbitration Platform',
    creator: 'Arbitration Platform',
    keywords: 'arbitration, agreement, arbitrator, parties, drafted agreement',
  });

  drawHeader(pdf, {
    title: 'Arbitration Agreement',
    subtitle: 'Filled agreement drafted from the arbitrator-led discussions with the parties',
    documentCode,
    caseNumber,
  });

  let y = 62;
  y = drawSectionHeader(pdf, y, 'Agreement Overview');
  y = drawField(pdf, y, 'Agreement Title', caseTitle);
  y = drawField(pdf, y, 'Effective Date', date);
  y = drawField(pdf, y, 'Seat of Arbitration', seat);
  y = drawField(pdf, y, 'Language of Proceedings', titleize(language));
  y = drawField(pdf, y, 'Governing Law', governingLaw);
  y = drawField(pdf, y, 'Arbitration Rules', rules);
  y = drawField(pdf, y, 'First Party', firstPartyOrg || firstParty);
  y = drawField(pdf, y, 'Second Party', secondPartyOrg || secondParty);
  y = drawField(pdf, y, 'Arbitrator', arbitrator);

  const sections = [
    ['1. Preamble / Introduction', sectionText('preamble', `This Arbitration Agreement is entered into between ${firstParty} and ${secondParty} for the resolution of disputes by arbitration.`)],
    ['2. Definitions and Interpretation', sectionText('definitions', 'Terms used in this agreement have the meanings given to them by the parties, the tribunal, and the applicable arbitration rules.')],
    ['3. Scope of Arbitration', sectionText('scope', 'This agreement covers the dispute(s) identified by the parties and any connected claims, counterclaims, or procedural matters the arbitrator accepts.')],
    ['4. Governing Rules', sectionText('governingRulesText', `The arbitration shall be conducted under ${rules} and any procedural directions issued by the arbitrator.`)],
    ['5. Arbitration Tribunal Details', sectionText('tribunalDetails', `The tribunal shall consist of ${c.numArbitrators || 1} arbitrator(s), chaired or led by ${arbitrator}, with any qualifications and appointment details agreed by the parties.`)],
    ['6. Arbitration Procedure', sectionText('procedure', 'The procedure will follow a fair, efficient process agreed by the parties and supervised by the arbitrator, including timelines for filings, replies, and directions.')],
    ['7. Evidence and Hearings', sectionText('evidenceHearings', `Evidence will be exchanged in advance where possible. Hearings will be held at ${seat} or virtually if required, and witnesses may be heard according to the arbitrator's directions.`)],
    ['8. Powers of the Arbitrator', sectionText('powers', 'The arbitrator may issue directions, control the timetable, determine admissibility, manage the hearing, and take any other procedural steps permitted by the arbitration rules.')],
    ['9. Confidentiality', sectionText('confidentiality', 'The parties and the tribunal will keep confidential all non-public information, subject to any legal obligation to disclose or enforce an award.')],
    ['10. Awards', sectionText('awards', 'The arbitrator will issue a written, reasoned award unless the parties agree otherwise, and the award will be communicated to the parties in writing.')],
    ['11. Costs', sectionText('costs', 'Costs, fees, and expenses will be allocated in the final award or as otherwise agreed by the parties and directed by the arbitrator.')],
    ['12. Enforcement', sectionText('enforcement', 'The parties agree that the award may be enforced in any court of competent jurisdiction or otherwise as permitted by law.')],
    ['13. Miscellaneous Provisions', sectionText('miscellaneous', 'This agreement includes standard provisions on notices, amendments, severability, waiver, binding effect, and annexes or schedules as needed.')],
  ];

  sections.forEach(([title, text]) => {
    y = ensurePage(pdf, y, 42);
    y = drawSectionHeader(pdf, y, title);
    y = drawParagraph(pdf, y, text);
  });

  y = ensurePage(pdf, y, 72);
  y = drawSectionHeader(pdf, y, '14. Signatures');

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
  if (secondPartyOrg) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(91, 107, 122);
    pdf.text('Org', left + blockWidth + blockGap + 6, y + 27);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(31, 41, 55);
    pdf.text(secondPartyOrg, left + blockWidth + blockGap + 46, y + 27);
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(91, 107, 122);
    pdf.text('Date', left + blockWidth + blockGap + 6, y + 27);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(31, 41, 55);
    pdf.text(date, left + blockWidth + blockGap + 46, y + 27);
  }
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
  drawPanel(pdf, 14, pdf.internal.pageSize.getHeight() - 28, width - 28, 14, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(11, 61, 102);
  pdf.text('This agreement is generated from the arbitrator-filled draft and can be downloaded, emailed, or finalized for signing.', 17, pdf.internal.pageSize.getHeight() - 19, {
    maxWidth: width - 34,
  });

  return pdf;
};
