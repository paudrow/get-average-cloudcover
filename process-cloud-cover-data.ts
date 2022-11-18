import { z } from "https://deno.land/x/zod/mod.ts";
import dayjs from "npm:dayjs";
import { readCSV } from "https://deno.land/x/csv/mod.ts";

const CsvRow = z.object({
  date: z.string(),
  time: z.preprocess((s) => Number(s), z.number().int()),
  cloudCover: z.preprocess(
    (s) => Number.parseFloat(s as string),
    z.number().gte(0).lte(1),
  ),
});

type CsvRow = z.infer<typeof CsvRow>;

const fileName = "cloud-cover.csv";
const excludeStartHour = 6;
const excludeEndHour = 18;

const data: CsvRow[] = [];
const f = await Deno.open(fileName);
for await (const row of readCSV(f, { fromLine: 1 })) {
  const rowList = [];
  for await (const cell of row) {
    rowList.push(cell);
  }
  const [date, time, cloudCover] = rowList;
  const parsedRow = CsvRow.parse({ date, time, cloudCover });
  const hour = dayjs.unix(parsedRow.time).hour();
  if (hour < excludeStartHour || hour > excludeEndHour) {
    data.push(parsedRow);
  }
}
f.close();

const dateMap = new Map<string, Omit<CsvRow, "date">[]>();
for (const { date, time, cloudCover } of data) {
  dateMap.set(date, [...(dateMap.get(date) || []), { time, cloudCover }]);
}

const maxCloudCoverage: CsvRow[] = [];
for (const [date, rows] of dateMap.entries()) {
  const sorted = rows.sort((a, b) => b.cloudCover - a.cloudCover);
  maxCloudCoverage.push({
    date,
    time: sorted[0].time,
    cloudCover: sorted[0].cloudCover,
  });
}

console.log(maxCloudCoverage);
for (const row of maxCloudCoverage) {
  console.log(row);
}
