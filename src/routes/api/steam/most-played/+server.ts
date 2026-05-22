import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    const response = await fetch(
      'https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/'
    );

    if (!response.ok) {
      throw new Error(`Steam API error ${response.status}`);
    }

    const data = await response.json();

    return json(data.response.ranks);
  } catch (err) {
    return json({ error: 'Failed to fetch Steam data' }, { status: 500 });
  }
}