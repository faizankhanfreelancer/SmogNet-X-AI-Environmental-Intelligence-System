import { Router, type IRouter } from "express";
import { db, readingsTable, spikesTable, alertsTable } from "@workspace/db";
import {
  GetStatsResponse,
  GetCityStatsResponse,
  GetReadingsResponse,
  GetSpikesResponse,
  GetAlertsResponse,
  GetClassificationsResponse,
  GetTimelineResponse,
  GetPollutantTrendsResponse,
  GetSourceDistributionResponse,
  GetCityRankingsResponse,
  GetReadingsQueryParams,
  GetSpikesQueryParams,
  GetAlertsQueryParams,
  GetClassificationsQueryParams,
  GetTimelineQueryParams,
  GetPollutantTrendsQueryParams,
  GetSourceDistributionQueryParams,
} from "@workspace/api-zod";
import { sql, eq, desc, and, gte } from "drizzle-orm";

const router: IRouter = Router();

const CITIES = [
  { city: "Lahore", province: "Punjab" },
  { city: "Karachi", province: "Sindh" },
  { city: "Islamabad", province: "Federal" },
  { city: "Peshawar", province: "KPK" },
  { city: "Multan", province: "Punjab" },
  { city: "Faisalabad", province: "Punjab" },
  { city: "Quetta", province: "Balochistan" },
  { city: "Rawalpindi", province: "Punjab" },
];

const SOURCES = [
  "Crop Burning",
  "Vehicular",
  "Industrial",
  "Dust Storm",
  "Mixed",
];

router.get("/air-quality/stats", async (req, res): Promise<void> => {
  const [agg] = await db
    .select({
      avgAqi: sql<number>`avg(${readingsTable.aqi})`,
      avgPm25: sql<number>`avg(${readingsTable.pm25})`,
      avgPm10: sql<number>`avg(${readingsTable.pm10})`,
      totalReadings: sql<number>`count(*)`,
    })
    .from(readingsTable);

  const [spikeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(spikesTable)
    .where(eq(spikesTable.isAnomaly, true));

  const [alertCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(alertsTable);

  const cityAqis = await db
    .select({
      city: readingsTable.city,
      avgAqi: sql<number>`avg(${readingsTable.aqi})`,
    })
    .from(readingsTable)
    .groupBy(readingsTable.city)
    .orderBy(sql`avg(${readingsTable.aqi}) desc`);

  const criticalCities = cityAqis.filter((c) => Number(c.avgAqi) > 150).length;
  const mostPolluted = cityAqis[0]?.city ?? "N/A";
  const cleanest = cityAqis[cityAqis.length - 1]?.city ?? "N/A";

  const result = {
    avgAqi: Math.round(Number(agg?.avgAqi ?? 0) * 10) / 10,
    avgPm25: Math.round(Number(agg?.avgPm25 ?? 0) * 10) / 10,
    avgPm10: Math.round(Number(agg?.avgPm10 ?? 0) * 10) / 10,
    totalReadings: Number(agg?.totalReadings ?? 0),
    totalSpikes: Number(spikeCount?.count ?? 0),
    totalAlerts: Number(alertCount?.count ?? 0),
    criticalCities,
    mostPollutedCity: mostPolluted,
    cleanestCity: cleanest,
  };

  res.json(GetStatsResponse.parse(result));
});

router.get("/air-quality/city-stats", async (req, res): Promise<void> => {
  const cityAggs = await db
    .select({
      city: readingsTable.city,
      avgAqi: sql<number>`round(avg(${readingsTable.aqi})::numeric, 1)`,
      avgPm25: sql<number>`round(avg(${readingsTable.pm25})::numeric, 1)`,
      avgPm10: sql<number>`round(avg(${readingsTable.pm10})::numeric, 1)`,
      avgCo: sql<number>`round(avg(${readingsTable.co})::numeric, 2)`,
      avgO3: sql<number>`round(avg(${readingsTable.o3})::numeric, 1)`,
      avgNox: sql<number>`round(avg(${readingsTable.nox})::numeric, 1)`,
      readingCount: sql<number>`count(*)`,
    })
    .from(readingsTable)
    .groupBy(readingsTable.city);

  const spikesByCity = await db
    .select({
      city: spikesTable.city,
      count: sql<number>`count(*)`,
    })
    .from(spikesTable)
    .where(eq(spikesTable.isAnomaly, true))
    .groupBy(spikesTable.city);

  const alertsByCity = await db
    .select({
      city: alertsTable.city,
      count: sql<number>`count(*)`,
    })
    .from(alertsTable)
    .groupBy(alertsTable.city);

  const primarySourceByCity = await db
    .select({
      city: alertsTable.city,
      source: alertsTable.source,
      count: sql<number>`count(*)`,
    })
    .from(alertsTable)
    .groupBy(alertsTable.city, alertsTable.source)
    .orderBy(sql`count(*) desc`);

  const spikeMap = Object.fromEntries(spikesByCity.map((s) => [s.city, Number(s.count)]));
  const alertMap = Object.fromEntries(alertsByCity.map((a) => [a.city, Number(a.count)]));

  const primarySourceMap: Record<string, string> = {};
  for (const row of primarySourceByCity) {
    if (!primarySourceMap[row.city]) {
      primarySourceMap[row.city] = row.source;
    }
  }

  const data = cityAggs.map((row) => {
    const cityInfo = CITIES.find((c) => c.city === row.city);
    return {
      city: row.city,
      province: cityInfo?.province ?? "Unknown",
      avgAqi: Number(row.avgAqi),
      avgPm25: Number(row.avgPm25),
      avgPm10: Number(row.avgPm10),
      avgCo: Number(row.avgCo),
      avgO3: Number(row.avgO3),
      avgNox: Number(row.avgNox),
      spikeCount: spikeMap[row.city] ?? 0,
      alertCount: alertMap[row.city] ?? 0,
      primarySource: primarySourceMap[row.city] ?? "Mixed",
      readingCount: Number(row.readingCount),
    };
  });

  res.json(GetCityStatsResponse.parse(data));
});

router.get("/air-quality/readings", async (req, res): Promise<void> => {
  const parsed = GetReadingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { city, limit = 50, offset = 0 } = parsed.data;

  const conditions = city ? [eq(readingsTable.city, city)] : [];

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(readingsTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const rows = await db
    .select()
    .from(readingsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(readingsTable.timestamp))
    .limit(limit)
    .offset(offset);

  const data = rows.map((r) => ({
    ...r,
    timestamp: r.timestamp.toISOString(),
  }));

  res.json(GetReadingsResponse.parse({ data, total: Number(countRow?.count ?? 0), limit, offset }));
});

router.get("/air-quality/spikes", async (req, res): Promise<void> => {
  const parsed = GetSpikesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { city, limit = 50 } = parsed.data;
  const conditions = city ? [eq(spikesTable.city, city)] : [];

  const rows = await db
    .select()
    .from(spikesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(spikesTable.timestamp))
    .limit(limit);

  const data = rows.map((r) => ({
    ...r,
    timestamp: r.timestamp.toISOString(),
  }));

  res.json(GetSpikesResponse.parse(data));
});

router.get("/air-quality/alerts", async (req, res): Promise<void> => {
  const parsed = GetAlertsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { city, severity } = parsed.data;
  const conditions = [];
  if (city) conditions.push(eq(alertsTable.city, city));
  if (severity) conditions.push(eq(alertsTable.severity, severity));

  const rows = await db
    .select()
    .from(alertsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(alertsTable.createdAt));

  const data = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(GetAlertsResponse.parse(data));
});

router.get("/air-quality/classifications", async (req, res): Promise<void> => {
  const parsed = GetClassificationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { city } = parsed.data;
  const conditions = city ? [eq(alertsTable.city, city)] : [];

  const rows = await db
    .select({
      city: alertsTable.city,
      source: alertsTable.source,
      count: sql<number>`count(*)`,
    })
    .from(alertsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(alertsTable.city, alertsTable.source);

  const totalByCity: Record<string, number> = {};
  for (const r of rows) {
    totalByCity[r.city] = (totalByCity[r.city] ?? 0) + Number(r.count);
  }

  const data = rows.map((r) => ({
    city: r.city,
    source: r.source,
    count: Number(r.count),
    percentage: Math.round((Number(r.count) / (totalByCity[r.city] ?? 1)) * 1000) / 10,
  }));

  res.json(GetClassificationsResponse.parse(data));
});

router.get("/air-quality/timeline", async (req, res): Promise<void> => {
  const parsed = GetTimelineQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { city, days = 30 } = parsed.data;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const conditions = [gte(spikesTable.timestamp, since)];
  if (city) conditions.push(eq(spikesTable.city, city));

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${spikesTable.timestamp})::date::text`,
      spikeCount: sql<number>`count(*)`,
    })
    .from(spikesTable)
    .where(and(...conditions))
    .groupBy(sql`date_trunc('day', ${spikesTable.timestamp})`)
    .orderBy(sql`date_trunc('day', ${spikesTable.timestamp})`);

  const avgRows = await db
    .select({
      date: sql<string>`date_trunc('day', ${readingsTable.timestamp})::date::text`,
      avgAqi: sql<number>`round(avg(${readingsTable.aqi})::numeric, 1)`,
    })
    .from(readingsTable)
    .where(city ? and(gte(readingsTable.timestamp, since), eq(readingsTable.city, city)) : gte(readingsTable.timestamp, since))
    .groupBy(sql`date_trunc('day', ${readingsTable.timestamp})`)
    .orderBy(sql`date_trunc('day', ${readingsTable.timestamp})`);

  const avgMap = Object.fromEntries(avgRows.map((r) => [r.date, Number(r.avgAqi)]));

  const data = rows.map((r) => ({
    date: r.date,
    spikeCount: Number(r.spikeCount),
    avgAqi: avgMap[r.date] ?? 0,
    city: city ?? null,
  }));

  res.json(GetTimelineResponse.parse(data));
});

router.get("/air-quality/pollutant-trends", async (req, res): Promise<void> => {
  const parsed = GetPollutantTrendsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { city, days = 30 } = parsed.data;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const conditions = [gte(readingsTable.timestamp, since)];
  if (city) conditions.push(eq(readingsTable.city, city));

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${readingsTable.timestamp})::date::text`,
      pm25: sql<number>`round(avg(${readingsTable.pm25})::numeric, 1)`,
      pm10: sql<number>`round(avg(${readingsTable.pm10})::numeric, 1)`,
      aqi: sql<number>`round(avg(${readingsTable.aqi})::numeric, 1)`,
    })
    .from(readingsTable)
    .where(and(...conditions))
    .groupBy(sql`date_trunc('day', ${readingsTable.timestamp})`)
    .orderBy(sql`date_trunc('day', ${readingsTable.timestamp})`);

  const data = rows.map((r) => ({
    date: r.date,
    pm25: Number(r.pm25),
    pm10: Number(r.pm10),
    aqi: Number(r.aqi),
    city: city ?? null,
  }));

  res.json(GetPollutantTrendsResponse.parse(data));
});

router.get("/air-quality/source-distribution", async (req, res): Promise<void> => {
  const parsed = GetSourceDistributionQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { city } = parsed.data;
  const conditions = city ? [eq(alertsTable.city, city)] : [];

  const rows = await db
    .select({
      source: alertsTable.source,
      count: sql<number>`count(*)`,
    })
    .from(alertsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(alertsTable.source);

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

  const data = rows.map((r) => ({
    source: r.source,
    count: Number(r.count),
    percentage: Math.round((Number(r.count) / (total || 1)) * 1000) / 10,
  }));

  res.json(GetSourceDistributionResponse.parse(data));
});

router.get("/air-quality/city-rankings", async (req, res): Promise<void> => {
  const cityAggs = await db
    .select({
      city: readingsTable.city,
      avgAqi: sql<number>`round(avg(${readingsTable.aqi})::numeric, 1)`,
      avgPm25: sql<number>`round(avg(${readingsTable.pm25})::numeric, 1)`,
    })
    .from(readingsTable)
    .groupBy(readingsTable.city)
    .orderBy(sql`avg(${readingsTable.aqi}) desc`);

  const spikesByCity = await db
    .select({
      city: spikesTable.city,
      count: sql<number>`count(*)`,
    })
    .from(spikesTable)
    .where(eq(spikesTable.isAnomaly, true))
    .groupBy(spikesTable.city);

  const primarySourceByCity = await db
    .select({
      city: alertsTable.city,
      source: alertsTable.source,
      count: sql<number>`count(*)`,
    })
    .from(alertsTable)
    .groupBy(alertsTable.city, alertsTable.source)
    .orderBy(sql`count(*) desc`);

  const spikeMap = Object.fromEntries(spikesByCity.map((s) => [s.city, Number(s.count)]));

  const primarySourceMap: Record<string, string> = {};
  for (const row of primarySourceByCity) {
    if (!primarySourceMap[row.city]) {
      primarySourceMap[row.city] = row.source;
    }
  }

  const data = cityAggs.map((row, i) => {
    const cityInfo = CITIES.find((c) => c.city === row.city);
    return {
      rank: i + 1,
      city: row.city,
      province: cityInfo?.province ?? "Unknown",
      avgAqi: Number(row.avgAqi),
      avgPm25: Number(row.avgPm25),
      primarySource: primarySourceMap[row.city] ?? "Mixed",
      spikeCount: spikeMap[row.city] ?? 0,
    };
  });

  res.json(GetCityRankingsResponse.parse(data));
});

export default router;
