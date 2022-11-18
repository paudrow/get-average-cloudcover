# README

## Setup

Install [Deno](https://deno.land/)

Register with [Dark Sky API](https://darksky.net/dev) and get an API key.
I did this using [Rapid API](https://rapidapi.com).

You'll need to expose the API key and host url as environment variables.
To do this, you can create a `.env` file in the root of the project.
You can see an example in `.env.example`.

## Usage

Run `deno run -A get-cloud-cover-data.ts` to get the cloud data for a range of
dates. You can then look at the maximum cloud cover for each day by running
`deno run -A process-cloud-cover-data.ts`. Note that both files have
configuration inside of the file.

There is also a bunch of already scraped data in the `data` directory.
