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

  // Brand mark inspired by the platform logo.
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
  const labelWidth = options.labelWidth || 52;
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

const drawBulletList = (pdf, y, items) => {
  const width = pdf.internal.pageSize.getWidth();
  const left = 14;
  const contentWidth = width - 28;
  items.forEach((item) => {
    y = ensurePage(pdf, y, 14);
    const lines = toLines(pdf, `• ${item}`, contentWidth - 6);
    const height = Math.max(9, lines.length * 4.7 + 3);
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

const drawFooter = (pdf, { caseNumber }) => {
  const width = pdf.internal.pageSize.getWidth();
  const pageCount = pdf.getNumberOfPages();
  const now = new Date();

  for (let i = 1; i <= pageCount; i += 1) {
    pdf.setPage(i);
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setDrawColor(216, 227, 240);
    pdf.setLineWidth(0.4);
    pdf.line(14, pageHeight - 16, width - 14, pageHeight - 16);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(91, 107, 122);
    pdf.text(`Generated ${now.toLocaleString()}`, 14, pageHeight - 10);
    pdf.text(`Case ${String(caseNumber || '—')}`, width / 2, pageHeight - 10, { align: 'center' });
    pdf.text(`Page ${i} of ${pageCount}`, width - 14, pageHeight - 10, { align: 'right' });
  }
};

export const buildProofOfServicePdf = ({ pdf, caseData, claimants = [], respondents = [], counsel = [], user }) => {
  const c = caseData || {};
  const caseNumber = c.CASE_ID || c.caseId || 'Unknown case';
  const caseTitle = c.TITLE || c.title || 'Untitled case';
  const seat = c.SEAT_OF_ARBITRATION || c.seatOfArbitration || '—';
  const governingLaw = c.GOVERNING_LAW || c.governingLaw || '—';
  const language = c.LANGUAGE_OF_PROCEEDINGS || c.languageOfProceedings || '—';
  const caseRef = c.INSTITUTION_REF || c.institutionRef || '—';
  const docCode = `AP-PS-${String(caseNumber).replace(/[^a-z0-9]+/gi, '-').toUpperCase().slice(0, 18)}`;
  const claimantsList = claimants.map((p) => p.FULL_NAME || p.fullName).filter(Boolean);
  const respondentsList = respondents.map((p) => p.FULL_NAME || p.fullName).filter(Boolean);
  const counselList = counsel.map((p) => p.FULL_NAME || p.fullName).filter(Boolean);
  const recipients = [...claimantsList, ...respondentsList, ...counselList];

  pdf.setProperties({
    title: 'Proof of Service',
    subject: 'Platform branded service template',
    author: 'Arbitration Platform',
    creator: 'Arbitration Platform',
    keywords: 'arbitration, service, proof of service, proof, NCIA',
  });

  drawHeader(pdf, {
    title: 'Proof of Service',
    subtitle: 'Platform standard document template for arbitration service and filing',
    documentCode: docCode,
    caseNumber,
  });

  let y = 62;
  y = drawSectionHeader(pdf, y, 'Case Details');
  y = drawField(pdf, y, 'Case ID', caseNumber);
  y = drawField(pdf, y, 'Case Title', caseTitle);
  y = drawField(pdf, y, 'Seat of Arbitration', seat);
  y = drawField(pdf, y, 'Language of Proceedings', titleize(language));
  y = drawField(pdf, y, 'Governing Law', governingLaw);
  y = drawField(pdf, y, 'Institution Reference', caseRef);

  y = ensurePage(pdf, y, 40);
  y = drawSectionHeader(pdf, y, 'Documents Served');
  y = drawBulletList(pdf, y, [
    'Request for Arbitration',
    'Arbitration clause / contract',
    'Supporting exhibits and documents',
    'Signed proof of service certificate',
  ]);

  y = ensurePage(pdf, y, 40);
  y = drawSectionHeader(pdf, y, 'Recipients');
  if (recipients.length === 0) {
    y = drawField(pdf, y, 'Recipients', 'Registered parties on the case file');
  } else {
    recipients.forEach((name, index) => {
      y = drawField(pdf, y, index === 0 ? 'Recipients' : '', name, { labelWidth: 52 });
    });
  }

  y = ensurePage(pdf, y, 42);
  y = drawSectionHeader(pdf, y, 'Declaration');
  y = drawField(
    pdf,
    y,
    'Statement',
    'I certify that the listed documents were generated for service and that the signed copy will be uploaded back to the case file, emailed to the relevant parties, and stored in the document library as the official service record.'
  );

  y = ensurePage(pdf, y, 38);
  y = drawSectionHeader(pdf, y, 'Signature');
  y = drawField(pdf, y, 'Signer', user?.firstName || user?.fullName || user?.email || 'Registrar');
  y = drawField(pdf, y, 'Role', titleize(user?.role || 'registrar'));
  y = drawField(pdf, y, 'Date', new Date().toLocaleDateString());
  y = drawField(pdf, y, 'Generated', new Date().toISOString());

  y = ensurePage(pdf, y, 28);
  pdf.setFillColor(246, 249, 253);
  pdf.setDrawColor(216, 227, 240);
  pdf.roundedRect(14, y, pdf.internal.pageSize.getWidth() - 28, 16, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(11, 61, 102);
  pdf.text('This document is a platform-generated template. After signing, it should be uploaded back to the case and retained with the document record.', 17, y + 6.5, {
    maxWidth: pdf.internal.pageSize.getWidth() - 34,
  });

  drawFooter(pdf, { caseNumber });
  return pdf;
};

const resolveText = (value, context = {}) => {
  const raw = typeof value === 'function' ? value(context) : value;
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ');
  return String(raw || '—');
};

const drawParagraph = (pdf, y, text, options = {}) => {
  const width = pdf.internal.pageSize.getWidth();
  const left = 14;
  const contentWidth = width - 28;
  const lines = toLines(pdf, text, contentWidth - 6);
  const height = Math.max(10, lines.length * 4.8 + 4);

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(216, 227, 240);
  pdf.roundedRect(left, y, contentWidth, height, 2, 2, 'FD');
  pdf.setFont('helvetica', options.bold ? 'bold' : 'normal');
  pdf.setFontSize(options.size || 9);
  pdf.setTextColor(31, 41, 55);
  pdf.text(lines, left + 3, y + 6, { maxWidth: contentWidth - 6 });
  return y + height + 4;
};

const drawSimpleTable = (pdf, y, headers, rows) => {
  const width = pdf.internal.pageSize.getWidth();
  const left = 14;
  const contentWidth = width - 28;
  const columnCount = headers.length;
  const colWidth = contentWidth / columnCount;

  const headerHeight = 11;
  pdf.setFillColor(246, 249, 253);
  pdf.setDrawColor(216, 227, 240);
  pdf.rect(left, y, contentWidth, headerHeight, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(31, 41, 55);
  headers.forEach((header, index) => {
    pdf.text(String(header), left + index * colWidth + 2, y + 7);
  });
  y += headerHeight;

  rows.forEach((row) => {
    const values = Array.isArray(row) ? row : headers.map((header) => row?.[header] ?? row?.[titleize(header)] ?? row?.[header.toLowerCase().replace(/\s+/g, '_')] ?? '');
    const rowHeight = Math.max(11, ...values.map((value) => toLines(pdf, value, colWidth - 4).length * 4.2 + 4));
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(31, 41, 55);
    pdf.setDrawColor(216, 227, 240);
    pdf.rect(left, y, contentWidth, rowHeight);
    values.forEach((value, index) => {
      const cellX = left + index * colWidth;
      if (index > 0) {
        pdf.line(cellX, y, cellX, y + rowHeight);
      }
      const lines = toLines(pdf, value, colWidth - 4);
      pdf.text(lines, cellX + 2, y + 5, { maxWidth: colWidth - 4 });
    });
    y += rowHeight;
  });

  return y + 4;
};

const renderTemplate = ({ pdf, code, title, subtitle, caseNumber, sections, footerNote, user }) => {
  drawHeader(pdf, {
    title,
    subtitle,
    documentCode: code,
    caseNumber,
  });

  let y = 62;
  sections.forEach((section) => {
    y = ensurePage(pdf, y, 34);
    y = drawSectionHeader(pdf, y, section.title);

    section.fields?.forEach((field) => {
      y = ensurePage(pdf, y, 16);
      y = drawField(pdf, y, field.label, resolveText(field.value, { user, caseNumber }), field.options || {});
    });

    section.paragraphs?.forEach((paragraph) => {
      y = ensurePage(pdf, y, 26);
      y = drawParagraph(pdf, y, resolveText(paragraph.text, { user, caseNumber }), paragraph.options || {});
    });

    section.bullets?.forEach((bullets) => {
      y = ensurePage(pdf, y, 24);
      y = drawBulletList(pdf, y, bullets.items.map((item) => resolveText(item, { user, caseNumber })));
    });

    section.table && section.table.headers && section.table.rows && (y = drawSimpleTable(
      pdf,
      ensurePage(pdf, y, 36),
      section.table.headers,
      section.table.rows.map((row) => row.map((cell) => resolveText(cell, { user, caseNumber })))
    ));
  });

  if (footerNote) {
    y = ensurePage(pdf, y, 24);
    pdf.setFillColor(246, 249, 253);
    pdf.setDrawColor(216, 227, 240);
    pdf.roundedRect(14, y, pdf.internal.pageSize.getWidth() - 28, 16, 2, 2, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(11, 61, 102);
    pdf.text(footerNote, 17, y + 6.5, {
      maxWidth: pdf.internal.pageSize.getWidth() - 34,
    });
  }

  drawFooter(pdf, { caseNumber });
  return pdf;
};

export const buildRequestForArbitrationPdf = ({ pdf, caseData = {}, user }) => {
  const c = caseData || {};
  const caseNumber = c.CASE_ID || c.caseId || 'RA-UNASSIGNED';
  const sections = [
    {
      title: 'Party Details',
      fields: [
        { label: 'Claimant', value: c.CLAIMANT_NAME || c.claimantName || c.FULL_NAME || '' },
        { label: 'Respondent', value: c.RESPONDENT_NAME || c.respondentName || '' },
        { label: 'Contact Details', value: c.CONTACT_DETAILS || c.contactDetails || '' },
        { label: 'Nature of Business', value: c.NATURE_OF_BUSINESS || c.natureOfBusiness || '' },
      ],
    },
    {
      title: 'Contract and Arbitration Clause',
      paragraphs: [
        { text: c.ARBITRATION_AGREEMENT_SUMMARY || c.arbitrationAgreementSummary || 'Attach the contract or separate arbitration agreement and note the clause relied on.' },
      ],
      bullets: [{ items: [
        'Contract or arbitration agreement attached',
        'Arbitration clause identified',
        'Supporting exhibits included',
      ] }],
    },
    {
      title: 'Dispute Summary',
      fields: [
        { label: 'Nature of Dispute', value: c.DESCRIPTION || c.description || '' },
        { label: 'Relief Sought', value: c.RELIEF_SOUGHT || c.reliefSought || '' },
        { label: 'Seat of Arbitration', value: c.SEAT_OF_ARBITRATION || c.seatOfArbitration || '' },
        { label: 'Language of Proceedings', value: c.LANGUAGE_OF_PROCEEDINGS || c.languageOfProceedings || '' },
      ],
    },
    {
      title: 'Nomination and Service',
      fields: [
        { label: 'Nominated Arbitrator', value: c.ARBITRATOR_NOMINEE || c.arbitratorNominee || '' },
        { label: 'Nominee Qualifications', value: c.NOMINEE_QUALIFICATIONS || c.nomineeQualifications || '' },
        { label: 'Service Method', value: c.SERVICE_METHOD || c.serviceMethod || 'Email / portal / other documented service' },
      ],
      paragraphs: [
        { text: 'Confirm that copies of the request and supporting documents have been served on all parties and that the proof of service has been uploaded to the case record.' },
      ],
    },
    {
      title: 'Fee and Filing Notes',
      bullets: [{ items: [
        'Include proof of filing fee payment',
        'Prepare the required number of physical copies for filing if needed',
        'Submit to the Registrar once the file is complete',
      ] }],
    },
  ];

  return renderTemplate({
    pdf,
    code: `AP-RAF-${String(caseNumber).replace(/[^a-z0-9]+/gi, '-').toUpperCase().slice(0, 18)}`,
    title: 'Request for Arbitration',
    subtitle: 'NCIA-style branded filing template generated by the platform',
    caseNumber,
    sections,
    footerNote: 'This Request for Arbitration template should be reviewed before filing and completed with the required supporting documents.',
    user,
  });
};

export const buildArbitratorPanelApplicationPdf = ({ pdf, applicant = {}, user }) => {
  const name = applicant.NAME || applicant.name || 'Applicant';
  const sections = [
    {
      title: 'Applicant Details',
      fields: [
        { label: 'Name', value: name },
        { label: 'Nationality', value: applicant.NATIONALITY || applicant.nationality || '' },
        { label: 'Firm / Organisation', value: applicant.FIRM || applicant.firm || '' },
        { label: 'Contact', value: applicant.CONTACT || applicant.contact || applicant.EMAIL || applicant.email || '' },
        { label: 'Primary Occupation', value: applicant.PRIMARY_OCCUPATION || applicant.primaryOccupation || '' },
      ],
    },
    {
      title: 'Education and Training',
      bullets: [{ items: asList(applicant.EDUCATION || applicant.education || 'Degree(s), arbitration training, and other dispute-resolution training should be attached.') }],
    },
    {
      title: 'Arbitration Experience',
      table: {
        headers: ['Role', 'Commercial', 'Construction', 'Investor/State', 'Other'],
        rows: [
          ['Sole Arbitrator', applicant.SOLE_ARBITRATOR_COMMERCIAL || '', applicant.SOLE_ARBITRATOR_CONSTRUCTION || '', applicant.SOLE_ARBITRATOR_INVESTOR_STATE || '', applicant.SOLE_ARBITRATOR_OTHER || ''],
          ['Member / Panel', applicant.PANEL_MEMBER_COMMERCIAL || '', applicant.PANEL_MEMBER_CONSTRUCTION || '', applicant.PANEL_MEMBER_INVESTOR_STATE || '', applicant.PANEL_MEMBER_OTHER || ''],
          ['Counsel / Agent', applicant.COUNSEL_COMMERCIAL || '', applicant.COUNSEL_CONSTRUCTION || '', applicant.COUNSEL_INVESTOR_STATE || '', applicant.COUNSEL_OTHER || ''],
        ],
      },
    },
    {
      title: 'Other Information',
      paragraphs: [
        { text: applicant.OTHER_INFO || applicant.otherInfo || 'Include any additional experience, publications, and preferred practice areas.' },
      ],
    },
    {
      title: 'Declaration',
      paragraphs: [
        { text: 'The applicant declares that the information provided is complete and accurate and agrees to abide by the applicable NCIA panel standards and code of conduct.' },
      ],
    },
  ];

  return renderTemplate({
    pdf,
    code: `AP-ARB-${String(name).replace(/[^a-z0-9]+/gi, '-').toUpperCase().slice(0, 18)}`,
    title: 'Arbitrator Panel Status Application',
    subtitle: 'NCIA-style branded panel application template generated by the platform',
    caseNumber: applicant.APPLICATION_ID || 'Panel application',
    sections,
    footerNote: 'Attach the required supporting documents before submission to the Centre.',
    user,
  });
};

export const buildTribunalSecretaryDeclarationPdf = ({ pdf, secretary = {}, user }) => {
  const name = secretary.NAME || secretary.name || 'Tribunal Secretary';
  const sections = [
    {
      title: 'Secretary Details',
      fields: [
        { label: 'Name', value: name },
        { label: 'Contact', value: secretary.CONTACT || secretary.contact || secretary.EMAIL || secretary.email || '' },
        { label: 'Proposed Matter', value: secretary.MATTER || secretary.matter || '' },
      ],
    },
    {
      title: 'Declaration',
      paragraphs: [
        { text: 'I confirm my availability to assist the tribunal, my impartiality and independence, and that I have disclosed any circumstance that may give rise to justifiable doubts.' },
      ],
    },
    {
      title: 'Signature',
      fields: [
        { label: 'Signed By', value: name },
        { label: 'Date', value: new Date().toLocaleDateString() },
      ],
    },
  ];

  return renderTemplate({
    pdf,
    code: `AP-TSD-${String(name).replace(/[^a-z0-9]+/gi, '-').toUpperCase().slice(0, 18)}`,
    title: 'Tribunal Secretary Declaration',
    subtitle: 'Branded declaration template based on the NCIA tribunal secretary guidance',
    caseNumber: secretary.MATTER || 'Tribunal Secretary',
    sections,
    footerNote: 'Attach the proposed secretary CV and any required disclosures before use.',
    user,
  });
};

export const buildTribunalSecretaryUndertakingPdf = ({ pdf, secretary = {}, user }) => {
  const name = secretary.NAME || secretary.name || 'Tribunal Secretary';
  const sections = [
    {
      title: 'Undertaking',
      paragraphs: [
        { text: 'I undertake to abide by the requirements of the NCIA Arbitration Rules, the applicable tribunal secretary guidelines, and any other terms required by the institution.' },
      ],
    },
    {
      title: 'Secretary Details',
      fields: [
        { label: 'Name', value: name },
        { label: 'Contact', value: secretary.CONTACT || secretary.contact || secretary.EMAIL || secretary.email || '' },
        { label: 'Proposed Matter', value: secretary.MATTER || secretary.matter || '' },
      ],
    },
    {
      title: 'Signature',
      fields: [
        { label: 'Signed By', value: name },
        { label: 'Date', value: new Date().toLocaleDateString() },
      ],
    },
  ];

  return renderTemplate({
    pdf,
    code: `AP-TSU-${String(name).replace(/[^a-z0-9]+/gi, '-').toUpperCase().slice(0, 18)}`,
    title: 'Tribunal Secretary Undertaking',
    subtitle: 'Branded undertaking template based on the NCIA tribunal secretary guidance',
    caseNumber: secretary.MATTER || 'Tribunal Secretary',
    sections,
    footerNote: 'Attach the declaration and any required supporting documents before use.',
    user,
  });
};

export const NCIA_FORM_LIBRARY = {
  proof_of_service: {
    label: 'Proof of Service',
    build: buildProofOfServicePdf,
  },
  request_for_arbitration: {
    label: 'Request for Arbitration',
    build: buildRequestForArbitrationPdf,
  },
  arbitrator_panel_status_application: {
    label: 'Arbitrator Panel Status Application',
    build: buildArbitratorPanelApplicationPdf,
  },
  tribunal_secretary_declaration: {
    label: 'Tribunal Secretary Declaration',
    build: buildTribunalSecretaryDeclarationPdf,
  },
  tribunal_secretary_undertaking: {
    label: 'Tribunal Secretary Undertaking',
    build: buildTribunalSecretaryUndertakingPdf,
  },
};
