import { z } from "https://deno.land/x/zod@v3.19.1/mod.ts";
import dayjs from "npm:dayjs";
import { CSVWriter } from "https://deno.land/x/csv@v0.8.0/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";

const GetWeatherProps = z.object({
  lat: z.number(),
  long: z.number(),
  time: z.number().int().positive(),
});

const DarkSkyTimeMachine = z.object({
  currently: z.object({
    cloudCover: z.number(),
  }),
});

type GetWeatherProps = z.infer<typeof GetWeatherProps>;

const darkskyApiKey = Deno.env.get("DARKSKY_API_KEY")!;
const darkskyHostUrl = Deno.env.get("DARKSKY_HOST_URL")!;

async function getWeather(props: GetWeatherProps) {
  const { lat, long, time } = GetWeatherProps.parse(props);

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": darkskyApiKey,
      "X-RapidAPI-Host": darkskyHostUrl,
    },
  };

  const jsonResponse = await fetch(
    `https://${darkskyHostUrl}/${lat},${long},${time}`,
    options,
  );
  return DarkSkyTimeMachine.parse(await jsonResponse.json());
}

function getUnixTimestampsForDay(day: dayjs.Dayjs) {
  const timestamps = [];
  for (let i = 0; i < 24; i++) {
    timestamps.push(day.hour(i).unix());
  }
  return timestamps;
}

function getDatesBetween(start: dayjs.Dayjs, end: dayjs.Dayjs) {
  return Array.from(
    { length: end.diff(start, "day") + 1 },
    (_, i) => dayjs(start).add(i, "day"),
  );
}

async function main() {
  // washington depot, ct
  // const lat = 41.65151;
  // const long = -73.35630;

  // leakey, texas
  // const lat = 29.82915;
  // const long = -99.69464;

  // pipe creek, texas
  // const lat = 29.72
  // const long = -98.93

  // big bend national park
  const lat = 29.25;
  const long = -103.25;

  const startDay = dayjs("2021-11-16");
  const endDay = dayjs("2022-11-16");
  const dates = getDatesBetween(startDay, endDay);

  const f = await Deno.open("./cloud-cover-big-bend-np.csv", {
    write: true,
    create: true,
    truncate: true,
  });
  const writer = new CSVWriter(f);
  await writer.writeCell("date");
  await writer.writeCell("time");
  await writer.writeCell("cloud cover");
  await writer.nextLine();
  for await (const date of dates) {
    const timestamps = getUnixTimestampsForDay(date);
    console.log(`Getting weather for ${date.format("YYYY-MM-DD")}`);

    for await (const timestamp of timestamps) {
      const weather = await getWeather({ lat, long, time: timestamp });
      await writer.writeCell(date.format("YYYY-MM-DD"));
      await writer.writeCell(timestamp.toString());
      await writer.writeCell(weather.currently.cloudCover.toString());
      await writer.nextLine();
    }
  }
  f.close();
}

await main();
