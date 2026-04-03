const supabase = require('../db/supabaseClient');

const getStats = async (req, res) => {
  try {
    const { count: total, error: totalError } = await supabase
      .from('collaborateurs')
      .select('*', { count: 'exact', head: true });
    if (totalError) return res.status(500).json({ error: totalError.message });

    const { count: suspenduCount, error: suspenduError } = await supabase
      .from('collaborateurs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Suspendu');
    if (suspenduError) return res.status(500).json({ error: suspenduError.message });

    // KPI calculés sur les collaborateurs "actifs"
    const { data: actifs, error: actifsError } = await supabase
      .from('collaborateurs')
      .select('service, contrat, date_embauche, status')
      .not('status', 'eq', 'Suspendu');
    if (actifsError) return res.status(500).json({ error: actifsError.message });

    const services = (actifs || []).reduce((acc, c) => {
      const key = c.service || 'Non renseigné';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const contrats = (actifs || []).reduce((acc, c) => {
      const key = c.contrat || 'Non renseigné';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const ancienneteBuckets = [
      { range: '0-6 mois', minDays: 0, maxDays: 183, count: 0 },
      { range: '6-12 mois', minDays: 183, maxDays: 365, count: 0 },
      { range: '1-3 ans', minDays: 365, maxDays: 1095, count: 0 },
      { range: '3-5 ans', minDays: 1095, maxDays: 1825, count: 0 },
      { range: '5+ ans', minDays: 1825, maxDays: Infinity, count: 0 },
    ];

    let ancienneteSumDays = 0;
    let ancienneteCount = 0;
    const now = Date.now();

    for (const c of actifs || []) {
      if (!c.date_embauche) continue;
      const embaucheMs = new Date(c.date_embauche).getTime();
      if (Number.isNaN(embaucheMs)) continue;

      const diffDays = (now - embaucheMs) / (1000 * 60 * 60 * 24);
      if (diffDays < 0) continue;

      ancienneteSumDays += diffDays;
      ancienneteCount += 1;

      const bucket = ancienneteBuckets.find(b => diffDays >= b.minDays && diffDays < b.maxDays);
      if (bucket) bucket.count += 1;
    }

    const ancienneteMoyenne = ancienneteCount ? Math.round(ancienneteSumDays / ancienneteCount) : 0;
    const actifCount = (actifs || []).length;
    const suspendu = suspenduCount ?? Math.max(0, (total ?? 0) - actifCount);

    res.json({
      total: total ?? 0,
      services,
      contrats,
      anciennete: ancienneteBuckets.map(({ range, count }) => ({ range, count })),
      ancienneteMoyenne,
      status: {
        actif: actifCount,
        suspendu,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getStats };
