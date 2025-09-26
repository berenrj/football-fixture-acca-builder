import { ref } from "vue";

const baseUrl = "https://raw.githubusercontent.com/openfootball/football.json/master/2025-26/";

const leagueFiles = {
    "Premier League": "en.1.json",
    "Championship": "en.2.json",
    "La Liga": "es.1.json",
    "Bundesliga": "de.1.json",
    "Serie A": "it.1.json",
    "Ligue 1": "fr.1.json",
    "Eredivisie": "nl.1.json",
    "Primeira Liga": "pt.1.json",
    "Scottish Prem": "sco.1.json",
    "Süper Lig": "tr.1.json"
}

function normaliseFixtureData(data, leagueName) {
    const fixtures = [];
    const matches = data.matches || [];

    matches.forEach(m => {
        const dateObj = m.time ? new Date(`${m.date}T${m.time}`) : new Date(m.date);
        fixtures.push({
            league: leagueName,
            date: dateObj,
            kickoff: m.time || "TBD",
            home: m.team1,
            away: m.team2,
            prediction: null,
            selected: null
        });
    });

    // sort fixtures by date
    fixtures.sort((a,b) => a.date - b.date);

    return fixtures;
}

export function useFixtures() {
    const leagues = ref([]);
    const isLoading = ref(false);

    async function fetchFixtures() {
        isLoading.value = true;
        const results = [];

        for (const [name, file] of Object.entries(leagueFiles)) {

            const url = `${baseUrl}${file}?t=${Date.now()}`;

            try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const data = await res.json();
                const fixtures = normaliseFixtureData(data, name);

                results.push({ name, fixtures });

            } catch (err) {
                console.error(`Failed to fetch ${name} data`, err);
            }
        }

        leagues.value = results;
        isLoading.value = false;
    }

    return { leagues, isLoading, fetchFixtures };
}