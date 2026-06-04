/** Helpers UI rôles RH / Manager / Collaborateur (filtrage affichage uniquement). */

export const getUserService = (user) =>
  user?.service ?? user?.user_metadata?.service ?? null;

const ANCIENNETE_BUCKETS = [
  { range: '0-6 mois', minDays: 0, maxDays: 183, count: 0 },
  { range: '6-12 mois', minDays: 183, maxDays: 365, count: 0 },
  { range: '1-3 ans', minDays: 365, maxDays: 1095, count: 0 },
  { range: '3-5 ans', minDays: 1095, maxDays: 1825, count: 0 },
  { range: '5+ ans', minDays: 1825, maxDays: Infinity, count: 0 },
];

/** KPI dashboard limités au service du manager. */
export const filterDashboardStatsForManager = (stats, managerService, actifsInService = null) => {
  if (!managerService) return stats;

  if (actifsInService?.length) {
    const contrats = actifsInService.reduce((acc, c) => {
      const key = c.contrat || 'Non renseigné';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const ancienneteBuckets = ANCIENNETE_BUCKETS.map((b) => ({ range: b.range, count: 0 }));

    let ancienneteSumDays = 0;
    let ancienneteCount = 0;
    const now = Date.now();

    for (const c of actifsInService) {
      if (!c.date_embauche) continue;
      const embaucheMs = new Date(c.date_embauche).getTime();
      if (Number.isNaN(embaucheMs)) continue;
      const diffDays = (now - embaucheMs) / (1000 * 60 * 60 * 24);
      if (diffDays < 0) continue;
      ancienneteSumDays += diffDays;
      ancienneteCount += 1;
      const bucket = ANCIENNETE_BUCKETS.find((b) => diffDays >= b.minDays && diffDays < b.maxDays);
      if (bucket) {
        const target = ancienneteBuckets.find((x) => x.range === bucket.range);
        if (target) target.count += 1;
      }
    }

    const actifCount = actifsInService.filter((c) => c.status !== 'Suspendu').length;
    const suspenduInService = actifsInService.filter((c) => c.status === 'Suspendu').length;

    return {
      total: actifCount + suspenduInService,
      services: actifCount ? { [managerService]: actifCount } : {},
      contrats,
      anciennete: ancienneteBuckets,
      ancienneteMoyenne: ancienneteCount ? Math.round(ancienneteSumDays / ancienneteCount) : 0,
      status: { actif: actifCount, suspendu: suspenduInService },
    };
  }

  const teamCount = stats.services?.[managerService] ?? 0;
  return {
    ...stats,
    total: teamCount,
    services: teamCount ? { [managerService]: teamCount } : {},
    status: {
      actif: teamCount,
      suspendu: 0,
    },
  };
};

/** IDs auth des collaborateurs du même service (user_id ou id de fiche). */
export const buildTeamUserIdSet = (collaborateurs, managerService) => {
  const ids = new Set();
  for (const c of collaborateurs || []) {
    if (c.service !== managerService) continue;
    if (c.user_id) ids.add(c.user_id);
    if (c.id) ids.add(c.id);
  }
  return ids;
};

export const filterCongesForManagerTeam = (items, teamUserIds) => {
  if (!teamUserIds?.size) return [];
  return items.filter((it) => teamUserIds.has(it.created_by));
};
