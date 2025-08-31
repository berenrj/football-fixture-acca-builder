<script>
import PredictionItem from "./PredictionItem.vue";
import { useFixtures } from "../composables/useFixtures";

export default {
  name: "AccumulatorBuilder",
  components: { PredictionItem },
  setup() {
    const { leagues, isLoading, fetchFixtures } = useFixtures();  

    return {
      leagues,
      isLoading,
      fetchFixtures
    };
  },
  data() {
    return {
      activeTab: 0,
      predictions: [],
      dateRange: 3, // default is 3 days ahead
      leagueFlags: {
        "Premier League": new URL('@/assets/img/flags/gb-eng.png', import.meta.url).href,
        "Championship": new URL('@/assets/img/flags/gb-eng.png', import.meta.url).href,
        "La Liga": new URL('@/assets/img/flags/es.png', import.meta.url).href,
        "Bundesliga": new URL('@/assets/img/flags/de.png', import.meta.url).href,
        "Serie A": new URL('@/assets/img/flags/it.png', import.meta.url).href,
        "Ligue 1": new URL('@/assets/img/flags/fr.png', import.meta.url).href,
        "Eredivisie": new URL('@/assets/img/flags/nl.png', import.meta.url).href,
        "Primeira Liga": new URL('@/assets/img/flags/pt.png', import.meta.url).href,
        "Scottish Prem": new URL('@/assets/img/flags/gb-sct.png', import.meta.url).href,
        "Süper Lig": new URL('@/assets/img/flags/tr.png', import.meta.url).href  
      }      
    };
  },
  mounted() {
    this.fetchFixtures();
  }, 
  computed: {
    filteredLeagues() {
      const today = new Date();
      today.setHours(0,0,0,0);

      const limit = new Date(today);
      limit.setDate(today.getDate() + this.dateRange);
      limit.setHours(23,59,59,999);

      return this.leagues.map(league => {
        // filter fixtures to within date range
        const fixtures = league.fixtures.filter(f => {

          //console.log("Checking: ", f.home, " v ", f.away, " -> ", f.date);
          
          if (!(f.date instanceof Date)) return false;

          return f.date >= today && f.date <= limit;

        });

        // group fixtures by day
        const grouped = {};
        fixtures.forEach(f => {

          const dateKey = f.date.toDateString();
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(f);

        });

        return { ...league, groupedFixtures: grouped };
      });
    },
    totalPredictions() {
      return this.predictions.length > 0 ? this.predictions.length : 'N/A';
    }
  },
  methods: {
    togglePrediction(fixture, result) {
      if (fixture.selected === result) {
        // same button clicked, deselect it
        fixture.selected = null;
        this.predictions = this.predictions.filter(
          (p) => !p.label.includes(`${fixture.home} v ${fixture.away}`)
        );
      } else {
        // different button clicked, switch the selection
        fixture.selected = result;

        // remove any existing prediction for this fixture first
        this.predictions = this.predictions.filter(
          (p) => !p.label.includes(`${fixture.home} v ${fixture.away}`)
        );        

        // add new prediction
        const label =
          result === "Draw"
            ? `<strong>Draw</strong><br><small>(${fixture.home} v ${fixture.away})</small>`
            : `<strong>${fixture[result.toLowerCase()]}</strong><br><small>(${fixture.home} v ${fixture.away})</small>`;

        this.predictions.push({ label, confidence: 50 });
      }
    },
    removePrediction(index) {
      // remove index from predictions
      const removed = this.predictions.splice(index, 1)[0];

      // find the fixture that matches this prediction and reset its selected state
      this.leagues.forEach((league) => {
        league.fixtures.forEach((fixture) => {
          const labelHome = `${fixture.home} v ${fixture.away}`;
          if (removed.label.includes(labelHome)) {
            fixture.selected = null;
          }
        });
      });
    },
    updateConfidence(index, value) {
      this.predictions[index].confidence = value;
    },
    sortPredictions() {
      this.predictions.sort((a, b) => b.confidence - a.confidence);
    },
    isPastKickoff(fixture) {
      const now = new Date();
      const kickoff = new Date(`${fixture.date.toISOString().split('T')[0]}T${fixture.kickoff}`);
      return kickoff < now;
    }
  },
};
</script>

<template>
  <div class="container-fluid">
    <!-- Banner -->
    <div class="row bg-info bg-gradient border-light rounded-bottom border-bottom text-white text-start py-2">
      <div class="col d-flex justify-content-between align-items-center">
        <h4 class="">Football Fixtures Accumulator Builder</h4>
        <img src="@/assets/img/icons/soccer-ball-apple-96.png" alt="Logo" style="height: 40px;">
      </div>
    </div>

    <div class="row mt-2">
      <!-- Left Content Area -->
      <div class="col-md-8 border-end">
        <h5 class="pt-1 pb-1 px-0 border-bottom border-light">Fixtures</h5>

        <!-- Date Range Filter Buttons -->
        <div class="btn-group mb-2">
          <button v-for="range in [0,3,5,7]" :key="range"
            class="btn fw-bold"
            :class="dateRange === range ? 'btn-primary' : 'btn-outline-primary'"
            @click="dateRange = range"
          >
            {{ range === 0 ? 'Today' : range + ' Days Ahead' }}
          </button>
        </div>

        <!-- Loading Spinner -->
        <div v-if="isLoading" class="d-flex justify-content-center">
          <div class="spinner-border text-info" role="status">
          </div>
        </div>

        <!-- Tab Buttons -->
        <ul class="nav nav-tabs">
          <li class="nav-item" v-for="(league, index) in filteredLeagues" :key="index">
            <button
              class="nav-link border-light border-bottom-0 py-1 px-2"
              :class="activeTab === index ? 'active px-3 border-2 bg-gradient' : ''"
              @click="activeTab = index"
            >
              <img v-if="leagueFlags[league.name]" :src="leagueFlags[league.name]" alt="flag" class="league-flag">
              {{ league.name }}
            </button>
          </li>
        </ul>

        <!-- Tab Content -->
        <div class="tab-content bg-dark border border-top-0 rounded-bottom p-3 pb-0">

          <div v-for="(league, index) in filteredLeagues" :key="index" v-show="activeTab === index">
            <p v-if="Object.keys(league.groupedFixtures).length === 0" class="text-muted">
              No fixture data could be retrieved within the selected date range for this league.
            </p>            
            <table v-else class="table table-sm text-center">
              <tbody>
                <template v-for="(fixtures, dateKey) in league.groupedFixtures" :key="dateKey">
                  <!-- Date Header -->
                  <tr class="bg-secondary text-white text-start">
                    <td class="px-2" colspan="5">{{ dateKey }}</td>
                  </tr>

                  <!-- Column Headers -->
                  <tr class="fixtures-table-header">
                    <th>Time</th>
                    <th>Fixture</th>
                    <th>1</th>
                    <th>x</th>
                    <th>2</th>
                  </tr>

                  <!-- Fixtures -->
                  <tr v-for="(fixture, fIndex) in fixtures" :key="fIndex">
                    <td :class="{ 'text-danger': isPastKickoff(fixture) }">
                      {{ fixture.kickoff }}
                    </td>
                    <td :class="{ 'text-muted': isPastKickoff(fixture) }">
                      {{ fixture.home }} v {{ fixture.away }}
                    </td>
                    <td class="px-0">
                      <button class="btn border-light px-2"
                        :class="fixture.selected === 'Home' ? 'btn-success' : 'btn-primary'"
                        :disabled="isPastKickoff(fixture)"
                        @click="togglePrediction(fixture, 'Home')">
                        Home
                      </button>
                    </td>
                    <td class="px-0">
                      <button class="btn border-light px-2"
                        :class="fixture.selected === 'Draw' ? 'btn-success' : 'btn-primary'"
                        :disabled="isPastKickoff(fixture)"
                        @click="togglePrediction(fixture, 'Draw')">
                        Draw
                      </button>
                    </td>
                    <td class="px-0">
                      <button class="btn border-light px-2"
                        :class="fixture.selected === 'Away' ? 'btn-success' : 'btn-primary'"
                        :disabled="isPastKickoff(fixture)"
                        @click="togglePrediction(fixture, 'Away')">
                        Away
                      </button>
                    </td>                                        
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Content Area -->
      <div class="col-md-4 d-flex flex-column" style="max-height: 85vh;">
        <h5 class="pt-1 pb-1 px-0 border-bottom">Accumulator Builder</h5>
        <div class="text-center">
          <p class="p-0 mt-0 mb-2">Selections: {{ totalPredictions }}</p>
        </div>

        <!-- Placeholder Text -->
        <div v-if="predictions.length === 0" class="text-muted mb-3">
          Add result predictions to build your accumulator list here.
        </div>
        <!-- Scrollable Predictions Area -->
        <div class="flex-grow-1 overflow-auto mb-3">
          <transition-group name="prediction" tag="div">
          <!-- Predictions List -->
          <PredictionItem
            v-for="(prediction, index) in predictions"
            :key="prediction.label"
            :label="prediction.label"
            :initialConfidence="prediction.confidence"
            @remove="removePrediction(index)"
            @update-confidence="updateConfidence(index, $event)"
          />
          </transition-group>
        </div>

        <!-- Sort Button (Sticky) -->
        <div class="mt-3">
          <button class="btn btn-info w-100" 
            :class="predictions.length > 0 ? 'border-light' : ''" 
            :disabled="predictions.length === 0"
            @click="sortPredictions">
            Sort Accumulator
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
thead.fixtures-table-header th {
  background-color: #303030;
  color: #fff;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.nav-tabs .nav-link.active {
  background-color: #303030;
  color: #fff;
  font-weight: bold;
}

.prediction-enter-active,
.prediction-leave-active {
  transition: all 0.2s ease;
}

.prediction-enter-from,
.prediction-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.league-flag {
  width: 20px;
  height: auto;
  margin-right: 5px;
  vertical-align: middle;
}
</style>