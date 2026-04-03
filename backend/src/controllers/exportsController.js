const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const supabase = require('../db/supabaseClient');

const isoDate = () => new Date().toISOString().slice(0, 10);

const exportCollaborateursXlsx = async (req, res) => {
  const { data, error } = await supabase
    .from('collaborateurs')
    .select('*')
    .order('nom');

  if (error) return res.status(500).json({ error: error.message });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Dashboard RH';
  wb.created = new Date();

  const ws = wb.addWorksheet('Collaborateurs');
  ws.columns = [
    { header: 'Nom', key: 'nom', width: 18 },
    { header: 'Prénom', key: 'prenom', width: 18 },
    { header: 'Poste', key: 'poste', width: 22 },
    { header: 'Service', key: 'service', width: 18 },
    { header: 'Contrat', key: 'contrat', width: 14 },
    { header: 'Date embauche', key: 'date_embauche', width: 14 },
    { header: 'Statut', key: 'status', width: 12 },
    { header: 'Salaire', key: 'salaire', width: 12 },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle' };

  (data || []).forEach((c) => {
    ws.addRow({
      nom: c.nom ?? '',
      prenom: c.prenom ?? '',
      poste: c.poste ?? '',
      service: c.service ?? '',
      contrat: c.contrat ?? '',
      date_embauche: c.date_embauche ? String(c.date_embauche).slice(0, 10) : '',
      status: c.status ?? '',
      salaire: c.salaire ?? '',
    });
  });

  const filename = `collaborateurs_${isoDate()}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await wb.xlsx.write(res);
  res.end();
};

const exportCollaborateursPdf = async (req, res) => {
  const { data, error } = await supabase
    .from('collaborateurs')
    .select('*')
    .order('nom');

  if (error) return res.status(500).json({ error: error.message });

  const filename = `collaborateurs_${isoDate()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text('Liste des collaborateurs', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#6b7280').text(`Généré le ${new Date().toLocaleString('fr-FR')}`);
  doc.moveDown(1);
  doc.fillColor('#111827');

  const headers = ['Nom', 'Prénom', 'Poste', 'Service', 'Contrat', 'Statut'];
  const colWidths = [90, 90, 110, 80, 60, 60];

  const drawRow = (values, isHeader = false) => {
    const y = doc.y;
    let x = doc.page.margins.left;
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    values.forEach((v, idx) => {
      doc.text(String(v ?? ''), x, y, { width: colWidths[idx], ellipsis: true });
      x += colWidths[idx];
    });
    doc.moveDown(1.1);
    doc.moveTo(doc.page.margins.left, doc.y - 2).lineTo(doc.page.width - doc.page.margins.right, doc.y - 2).strokeColor('#e5e7eb').stroke();
    doc.strokeColor('#000000');
  };

  drawRow(headers, true);

  (data || []).forEach((c) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
      drawRow(headers, true);
    }
    drawRow([
      c.nom,
      c.prenom,
      c.poste,
      c.service,
      c.contrat,
      c.status,
    ]);
  });

  doc.end();
};

const exportCongesXlsx = async (req, res) => {
  const { data, error } = await supabase
    .from('conges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Dashboard RH';
  wb.created = new Date();

  const ws = wb.addWorksheet('Congés');
  ws.columns = [
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Début', key: 'date_debut', width: 12 },
    { header: 'Fin', key: 'date_fin', width: 12 },
    { header: 'Statut', key: 'statut', width: 12 },
    { header: 'Motif', key: 'motif', width: 30 },
    { header: 'Créé par', key: 'created_by', width: 36 },
    { header: 'Validé par', key: 'validated_by', width: 36 },
    { header: 'Validé le', key: 'validated_at', width: 20 },
  ];
  ws.getRow(1).font = { bold: true };

  (data || []).forEach((c) => {
    ws.addRow({
      type: c.type ?? '',
      date_debut: c.date_debut ? String(c.date_debut).slice(0, 10) : '',
      date_fin: c.date_fin ? String(c.date_fin).slice(0, 10) : '',
      statut: c.statut ?? '',
      motif: c.motif ?? '',
      created_by: c.created_by ?? '',
      validated_by: c.validated_by ?? '',
      validated_at: c.validated_at ? new Date(c.validated_at).toLocaleString('fr-FR') : '',
    });
  });

  const filename = `conges_${isoDate()}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await wb.xlsx.write(res);
  res.end();
};

const exportCongesPdf = async (req, res) => {
  const { data, error } = await supabase
    .from('conges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const filename = `conges_${isoDate()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text('Demandes de congés', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#6b7280').text(`Généré le ${new Date().toLocaleString('fr-FR')}`);
  doc.moveDown(1);
  doc.fillColor('#111827');

  const headers = ['Type', 'Début', 'Fin', 'Statut', 'Motif'];
  const colWidths = [90, 60, 60, 60, 210];

  const drawRow = (values, isHeader = false) => {
    const y = doc.y;
    let x = doc.page.margins.left;
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    values.forEach((v, idx) => {
      doc.text(String(v ?? ''), x, y, { width: colWidths[idx], ellipsis: true });
      x += colWidths[idx];
    });
    doc.moveDown(1.1);
    doc.moveTo(doc.page.margins.left, doc.y - 2).lineTo(doc.page.width - doc.page.margins.right, doc.y - 2).strokeColor('#e5e7eb').stroke();
    doc.strokeColor('#000000');
  };

  drawRow(headers, true);
  (data || []).forEach((c) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
      drawRow(headers, true);
    }
    drawRow([
      c.type,
      c.date_debut ? String(c.date_debut).slice(0, 10) : '',
      c.date_fin ? String(c.date_fin).slice(0, 10) : '',
      c.statut,
      c.motif,
    ]);
  });

  doc.end();
};

const exportRecrutementXlsx = async (req, res) => {
  const { data, error } = await supabase
    .from('candidats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Dashboard RH';
  wb.created = new Date();

  const ws = wb.addWorksheet('Recrutement');
  ws.columns = [
    { header: 'Nom', key: 'nom', width: 18 },
    { header: 'Prénom', key: 'prenom', width: 18 },
    { header: 'Poste', key: 'poste', width: 22 },
    { header: 'Statut', key: 'statut', width: 14 },
    { header: 'Date', key: 'date_candidature', width: 12 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Téléphone', key: 'telephone', width: 16 },
    { header: 'Source', key: 'source', width: 18 },
  ];
  ws.getRow(1).font = { bold: true };

  (data || []).forEach((c) => {
    ws.addRow({
      nom: c.nom ?? '',
      prenom: c.prenom ?? '',
      poste: c.poste ?? '',
      statut: c.statut ?? '',
      date_candidature: c.date_candidature ? String(c.date_candidature).slice(0, 10) : '',
      email: c.email ?? '',
      telephone: c.telephone ?? '',
      source: c.source ?? '',
    });
  });

  const filename = `recrutement_${isoDate()}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await wb.xlsx.write(res);
  res.end();
};

const exportRecrutementPdf = async (req, res) => {
  const { data, error } = await supabase
    .from('candidats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const filename = `recrutement_${isoDate()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text('Pipeline recrutement', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#6b7280').text(`Généré le ${new Date().toLocaleString('fr-FR')}`);
  doc.moveDown(1);
  doc.fillColor('#111827');

  const headers = ['Nom', 'Prénom', 'Poste', 'Statut', 'Date'];
  const colWidths = [100, 90, 150, 70, 60];

  const drawRow = (values, isHeader = false) => {
    const y = doc.y;
    let x = doc.page.margins.left;
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    values.forEach((v, idx) => {
      doc.text(String(v ?? ''), x, y, { width: colWidths[idx], ellipsis: true });
      x += colWidths[idx];
    });
    doc.moveDown(1.1);
    doc.moveTo(doc.page.margins.left, doc.y - 2).lineTo(doc.page.width - doc.page.margins.right, doc.y - 2).strokeColor('#e5e7eb').stroke();
    doc.strokeColor('#000000');
  };

  drawRow(headers, true);
  (data || []).forEach((c) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
      drawRow(headers, true);
    }
    drawRow([
      c.nom,
      c.prenom,
      c.poste,
      c.statut,
      c.date_candidature ? String(c.date_candidature).slice(0, 10) : '',
    ]);
  });

  doc.end();
};

module.exports = {
  exportCollaborateursXlsx,
  exportCollaborateursPdf,
  exportCongesXlsx,
  exportCongesPdf,
  exportRecrutementXlsx,
  exportRecrutementPdf,
};

